"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import { WebContainerHandle } from "@/components/web-container";
import { Loader2, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SaveStatus } from "@/components/ui/file-status-pill";
import { EditorHeader } from "@/components/editor/editor-header";
import { EditorContent } from "@/components/editor/editor-content";
import { ProjectData, FileTreeNode, TerminalTab } from "@/types/project";
import { TerminalSection } from "@/components/terminal/terminal-section";

// Utility function for debouncing
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Sidebar trigger component positioned at bottom left
const FixedSidebarTrigger = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-4 left-4 z-50 rounded-full shadow-md bg-background border-primary/20 hover:bg-accent"
      onClick={toggleSidebar}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

export default function ClonePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const webContainerRef = useRef<WebContainerHandle>(null);
  
  // File saving status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Terminal management
  const devServerTerminalRef = useRef<any>(null);
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeTerminal, setActiveTerminal] = useState<string>("dev-server");

  // Directory view
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [directoryContents, setDirectoryContents] = useState<FileTreeNode[]>([]);

  // Initialize dev server terminal
  useEffect(() => {
    setTerminals([{
      id: "dev-server",
      name: "Dev Server",
      ref: devServerTerminalRef,
      isDevServer: true
    }]);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/projects/${params.id}`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          notFound();
        }
        throw new Error(json.error || "Failed to fetch project");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Build file tree from flat files array
  const buildFileTree = useCallback((files: Array<{ path: string; content: string }>): FileTreeNode[] => {
    const root: FileTreeNode[] = [];

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentLevel = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');
        let node = currentLevel.find(n => n.name === part);

        if (!node) {
          node = {
            name: part,
            path,
            type: isFile ? 'file' : 'directory',
            children: [],
          };
          currentLevel.push(node);
        }

        currentLevel = node.children;
      });
    });

    // Sort the tree: directories first, then files, both alphabetically
    const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      }).map(node => ({
        ...node,
        children: sortTree(node.children)
      }));
    };

    return sortTree(root);
  }, []);

  // Get directory contents for a specific path
  const getDirectoryContents = useCallback((path: string) => {
    if (!data) return [];

    const fileTree = buildFileTree(data.files);

    // Find the directory node
    const findNode = (nodes: FileTreeNode[], pathParts: string[]): FileTreeNode | null => {
      if (pathParts.length === 0) return null;

      const currentPart = pathParts[0];
      const node = nodes.find(n => n.name === currentPart);

      if (!node) return null;

      if (pathParts.length === 1) return node;

      return findNode(node.children, pathParts.slice(1));
    };

    const pathParts = path.split('/').filter(Boolean);
    const dirNode = findNode(fileTree, pathParts);

    return dirNode?.children || [];
  }, [data, buildFileTree]);

  const handleFileSelect = useCallback((path: string) => {
    // Check if we have unsaved changes
    if (unsavedChanges) {
      const confirm = window.confirm("You have unsaved changes. Do you want to continue?");
      if (!confirm) return;
    }

    // Check if it's a file or directory
    const isDirectory = data?.files.every(f => !f.path.startsWith(path) || f.path !== path);

    if (isDirectory) {
      // Update the directory contents for the dropdown menu and keep the current file open
      setSelectedDirectory(path);
      setDirectoryContents(getDirectoryContents(path));
    } else {
      // Find the file data
      const fileData = data?.files.find(f => f.path === path);
      
      if (fileData) {
        // Only update if we're selecting a different file
        if (selectedFile !== path) {
          // Update all related state in a consistent manner
          setSelectedFile(path);
          setSelectedDirectory(null);
          
          // Set the file content
          setFileContent(fileData.content);
          
          // Reset unsaved changes and update save status
          setUnsavedChanges(false);
          setSaveStatus('saved');
          updateLastSavedTime();

          // If in preview mode, automatically switch to editor mode when a file is selected
          if (activeView === "preview") {
            setActiveView("editor");
          }
        }
      } else {
        console.error(`File not found in data: ${path}`);
        toast.error(`Could not load file: ${path}`);
      }
    }
  }, [data, unsavedChanges, getDirectoryContents, activeView, selectedFile]);

  const updateLastSavedTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastSavedTime(timeString);
  };

  // Improved file change handler
  const handleFileChange = useCallback((newContent: string) => {
    // Only process if we have a selected file
    if (!selectedFile) return;
    
    // Skip if content hasn't changed to avoid unnecessary re-renders
    if (newContent === fileContent) return;
    
    // Update the file content state
    setFileContent(newContent);
    
    // Mark as unsaved if content is different from the original
    const originalContent = data?.files.find(f => f.path === selectedFile)?.content || '';
    if (newContent !== originalContent && !unsavedChanges) {
      setUnsavedChanges(true);
      setSaveStatus('not-saved');
    }
  }, [selectedFile, data?.files, unsavedChanges, fileContent]);

  // Function to refresh the preview without restarting the server
  const refreshPreview = useCallback(() => {
    if (webContainerRef.current) {
      webContainerRef.current.refreshPreview();
    }
  }, []);

  // Improved file save handler
  const handleFileSave = useCallback(async () => {
    // Early return if no file is selected or already saving
    if (!selectedFile || !data || saveStatus === 'saving') {
      return;
    }

    try {
      // Set status to saving
      setSaveStatus('saving');
      
      // Get the current file path and content from state
      const currentFilePath = selectedFile;
      const currentContent = fileContent;
      
      // First save to the database to ensure data persistence
      const res = await fetch(`/api/projects/${params.id}/files`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentFilePath,
          content: currentContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save file to database');
      }
      
      // Update local data
      setData((prev) => {
        if (!prev) return prev;
        
        // Create a new files array with the updated content
        const updatedFiles = prev.files.map((f) => {
          if (f.path === currentFilePath) {
            return { ...f, content: currentContent };
          }
          return f;
        });
        
        return {
          ...prev,
          files: updatedFiles,
        };
      });
      
      // Then update the file in WebContainer
      if (webContainerRef.current) {
        try {
          // Update the file in the WebContainer
          await webContainerRef.current.updateFile(currentFilePath, currentContent);
          
          // Refresh the preview after a short delay
          setTimeout(() => {
            if (webContainerRef.current) {
              webContainerRef.current.refreshPreview();
            }
          }, 500);
        } catch (err) {
          console.error('Error updating file in WebContainer:', err);
          toast.error('File saved to database but preview may not reflect changes');
        }
      }

      // Update save status
      setUnsavedChanges(false);
      setSaveStatus('saved');
      updateLastSavedTime();
      
      // Show success toast
      toast.success('File saved successfully');
    } catch (err) {
      setSaveStatus('not-saved');
      toast.error(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Save error:', err);
    }
  }, [selectedFile, fileContent, params.id, data, saveStatus, webContainerRef]);

  // Terminal management functions
  const addNewTerminal = useCallback(() => {
    const newTerminalRef = React.createRef<any>();
    const terminalCount = terminals.filter(t => !t.isDevServer).length + 1;
    const newId = `terminal-${Date.now()}`;

    setTerminals(prev => [
      ...prev,
      {
        id: newId,
        name: `Terminal ${terminalCount}`,
        ref: newTerminalRef
      }
    ]);

    setActiveTerminal(newId);
  }, [terminals]);

  const closeTerminal = useCallback((id: string) => {
    setTerminals(prev => prev.filter(t => t.id !== id));
    setActiveTerminal("dev-server");
  }, []);

  const restartDevServer = useCallback(() => {
    if (webContainerRef.current) {
      webContainerRef.current.restart();
    }
  }, []);

  // Add keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        
        // Use the current selectedFile state directly
        if (selectedFile && saveStatus !== 'saving') {
          handleFileSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFileSave, saveStatus, selectedFile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchData} variant="outline">Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const pathSegments = selectedFile?.split('/').filter(Boolean);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <SidebarProvider>
        <AppSidebar
          files={data.files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          projectName={data.project.name}
          projectDescription={data.project.description}
        />
        <SidebarInset className="h-full flex flex-col overflow-hidden">
          {/* Editor Header - Positioned at the top of the content area */}
          <EditorHeader 
            activeView={activeView}
            setActiveView={setActiveView}
            pathSegments={pathSegments}
            onFileSelect={handleFileSelect}
            getDirectoryContents={getDirectoryContents}
            selectedFile={selectedFile}
            saveStatus={saveStatus}
            lastSavedTime={lastSavedTime}
            handleFileSave={handleFileSave}
            unsavedChanges={unsavedChanges}
          />
          
          {/* Main Content */}
          <ResizablePanelGroup direction="vertical" className="flex-1 overflow-hidden">
            <EditorContent 
              activeView={activeView}
              selectedFile={selectedFile}
              fileContent={fileContent}
              handleFileChange={handleFileChange}
              handleFileSave={handleFileSave}
              webContainerRef={webContainerRef}
              data={data}
              devServerTerminalRef={devServerTerminalRef}
            />

            <ResizableHandle withHandle />

            {/* Terminal Section */}
            <TerminalSection 
              terminals={terminals}
              activeTerminal={activeTerminal}
              setActiveTerminal={setActiveTerminal}
              addNewTerminal={addNewTerminal}
              closeTerminal={closeTerminal}
              webContainerRef={webContainerRef}
            />
          </ResizablePanelGroup>

          {/* Fixed sidebar trigger at bottom left */}
          <FixedSidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}