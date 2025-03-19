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
  
  // Reference to track if we're in the middle of an update
  const isUpdatingRef = useRef(false);
  
  // Reference to the editor instance
  const editorRef = useRef<{ updateContent: (content: string) => void } | null>(null);
  
  // Reference to track the current value to avoid unnecessary updates
  const currentValueRef = useRef(value);

  // Track if component is mounted
  const isMountedRef = useRef(false);
  
  // Get current theme
  const { resolvedTheme } = useTheme();
  
  // Mark component as mounted when it's initialized
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Update editor ID when file path changes
  useEffect(() => {
    if (filePath) {
      editorIdRef.current = `editor-${filePath}`;
    }
  }, [filePath]);
  
  // Handle editor instance reference
  const handleEditorMount: OnMountCallback = useCallback((editor) => {
    editorRef.current = editor;
  }, []);
  
  // Handle editor changes
  const handleChange: OnChangeCallback = useCallback((update) => {
    // Safety check - don't process changes if unmounted
    if (!isMountedRef.current) return;
    
    // Prevent handling changes if we're in the middle of an update
    if (isUpdatingRef.current) return;
    
    // Only notify parent if content actually changed
    if (update.content !== currentValueRef.current) {
      currentValueRef.current = update.content;
      onChange(update.content);
    }
  }, [onChange]);
  
  // Update editor content when value prop changes
  useEffect(() => {
    // Safety check - don't update if unmounted
    if (!isMountedRef.current) return;
    
    // Skip if editor not mounted
    if (!editorRef.current) return;
    
    // Skip if value hasn't changed
    if (value === currentValueRef.current) return;
    
    // Skip if we're in the middle of an update
    if (isUpdatingRef.current) return;
    
    // Set flag to prevent handling our own changes
    isUpdatingRef.current = true;
    
    // Update our reference
    currentValueRef.current = value;
    
    // Update editor content
    try {
      editorRef.current.updateContent(value);
    } catch (error) {
      console.error('Error updating editor content:', error);
    }
    
    // Reset flag after a short delay
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        isUpdatingRef.current = false;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

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
        onSave={onSave}
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