"use client";

import React, { useState, useCallback } from "react";
import { Code, Globe, Download, Rocket, ChevronDown, ExternalLink, Copy, RefreshCw, Check, AlertCircle } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getInitialNetlifyConnection, deployToNetlify } from "@/lib/netlify";
import { cn } from "@/lib/utils";

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
  projectId: string;
  files: Record<string, string>;
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
  projectId,
  files,
}: EditorHeaderProps) {
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [netlifyConnection, setNetlifyConnection] = useState(() => {
    if (typeof window !== 'undefined') {
      return getInitialNetlifyConnection();
    }
    return { user: null, token: '', stats: undefined };
  });
  const [deploymentInfo, setDeploymentInfo] = useState<{
    url: string;
    siteInfo: any;
  } | null>(null);

  // Refresh Netlify connection whenever dialog opens
  React.useEffect(() => {
    if (showDeployDialog && typeof window !== 'undefined') {
      setNetlifyConnection(getInitialNetlifyConnection());
    }
  }, [showDeployDialog]);

  // Check for existing deployments
  React.useEffect(() => {
    if (netlifyConnection.stats?.sites && projectId) {
      const existingSite = netlifyConnection.stats.sites.find(
        site => site.name.includes(`cloneai-project-${projectId}`)
      );

      if (existingSite) {
        setDeploymentInfo({
          url: existingSite.url,
          siteInfo: {
            id: existingSite.id,
            name: existingSite.name,
            url: existingSite.url,
            projectId,
          },
        });
      }
    }
  }, [netlifyConnection.stats?.sites, projectId]);

  const handleDeploy = async () => {
    if (!netlifyConnection.user || !netlifyConnection.token) {
      toast.error('You need to connect to Netlify first');
      return;
    }

    setIsDeploying(true);
    setDeployProgress(0);

    try {
      // Check for existing deployment
      const existingSiteId = netlifyConnection.stats?.sites.find(
        site => site.name.includes(`cloneai-project-${projectId}`)
      )?.id;

      const result = await deployToNetlify({
        files,
        projectId,
        siteId: existingSiteId,
        onProgress: setDeployProgress,
      });

      if (result.success && result.deployUrl && result.siteInfo) {
        setDeploymentInfo({
          url: result.deployUrl,
          siteInfo: result.siteInfo,
        });
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error(`Failed to deploy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownload = useCallback(() => {
    // Create a zip file of the project
    toast.info('Preparing download...');
    
    // Implement download functionality here
    // This is just a placeholder
    setTimeout(() => {
      toast.success('Download ready!');
    }, 1000);
  }, []);

  return (
    <div className="border-b border-border/50 bg-background">
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-3 overflow-hidden">
          <CodePreviewTab
            value={activeView}
            onValueChange={(val) => setActiveView(val as "editor" | "preview")}
            className="w-[180px] h-8 shrink-0"
          >
            <CodePreviewTabList>
              <CodePreviewTabTrigger value="editor" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5" />
                  Editor
                </div>
              </CodePreviewTabTrigger>
              <CodePreviewTabTrigger value="preview" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Preview
                </div>
              </CodePreviewTabTrigger>
            </CodePreviewTabList>
          </CodePreviewTab>

          {/* Enhanced breadcrumb with dropdowns */}
          {activeView === "editor" && pathSegments && (
            <div className="overflow-hidden mx-1 border-l border-border/20 pl-3">
              <FileBreadcrumb
                pathSegments={pathSegments}
                onFileSelect={onFileSelect}
                getDirectoryContents={getDirectoryContents}
                selectedFile={selectedFile}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Main Save Button - Only show in editor mode */}
          {activeView === "editor" && (
            <Button 
              onClick={handleFileSave} 
              size="sm" 
              className={cn(
                "h-7 px-3 gap-1.5 text-xs font-medium transition-all border",
                unsavedChanges 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30" 
                  : "bg-muted/30 hover:bg-muted/50 text-muted-foreground border-border/30"
              )}
              disabled={!unsavedChanges || saveStatus === 'saving'}
            >
              <Icons.save className="h-3.5 w-3.5" />
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

          {/* Export/Deploy dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-3 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
                <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleDownload} className="text-xs">
                <Download className="mr-2 h-3.5 w-3.5" />
                <span>Download as ZIP</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeployDialog(true)} className="text-xs">
                <Icons.netlify className="mr-2 h-3.5 w-3.5" />
                <span>{deploymentInfo ? 'Manage Netlify Deployment' : 'Deploy to Netlify'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Netlify Deployment Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background border border-border/50">
          <DialogHeader className="p-5 border-b border-border/10">
            <div className="flex items-center gap-2">
              <Icons.netlify className="h-4 w-4 text-foreground/70" />
              <DialogTitle>Deploy to Netlify</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1.5 text-sm">
              {netlifyConnection.user 
                ? `Connected as ${netlifyConnection.user.full_name}`
                : 'Connect to Netlify to deploy your project'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            {!netlifyConnection.user ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Icons.netlify className="h-8 w-8 text-foreground/70 mb-4" />
                <h3 className="text-base font-medium mb-2">Connect Your Account</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-[280px]">
                  Connect to Netlify to get a public URL for your project
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard'} 
                  variant="outline"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Connect Account
                </Button>
              </div>
            ) : (
              <>
                {isDeploying ? (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Deploying your project</span>
                      <Badge variant="outline" className="bg-background text-foreground border-border px-2 py-0.5 text-xs font-normal">
                        {deployProgress}%
                      </Badge>
                    </div>
                    <Progress value={deployProgress} className="h-1.5 bg-muted/30" />
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">
                        Your project is being prepared for the web
                      </p>
                    </div>
                  </div>
                ) : deploymentInfo ? (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="size-1.5 rounded-full bg-foreground/70"></div>
                      <span className="font-medium">Site is live</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/10 rounded-md border border-border/40 px-3 py-2.5">
                      <Icons.netlify className="h-3.5 w-3.5 text-foreground/70 flex-shrink-0" />
                      <a 
                        href={deploymentInfo.url} 
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-sm hover:underline truncate flex-1"
                      >
                        {deploymentInfo.url}
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(deploymentInfo.url);
                          toast.success("URL copied to clipboard");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center gap-3 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="flex-1"
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(deploymentInfo.url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Visit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Ready to deploy</span>
                    </div>
                    
                    <div className="border border-border/30 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground mb-1">
                        Deploy to get a public URL for your project.
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Updates are just one click away after deployment.
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={handleDeploy}
                      disabled={isDeploying}
                    >
                      <Icons.netlify className="mr-2 h-4 w-4 text-foreground/70" />
                      Deploy to Netlify
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 