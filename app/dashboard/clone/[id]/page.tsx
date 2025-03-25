"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import { WebContainerHandle } from "@/components/web-container";
import { ArrowLeft, Loader2, OctagonAlert, PanelLeft, Search, ArrowRight } from "lucide-react";
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
      className="fixed bottom-4 left-4 z-50 h-9 w-9 rounded-full shadow-md bg-background/90 backdrop-blur-sm border-border/30 hover:bg-accent/50 transition-all"
      onClick={toggleSidebar}
    >
      <PanelLeft className="h-4 w-4 text-muted-foreground" />
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
        try {
          // Only update if we're selecting a different file
          if (selectedFile !== path) {
            // Update all related state in a consistent manner
            setSelectedFile(path);
            setSelectedDirectory(null);
            
            // Set the file content - ensure this is actually different before updating
            if (fileContent !== fileData.content) {
              // Debug log in development
              if (process.env.NODE_ENV === 'development') {
                console.debug('File content changed due to selection:', {
                  path,
                  prevLength: fileContent?.length || 0,
                  newLength: fileData.content.length,
                  timestamp: new Date().toISOString()
                });
              }
              
              setFileContent(fileData.content);
            }
            
            // Reset unsaved changes and update save status
            setUnsavedChanges(false);
            setSaveStatus('saved');
            updateLastSavedTime();

            // If in preview mode, automatically switch to editor mode when a file is selected
            if (activeView === "preview") {
              setActiveView("editor");
            }
          }
        } catch (error) {
          console.error('Error selecting file:', error);
          toast.error('Error loading file');
        }
      } else {
        console.error(`File not found in data: ${path}`);
        toast.error(`Could not load file: ${path}`);
      }
    }
  }, [data, unsavedChanges, getDirectoryContents, activeView, selectedFile, fileContent]);

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
    
    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('File content changed:', {
        file: selectedFile,
        prevLength: fileContent.length,
        newLength: newContent.length,
        isDifferent: newContent !== fileContent,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update the file content state
    setFileContent(newContent);
    
    // Get the most up-to-date content from our data state
    // This ensures we're always comparing against the latest saved version
    const originalContent = data?.files.find(f => f.path === selectedFile)?.content || '';
    
    // Only mark as unsaved if content differs from the latest saved version
    if (newContent !== originalContent) {
      if (!unsavedChanges) {
        setUnsavedChanges(true);
        setSaveStatus('not-saved');
      }
    } else {
      // Content matches saved version, so mark as saved
      if (unsavedChanges) {
        setUnsavedChanges(false);
        setSaveStatus('saved');
        updateLastSavedTime();
      }
    }
  }, [selectedFile, data?.files, unsavedChanges, fileContent, updateLastSavedTime]);

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
      
      // The content from state should be the most up-to-date version
      // since it's updated in the handleFileChange function
      const currentContent = fileContent;
      
      // Add a sanity check - avoid saving empty content due to sync issues
      if (!currentContent || currentContent === '') {
        console.warn('Attempted to save empty file content - possible sync issue');
        
        // Verify with the user before saving empty content
        if (!window.confirm('The file appears to be empty. Do you want to save it anyway?')) {
          setSaveStatus('not-saved');
          return;
        }
      }
      
      // Debug log in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('Saving file:', {
          path: currentFilePath,
          contentLength: currentContent.length,
          timestamp: new Date().toISOString()
        });
      }
      
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
      
      // Update local data immediately with the SAME content we just sent to the server
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
      
      // Since we've updated the data with the current content, update the unsaved status
      setUnsavedChanges(false);
      setSaveStatus('saved');
      updateLastSavedTime();
      
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
      
      // Show success toast
      toast.success('File saved successfully');
    } catch (err) {
      setSaveStatus('not-saved');
      toast.error(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Save error:', err);
    }
  }, [selectedFile, fileContent, params.id, data, saveStatus, webContainerRef, updateLastSavedTime]);

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

  // Convert files array to record for Netlify deployment
  const filesToDeploy = useCallback((): Record<string, string> => {
    if (!data?.files) return {};
    
    return data.files.reduce((acc, file) => {
      acc[file.path] = file.content;
      return acc;
    }, {} as Record<string, string>);
  }, [data?.files]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md bg-primary/10 animate-pulse"></div>
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground relative" />
          </div>
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if this is a "project not found" error
    if (error === "NEXT_NOT_FOUND") {
      return (
        <div className="relative flex items-center justify-center min-h-svh overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-muted/30">
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground/40 to-transparent" />
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/4 translate-x-1/4">
            <div className="absolute w-full h-full rounded-full bg-muted/10 blur-[100px]" />
          </div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/4 -translate-x-1/4">
            <div className="absolute w-full h-full rounded-full bg-primary/5 blur-[100px]" />
          </div>
          
          {/* Main content container */}
          <div className="relative z-10 w-full max-w-2xl px-6 py-12 mx-auto">
            <div className="backdrop-blur-sm border border-border/20 bg-background/50 rounded-2xl shadow-xl overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-muted-foreground/40 via-muted-foreground/60 to-muted-foreground/40" />
              
              <div className="p-8 sm:p-10">
                {/* Error icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-muted/10 blur-md animate-pulse" />
                    <div className="relative h-16 w-16 rounded-full bg-background/80 border border-border/30 flex items-center justify-center shadow-sm">
                      <Search className="h-8 w-8 text-muted-foreground/80" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                
                {/* Error title */}
                <h1 className="text-balance text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-center mb-3">
                  Project not found
                </h1>
                
                <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
                  The project you're looking for does not exist or may have been deleted.
                </p>
                
                {/* Additional context */}
                <div className="relative group mb-8">
                  <div className="absolute inset-0 rounded-lg bg-muted/5 blur-sm group-hover:bg-muted/10 transition-colors" />
                  <div className="relative p-4 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-sm">
                    <p className="text-sm text-center text-foreground/70">
                      Project ID: <span className="font-mono text-muted-foreground">{params.id}</span>
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full sm:w-auto transition-all hover:bg-primary/5 border-border/60 shadow-sm group"
                  >
                    <a href="#" onClick={() => router.back()}>
                      <ArrowLeft
                        className="mr-2 text-primary/70 transition-transform group-hover:-translate-x-1"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="font-medium">Go back</span>
                    </a>
                  </Button>
                  
                  <Button 
                    variant="default" 
                    asChild 
                    className="w-full sm:w-auto bg-primary/90 hover:bg-primary group shadow-sm"
                  >
                    <a href="/dashboard">
                      <span className="font-medium">Go to Dashboard</span>
                      <ArrowRight
                        className="ml-2 text-primary-foreground/80 transition-transform group-hover:translate-x-1"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Original error UI for other types of errors
    return (
      <div className="relative flex items-center justify-center min-h-svh overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-muted/30">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground/40 to-transparent" />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/4 translate-x-1/4">
          <div className="absolute w-full h-full rounded-full bg-destructive/5 blur-[100px]" />
        </div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] translate-y-1/4 -translate-x-1/4">
          <div className="absolute w-full h-full rounded-full bg-primary/5 blur-[100px]" />
        </div>
        
        {/* Main content container */}
        <div className="relative z-10 w-full max-w-2xl px-6 py-12 mx-auto">
          <div className="backdrop-blur-sm border border-border/20 bg-background/50 rounded-2xl shadow-xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-destructive/70 via-destructive to-destructive/70" />
            
            <div className="p-8 sm:p-10">
              {/* Error icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-destructive/10 blur-md animate-pulse" />
                  <div className="relative h-16 w-16 rounded-full bg-background/80 border border-border/30 flex items-center justify-center shadow-sm">
                    <OctagonAlert className="h-8 w-8 text-destructive/90" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              
              {/* Error title */}
              <h1 className="text-balance text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-center mb-3">
                We encountered an error
              </h1>
              
              <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
                We couldn't load your project. Please try again or contact support if the problem persists.
              </p>
              
              {/* Error message */}
              <div className="relative group mb-8">
                <div className="absolute inset-0 rounded-lg bg-destructive/5 blur-sm group-hover:bg-destructive/10 transition-colors" />
                <div className="relative p-4 rounded-lg border border-border/40 bg-muted/30 backdrop-blur-sm overflow-auto max-h-32">
                  <p className="text-sm font-mono text-foreground/80 break-all">{error}</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full sm:w-auto transition-all hover:bg-primary/5 border-border/60 shadow-sm group"
                >
                  <a href="#" onClick={() => router.back()}>
                    <ArrowLeft
                      className="mr-2 text-primary/70 transition-transform group-hover:-translate-x-1"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span className="font-medium">Go back</span>
                  </a>
                </Button>
                
                <Button 
                  variant="default" 
                  asChild 
                  className="w-full sm:w-auto bg-primary/90 hover:bg-primary group shadow-sm"
                >
                  <a href="/dashboard">
                    <span className="font-medium">Dashboard</span>
                    <ArrowRight
                      className="ml-2 text-primary-foreground/80 transition-transform group-hover:translate-x-1"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Footer text */}
          <p className="text-xs text-center text-muted-foreground/70 mt-6">
            Reference ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pathSegments = selectedFile?.split('/').filter(Boolean);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <SidebarProvider>
        <AppSidebar
          user={{
            name: "John Doe",
            email: "johndoe@gmail.com",
            avatar: "https://github.com/shadcn.png"
          }}
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
            projectId={params.id}
            files={filesToDeploy()}
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

            <ResizableHandle withHandle className="h-1 bg-border/30 hover:bg-border/50 transition-colors after:h-1" />

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