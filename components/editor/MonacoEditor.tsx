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
            // First, check if the editor is already showing this content
            const currentEditorContent = editorRef.current.getValue();
            
            // If content is already correct, just update our reference and return
            if (currentEditorContent === content) {
              contentRef.current = content;
              return;
            }
            
            // Log the update operation
            if (process.env.NODE_ENV === 'development') {
              console.debug('Updating editor content:', {
                currentLength: currentEditorContent.length,
                newLength: content.length,
                timestamp: new Date().toISOString()
              });
            }
            
            // Save cursor position/selection before update
            const selection = editorRef.current.getSelection();
            
            // Clear any undo history to avoid issues
            try {
              const model = editorRef.current.getModel();
              if (model && model._commandManager) {
                model._commandManager.clear();
              }
            } catch (e) {
              // Ignore errors when accessing internal APIs
            }
            
            // SIMPLE APPROACH: Direct setValue is most reliable
            editorRef.current.setValue(content);
            
            // ALWAYS update our reference after changing editor content
            contentRef.current = content;
            
            // Verify the update worked correctly
            const afterContent = editorRef.current.getValue();
            if (afterContent !== content) {
              console.error('Editor content verification failed!', {
                expected: content.length,
                actual: afterContent.length
              });
              
              // Last resort retry
              setTimeout(() => {
                try {
                  editorRef.current?.setValue(content);
                  contentRef.current = content;
                } catch (e) {
                  console.error('Retry setValue failed:', e);
                }
              }, 0);
            }
            
            // Restore selection if needed
            if (preserveCursorPosition && selection) {
              try {
                // Create a new implementation of safeSetCursorPosition that uses editor ref
                const currentEditor = editorRef.current;
                if (currentEditor && selection) {
                  const model = currentEditor.getModel();
                  if (model) {
                    // Validate the selection is within model bounds
                    const lineCount = model.getLineCount();
                    const isSelectionValid = 
                      selection.startLineNumber <= lineCount &&
                      selection.endLineNumber <= lineCount;
                    
                    if (isSelectionValid) {
                      currentEditor.setSelection(selection);
                      currentEditor.revealPositionInCenter({
                        lineNumber: selection.positionLineNumber || selection.startLineNumber,
                        column: selection.positionColumn || selection.startColumn
                      });
                    }
                  }
                }
              } catch (e) {
                console.error('Error restoring cursor position:', e);
              }
              
              // Ensure focus is maintained
              setTimeout(() => {
                try {
                  editorRef.current?.focus();
                } catch (e) {
                  console.error('Error focusing editor:', e);
                }
              }, 0);
            }
          } catch (error) {
            console.error('Error in updateContent:', error);
            
            // Fallback to direct setValue as last resort
            try {
              editorRef.current.setValue(content);
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

  // Main model/content initialization when the document changes
  useEffect(() => {
    if (!mounted || !editorRef.current) return;
    
    // If doc value changed and differs from our content ref, update editor content
    if (doc?.value !== undefined && doc.value !== contentRef.current) {
      try {
        // Update content in editor
        editorRef.current.setValue(doc.value);
        
        // Update our reference
        contentRef.current = doc.value;
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('Document value changed, updating editor content:', {
            docLength: doc.value.length,
            refLength: contentRef.current.length,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating editor content on doc change:', error);
      }
    }
  }, [mounted, doc?.value]);

  // Handle editor content changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !editorRef.current) return;
    
    try {
      // ALWAYS get the actual value directly from the editor
      // This is the most critical part to avoid sync issues
      const actualEditorValue = editorRef.current.getValue();
      
      // Skip if content hasn't actually changed from our reference
      if (actualEditorValue === contentRef.current) return;
      
      // Add detailed logging to diagnose sync issues
      if (process.env.NODE_ENV === 'development') {
        console.debug('Editor change detected:', {
          valueParam: value.length,
          actualValue: actualEditorValue.length,
          refValue: contentRef.current.length,
          allMatch: value === actualEditorValue && actualEditorValue === contentRef.current,
          paramMatchesActual: value === actualEditorValue,
          refMatchesActual: contentRef.current === actualEditorValue,
          docValue: doc?.value?.length,
          timestamp: new Date().toISOString()
        });
      }
      
      // ALWAYS update our reference with the actual editor value
      contentRef.current = actualEditorValue;
      
      // Get current selection
      const currentSelection = editorRef.current.getSelection();
      prevSelectionRef.current = currentSelection;
      
      // Very important: ALWAYS notify parent with the actual editor value
      // This avoids situations where the reported value isn't what's in the editor
      onChange?.({
        content: actualEditorValue,
        selection: currentSelection
      });
      
      initialEditMadeRef.current = true;
    } catch (error) {
      console.error('Error in handleEditorChange:', error);
      
      // If we can't get the actual value, use the parameter as fallback
      if (value !== contentRef.current) {
        contentRef.current = value;
        onChange?.({
          content: value,
          selection: prevSelectionRef.current
        });
      }
    }
  }, [onChange, doc?.value]);

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