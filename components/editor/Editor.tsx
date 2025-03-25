import { useEffect, useRef, useCallback } from 'react';
import { MonacoEditor, EditorDocument, EditorUpdate, OnChangeCallback, OnMountCallback } from '@/components/editor/MonacoEditor';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  language?: string;
  filePath?: string;
  className?: string;
  editable?: boolean;
}

// Define custom types for our refs
interface MonacoEditorRef {
  getModel: () => {
    getValue: () => string;
  } | null;
}

interface EditorWrapperRef {
  updateContent: (content: string) => void;
}

export function Editor({
  value,
  onChange,
  onSave,
  language = 'javascript',
  filePath,
  className = '',
  editable = true,
}: EditorProps) {
  // Create a stable ID for the editor instance
  const editorIdRef = useRef(`editor-${filePath || Math.random().toString(36).substring(2, 9)}`);
  
  // Store the actual Monaco editor instance directly
  const monacoEditorRef = useRef<MonacoEditorRef | null>(null);
  
  // Wrapper for communicating with parent
  const editorWrapperRef = useRef<EditorWrapperRef | null>(null);
  
  // Track if component is mounted
  const isMountedRef = useRef(false);
  
  // Store the current save handler
  const saveHandlerRef = useRef(onSave);
  
  // Get current theme
  const { resolvedTheme } = useTheme();
  
  // Update save handler ref when prop changes
  useEffect(() => {
    saveHandlerRef.current = onSave;
  }, [onSave]);
  
  // Mark component as mounted when it's initialized
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle direct access to the Monaco editor
  const handleEditorMount: OnMountCallback = useCallback((editor) => {
    // Store the wrapper for communicating with parent
    editorWrapperRef.current = editor;
    
    // Store direct reference to monaco editor (if available from the editor object)
    // This is a bit of a hack, but necessary to get direct access
    const editorInstance = editor as any;
    if (editorInstance && editorInstance._editor) {
      monacoEditorRef.current = editorInstance._editor;
    }
    
    // Log when editor mounts
    if (process.env.NODE_ENV === 'development') {
      console.debug('Monaco editor mounted', {
        filePath,
        initialContentLength: value.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [filePath, value]);
  
  // Simplified change handler - directly use the monaco editor value
  const handleChange: OnChangeCallback = useCallback((update) => {
    // Safety check - don't process changes if unmounted
    if (!isMountedRef.current) return;
    
    try {
      // Always get content directly from Monaco editor if possible
      let actualContent = update.content;
      if (monacoEditorRef.current) {
        const model = monacoEditorRef.current.getModel();
        if (model) {
          actualContent = model.getValue();
        }
      }
      
      // Notify parent component about change
      onChange(actualContent);
      
    } catch (error) {
      console.error('Error handling editor change:', error);
      
      // Fallback to the update content
      onChange(update.content);
    }
  }, [onChange]);
  
  // Handle save request - get content directly from editor
  const handleSave = useCallback(() => {
    if (!saveHandlerRef.current || !isMountedRef.current) return;
    
    if (process.env.NODE_ENV === 'development') {
      // Log the actual content being saved
      try {
        let currentContent = value;
        if (monacoEditorRef.current) {
          const model = monacoEditorRef.current.getModel();
          if (model) {
            currentContent = model.getValue();
          }
        }
        
        console.debug('Editor save requested', {
          filePath,
          contentLength: currentContent?.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error getting editor content:', error);
      }
    }
    
    // Always sync content before save
    try {
      if (monacoEditorRef.current) {
        const model = monacoEditorRef.current.getModel();
        if (model) {
          const currentContent = model.getValue();
          onChange(currentContent);
        }
      }
    } catch (error) {
      console.error('Error syncing content before save:', error);
    }
    
    // Call the current save handler
    saveHandlerRef.current();
  }, [value, filePath, onChange]);
  
  // Update editor content when value prop changes
  useEffect(() => {
    if (!isMountedRef.current || !editorWrapperRef.current) return;
    
    try {
      // Update content in the editor
      editorWrapperRef.current.updateContent(value);
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('Editor content updated from props', {
          filePath,
          newValueLength: value.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating editor content:', error);
    }
  }, [value, filePath]);

  return (
    <div 
      className={cn("h-full w-full outline-none", className)}
      data-filepath={filePath}
    >
      <MonacoEditor
        key={editorIdRef.current}
        theme={resolvedTheme as 'dark' | 'light'}
        doc={{
          value,
          filePath: filePath || '',
          isBinary: false
        }}
        editable={editable}
        onChange={handleChange}
        onSave={handleSave}
        onMount={handleEditorMount}
        autoFocusOnDocumentChange={true}
        preserveCursorPosition={true}
        debounceChange={0}
        settings={{
          tabSize: 2,
          fontSize: 14
        }}
        className="h-full w-full"
      />
    </div>
  );
} 
