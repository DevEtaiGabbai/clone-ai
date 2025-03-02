"use client";

import React from "react";
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
  // Determine language based on file extension
  const getLanguage = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'javascript';
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
        return 'javascript'; // Default to JavaScript
    }
  };

  return (
    <ResizablePanel defaultSize={75} minSize={30}>
      <div className="flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Editor */}
          <div className={cn("h-full", activeView !== "editor" && "hidden")}>
            {selectedFile ? (
              <div className="h-full overflow-x-auto">
                <Editor
                  value={fileContent}
                  onChange={handleFileChange}
                  onSave={handleFileSave}
                  language={getLanguage(selectedFile)}
                  filePath={selectedFile}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <File className="h-16 w-16 mb-6 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-3">No file selected</h3>
                <p className="text-sm text-center max-w-md mb-6">
                  Select a file from the sidebar to start editing.
                </p>
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