import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { editorOptions, editorThemes } from './monaco-themes';
import { useTheme } from 'next-themes';

export interface ScrollPosition {
  top: number;
  left: number;
}

export interface EditorDocument {
  value: string;
  isBinary: boolean;
  filePath: string;
  scroll?: ScrollPosition;
}

export interface EditorSettings {
  fontSize?: number;
  tabSize?: number;
}

export interface EditorUpdate {
  selection: any;
  content: string;
}

export type OnChangeCallback = (update: EditorUpdate) => void;
export type OnScrollCallback = (position: ScrollPosition) => void;
export type OnSaveCallback = () => void;
export type OnMountCallback = (editor: { updateContent: (content: string) => void }) => void;

interface MonacoEditorProps {
  id?: unknown;
  doc?: EditorDocument;
  editable?: boolean;
  debounceChange?: number;
  debounceScroll?: number;
  autoFocusOnDocumentChange?: boolean;
  preserveCursorPosition?: boolean;
  onChange?: OnChangeCallback;
  onScroll?: OnScrollCallback;
  onSave?: OnSaveCallback;
  onMount?: OnMountCallback;
  className?: string;
  settings?: EditorSettings;
  theme?: 'dark' | 'light' | 'auto';
}

// Debounce utility function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const MonacoEditor = ({
  id,
  doc,
  debounceScroll = 100,
  debounceChange = 150,
  autoFocusOnDocumentChange = false,
  preserveCursorPosition = false,
  editable = true,
  onScroll,
  onChange,
  onSave,
  onMount,
  theme: customTheme,
  settings,
  className = '',
}: MonacoEditorProps) => {
  const { theme: systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const contentRef = useRef<string>('');
  const prevSelectionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const initialEditMadeRef = useRef(false);

  // Determine the current theme
  const currentTheme = customTheme === 'auto' 
    ? systemTheme
    : customTheme ?? systemTheme;
  
  const themeKey = currentTheme === 'dark' ? 'github-dark' : 'github-light';

  // Save handler with keyboard shortcut
  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  // Keep track of focus state for better handling
  const updateFocusState = useCallback((focused: boolean) => {
    setHasFocus(focused);
    
    // If editor loses focus, make sure it gets it back
    if (!focused && editorRef.current) {
      const focusBackTimeout = setTimeout(() => {
        if (editorRef.current && document.activeElement !== document.body) {
          editorRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(focusBackTimeout);
    }
  }, []);

  // Setup editor instance on mount
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Add keyboard shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Store current position/selection in a more robust way
    editor.onDidChangeCursorPosition(() => {
      if (editor) {
        prevSelectionRef.current = editor.getSelection();
      }
    });

    // Safe way to set cursor position - with validation
    const safeSetCursorPosition = (selection: any) => {
      try {
        if (!editor || !selection) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        // Validate the selection is within model bounds
        const lineCount = model.getLineCount();
        const isSelectionValid = 
          selection.startLineNumber <= lineCount &&
          selection.endLineNumber <= lineCount;
        
        if (isSelectionValid) {
          editor.setSelection(selection);
          editor.revealPositionInCenter({
            lineNumber: selection.positionLineNumber || selection.startLineNumber,
            column: selection.positionColumn || selection.startColumn
          });
        }
      } catch (error) {
        console.error('Error setting cursor position:', error);
      }
    };

    // Setup scroll handler with debounce
    const scrollHandler = debounce(() => {
      // Get the scroll position from DOM element instead
      if (editor.getContainerDomNode) {
        const container = editor.getContainerDomNode();
        if (container) {
          onScroll?.({
            top: container.scrollTop,
            left: container.scrollLeft
          });
        }
      }
    }, debounceScroll);

    editor.onDidScrollChange(scrollHandler);

    // Track focus and blur events
    editor.onDidFocusEditorText(() => {
      updateFocusState(true);
    });
    
    editor.onDidBlurEditorText(() => {
      updateFocusState(false);
    });

    // Fix focus issue - refocus editor when container is clicked
    if (containerRef.current) {
      containerRef.current.addEventListener('mousedown', () => {
        // Short delay to let the editor handle its own click events first
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
          }
        }, 10);
      });
    }

    // Expose the editor API to parent component
    if (onMount) {
      onMount({
        updateContent: (content: string) => {
          if (!editorRef.current) return;
          
          try {
            const currentContent = editorRef.current.getValue();
            if (currentContent === content) return;
            
            // Save cursor position/selection before update
            const selection = editor.getSelection();
            
            // Update content - use a safer approach to avoid null model errors
            const model = editor.getModel();
            
            if (model) {
              // Use the model's full range
              const fullRange = model.getFullModelRange();
              if (fullRange) {
                // Update with executeEdits to preserve cursor
                editor.executeEdits('external', [{
                  range: fullRange,
                  text: content,
                  forceMoveMarkers: true
                }]);
              } else {
                // Fallback to setValue if the range is unavailable
                editor.setValue(content);
              }
            } else {
              // Fallback to setValue if the model is unavailable
              editor.setValue(content);
            }
            
            contentRef.current = content;
            
            // Restore cursor position if needed
            if (preserveCursorPosition && selection) {
              // Use the safe method to restore cursor
              safeSetCursorPosition(selection);
              
              // Ensure focus is maintained
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.focus();
                }
              }, 0);
            }
          } catch (error) {
            console.error('Error in updateContent:', error);
            // Fallback to direct setValue in case of any errors
            try {
              editor.setValue(content);
              contentRef.current = content;
            } catch (e) {
              console.error('Fallback setValue also failed:', e);
            }
          }
        }
      });
    }

    // Force focus to prevent initial focus issues
    setTimeout(() => {
      editor.focus();
    }, 100);

    // Store initial content
    contentRef.current = editor.getValue();

    setMounted(true);
  }, [onMount, handleSave, debounceScroll, onScroll, preserveCursorPosition, updateFocusState]);

  // Handle editor content changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !editorRef.current) return;
    
    // Skip if content hasn't changed to avoid unnecessary updates
    if (value === contentRef.current) return;
    
    // Store the new content
    contentRef.current = value;
    
    // Get current selection and cursor position before notifying parent
    const currentSelection = editorRef.current.getSelection();
    
    // Remember selection for later use
    prevSelectionRef.current = currentSelection;
    
    // Notify parent of changes
    onChange?.({
      content: value,
      selection: currentSelection
    });
    
    // Mark that we've made an edit (helps with cursor positioning)
    initialEditMadeRef.current = true;
  }, [onChange]);

  // Apply editor settings
  const editorSettings = {
    ...editorOptions,
    fontSize: settings?.fontSize || 14,
    tabSize: settings?.tabSize || 2,
    readOnly: !editable,
    automaticLayout: true, // Important to handle container resizing properly
    fixedOverflowWidgets: true, // Fix for some focus issues
  };

  // Set scroll position when needed
  useEffect(() => {
    if (mounted && editorRef.current && doc?.scroll) {
      if (editorRef.current.getScrolledVisiblePosition) {
        // This is the correct Monaco way to set scroll position
        const scrollable = editorRef.current._scrollable;
        if (scrollable) {
          scrollable.setScrollPosition({
            scrollTop: doc.scroll.top,
            scrollLeft: doc.scroll.left
          });
        }
      }
    }
  }, [mounted, doc?.scroll]);

  // Focus editor when requested or when file changes
  useEffect(() => {
    if (mounted && editorRef.current) {
      if (autoFocusOnDocumentChange || doc?.filePath) {
        // Delay focus to ensure the DOM is ready
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            
            // Reset the initial edit flag when file changes
            initialEditMadeRef.current = false;
          }
        }, 100);
      }
    }
  }, [mounted, autoFocusOnDocumentChange, doc?.filePath]);

  // Add global document event listener to catch clicks outside editor
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // If user clicked inside our container, make sure editor gets focus
      if (containerRef.current?.contains(e.target as Node)) {
        if (editorRef.current && !hasFocus) {
          setTimeout(() => editorRef.current?.focus(), 0);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [hasFocus]);

  // Handle binary files
  if (doc?.isBinary) {
    return (
      <div className={cn("relative h-full", className)}>
        <div className="h-full w-full flex items-center justify-center bg-muted/20">
          <p className="text-muted-foreground text-sm">Cannot display binary file</p>
        </div>
      </div>
    );
  }

  // Determine language based on file extension
  const getLanguage = (filePath: string) => {
    if (!filePath) return 'javascript';
    
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'typescript';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'javascript';
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative h-full focus-within:outline-none", className)}
      onClick={() => editorRef.current?.focus()}
    >
      <Editor
        defaultLanguage={getLanguage(doc?.filePath || '')}
        value={doc?.value || ''}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={themeKey}
        options={editorSettings}
        className="h-full w-full"
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("github-dark", editorThemes.dark);
          monaco.editor.defineTheme("github-light", editorThemes.light);
        }}
        keepCurrentModel={true}
      />
    </div>
  );
};

export default MonacoEditor; 