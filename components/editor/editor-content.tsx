"use client";

import React, { useEffect, useRef } from "react";
import { File } from "lucide-react";
import { Editor } from "./Editor";
import { WebContainer } from "@/components/web-container";
import { cn } from "@/lib/utils";
import { ResizablePanel } from "@/components/ui/resizable";
import { ProjectData } from "@/types/project";

interface EditorContentProps {
  activeView: "editor" | "preview";
  selectedFile: string | null;
  fileContent: string;
  handleFileChange: (newContent: string) => void;
  handleFileSave: () => void;
  webContainerRef: React.RefObject<any>;
  data: ProjectData;
  devServerTerminalRef: React.RefObject<any>;
}

export function EditorContent({
  activeView,
  selectedFile,
  fileContent,
  handleFileChange,
  handleFileSave,
  webContainerRef,
  data,
  devServerTerminalRef
}: EditorContentProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // When editor view is activated, ensure it has focus
  useEffect(() => {
    if (activeView === "editor" && editorContainerRef.current) {
      // Find the Monaco editor instance and focus it
      const editorElement = editorContainerRef.current.querySelector('.monaco-editor');
      if (editorElement) {
        // Use setTimeout to ensure the DOM is ready
        setTimeout(() => {
          (editorElement as HTMLElement).click();
        }, 100);
      }
    }
  }, [activeView, selectedFile]);

  return (
    <ResizablePanel defaultSize={75} minSize={30}>
      <div className="flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Editor */}
          <div 
            className={cn("h-full", activeView !== "editor" && "hidden")}
            ref={editorContainerRef}
          >
            {selectedFile ? (
              <div className="h-full overflow-x-auto focus-within:ring-0 focus-within:outline-none">
                <Editor
                  value={fileContent}
                  onChange={handleFileChange}
                  onSave={handleFileSave}
                  filePath={selectedFile}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-background/30 text-muted-foreground p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-muted/20 border border-border/40 mb-6">
                  <File className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground/90">No file selected</h3>
                <p className="text-sm text-center max-w-md text-muted-foreground/80">
                  Select a file from the sidebar to start editing.
                </p>
                <div className="border border-border/20 rounded-md bg-muted/10 px-4 py-3 mt-6 max-w-sm">
                  <p className="text-xs text-muted-foreground/70 text-center">
                    Tip: Use <kbd className="px-1.5 py-0.5 bg-muted/30 rounded border border-border/30 text-[12px] font-mono">{navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + S</kbd> to save your file.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className={cn("h-full flex flex-col", activeView !== "preview" && "hidden")}>
            <WebContainer
              ref={webContainerRef}
              files={data.files}
              persistentMode={true}
              devServerTerminal={devServerTerminalRef}
            />
          </div>
        </div>
      </div>
    </ResizablePanel>
  );
} 