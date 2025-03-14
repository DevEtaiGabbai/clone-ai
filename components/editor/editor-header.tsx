"use client";

import React, { useState, useCallback } from "react";
import { Code, Globe, Download, Rocket, ChevronDown, ExternalLink } from "lucide-react";
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

          {/* Export/Deploy dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download as ZIP</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeployDialog(true)}>
                <Icons.netlify className="mr-2 h-4 w-4" />
                <span>{deploymentInfo ? 'Manage Netlify Deployment' : 'Deploy to Netlify'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Netlify Deployment Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy to Netlify</DialogTitle>
            <DialogDescription>
              {netlifyConnection.user 
                ? `Deploy your project to Netlify as ${netlifyConnection.user.full_name}`
                : 'Connect to Netlify to deploy your project'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {!netlifyConnection.user ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Icons.netlify className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not Connected to Netlify</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You need to connect your Netlify account first to deploy your project.
                </p>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard to Connect
                </Button>
              </div>
            ) : (
              <>
                {isDeploying ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Deploying to Netlify...</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {deployProgress}%
                      </Badge>
                    </div>
                    <Progress value={deployProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      This may take a few moments. Please don't close this window.
                    </p>
                  </div>
                ) : deploymentInfo ? (
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Deployment URL</h4>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">Live</Badge>
                      </div>
                      <a 
                        href={deploymentInfo.url} 
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-sm text-primary mt-2 block hover:underline truncate"
                      >
                        {deploymentInfo.url}
                      </a>
                      <p className="text-xs text-muted-foreground mt-2">
                        This site is hosted on Netlify and can be accessed by anyone with the link.
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDeploy}
                        disabled={isDeploying}
                      >
                        <Icons.netlify className="mr-2 h-4 w-4" />
                        Redeploy Site
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.open(deploymentInfo.url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Site
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h4 className="text-sm font-medium mb-2">Ready to Deploy</h4>
                      <p className="text-xs text-muted-foreground">
                        Your project will be deployed to Netlify with a unique URL.
                        You can share this URL with anyone to showcase your work.
                      </p>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={handleDeploy}
                      disabled={isDeploying}
                    >
                      <Icons.netlify className="mr-2 h-4 w-4" />
                      Deploy to Netlify
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeployDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 