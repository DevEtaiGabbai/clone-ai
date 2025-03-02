"use client";

import React from "react";
import { Code, Globe, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileBreadcrumb } from "./file-breadcrumb";
import { FileStatusPill, SaveStatus } from "@/components/ui/file-status-pill";
import {
  CodePreviewTab,
  CodePreviewTabList,
  CodePreviewTabTrigger
} from "@/components/ui/code-preview-tab";
import { FileTreeNode } from "@/types/project";
import { Icons } from "@/components/ui/icons";

interface EditorHeaderProps {
  activeView: "editor" | "preview";
  setActiveView: (view: "editor" | "preview") => void;
  pathSegments: string[] | undefined;
  onFileSelect: (path: string) => void;
  getDirectoryContents: (path: string) => FileTreeNode[];
  selectedFile: string | null;
  saveStatus: SaveStatus;
  lastSavedTime: string;
  handleFileSave: () => void;
  unsavedChanges: boolean;
}

export function EditorHeader({
  activeView,
  setActiveView,
  pathSegments,
  onFileSelect,
  getDirectoryContents,
  selectedFile,
  saveStatus,
  lastSavedTime,
  handleFileSave,
  unsavedChanges,
}: EditorHeaderProps) {
  return (
    <div className="border-b overflow-x-hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4 overflow-hidden">
          <CodePreviewTab
            value={activeView}
            onValueChange={(val) => setActiveView(val as "editor" | "preview")}
            className="w-[200px] shrink-0"
          >
            <CodePreviewTabList>
              <CodePreviewTabTrigger value="editor">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Editor
                </div>
              </CodePreviewTabTrigger>
              <CodePreviewTabTrigger value="preview">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Preview
                </div>
              </CodePreviewTabTrigger>
            </CodePreviewTabList>
          </CodePreviewTab>

          {/* Enhanced breadcrumb with dropdowns */}
          {activeView === "editor" && pathSegments && (
            <div className="overflow-hidden">
              <FileBreadcrumb
                pathSegments={pathSegments}
                onFileSelect={onFileSelect}
                getDirectoryContents={getDirectoryContents}
                selectedFile={selectedFile}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Main Save Button - Only show in editor mode */}
          {activeView === "editor" && (
            <Button 
              onClick={handleFileSave} 
              size="sm" 
              className="gap-2 min-w-[90px] transition-all"
              disabled={!unsavedChanges || saveStatus === 'saving'}
              variant="outline"
            >
                  <Icons.save className="h-4 w-4" />
                  Save
            </Button>
          )}
          
          {/* Status Pill - Only show in editor mode */}
          {activeView === "editor" && (
            <FileStatusPill 
              status={saveStatus}
              lastSavedTime={lastSavedTime}
            />
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
} 