'use client';

import React, { useState, useEffect, useRef } from "react";
import { Rocket, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  getInitialNetlifyConnection, 
  deployToNetlify 
} from '@/lib/netlify';
import { toast } from 'sonner';
import type { NetlifySiteInfo } from '@/types/netlify';
import { Badge } from '@/components/ui/badge';
import { Icons } from "./icons";

interface NetlifyDeployButtonProps {
  projectId: string;
  files: Record<string, string>;
  className?: string;
  minimal?: boolean;
}

export function NetlifyDeployButton({ projectId, files, className, minimal = false }: NetlifyDeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [netlifyConnection, setNetlifyConnection] = useState(getInitialNetlifyConnection());
  const [deploymentInfo, setDeploymentInfo] = useState<{
    url: string;
    siteInfo: NetlifySiteInfo;
  } | null>(null);

  // Refresh Netlify connection whenever dialog opens
  useEffect(() => {
    if (showDeployDialog) {
      setNetlifyConnection(getInitialNetlifyConnection());
    }
  }, [showDeployDialog]);

  const handleDeploy = async () => {
    if (!netlifyConnection.user || !netlifyConnection.token) {
      toast.error('You need to connect to Netlify first');
      return;
    }

    setIsDeploying(true);
    setDeployProgress(0);

    try {
      // Existing site ID if we previously deployed this project
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

  // Use a previously deployed site if available
  useEffect(() => {
    if (netlifyConnection.stats?.sites) {
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

  if (minimal) {
    const hasDeployment = deploymentInfo !== null;
    
    if (!hasDeployment) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          className={className}
          onClick={() => setShowDeployDialog(true)}
          disabled={isDeploying}
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Icons.netlify className="mr-2 h-3 w-3" />
              Deploy to Netlify
            </>
          )}
        </Button>
      );
    }
    
    return (
      <div className="flex gap-2 items-center">
        <Button 
          size="sm" 
          variant="outline"
          className={className}
          onClick={() => setShowDeployDialog(true)}
          disabled={isDeploying}
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Icons.netlify className="mr-2 h-3 w-3" />
              Redeploy
            </>
          )}
        </Button>
        <a 
          href={deploymentInfo.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          View Site
        </a>
      </div>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        className={className} 
        onClick={() => setShowDeployDialog(true)}
        disabled={isDeploying}
      >
        {isDeploying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Icons.netlify className="mr-2 h-4 w-4" />
            {deploymentInfo ? 'Redeploy to Netlify' : 'Deploy to Netlify'}
          </>
        )}
      </Button>

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
                        Redeploy
                      </Button>
                      <a 
                        href={deploymentInfo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Site
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm">
                      Deploy your project to Netlify to make it accessible on the web. This will create a new site on your Netlify account.
                    </p>
                    <div className="rounded-md bg-muted p-4">
                      <h4 className="text-sm font-medium mb-2">What will be deployed?</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• All your project files ({Object.keys(files).length} files)</li>
                        <li>• Static site with no build process</li>
                        <li>• Hosted on Netlify's CDN</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setShowDeployDialog(false)}
            >
              Cancel
            </Button>
            {netlifyConnection.user && !deploymentInfo && !isDeploying && (
              <Button 
                onClick={handleDeploy}
                disabled={isDeploying}
              >
                <Icons.netlify className="mr-2 h-4 w-4" />
                Deploy Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 