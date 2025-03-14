'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface NetlifyDeploymentInfoProps {
  projectId: string;
  className?: string;
}

interface DeploymentInfo {
  netlifySiteId: string | null;
  netlifySiteName: string | null;
  netlifySiteUrl: string | null;
  netlifySiteDeployId: string | null;
  netlifySiteDeployedAt: string | null;
}

export function NetlifyDeploymentInfo({ projectId, className }: NetlifyDeploymentInfoProps) {
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeploymentInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project information');
      }
      
      const data = await response.json();
      
      // Extract Netlify deployment info
      const deployInfo: DeploymentInfo = {
        netlifySiteId: data.project.netlifySiteId || null,
        netlifySiteName: data.project.netlifySiteName || null,
        netlifySiteUrl: data.project.netlifySiteUrl || null,
        netlifySiteDeployId: data.project.netlifySiteDeployId || null,
        netlifySiteDeployedAt: data.project.netlifySiteDeployedAt || null,
      };
      
      setDeploymentInfo(deployInfo);
    } catch (err) {
      console.error('Error fetching deployment info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deployment information');
      toast.error('Failed to fetch deployment information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentInfo();
  }, [projectId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Netlify Deployment</CardTitle>
          <CardDescription>Error loading deployment information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={fetchDeploymentInfo}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If no deployment info is available
  if (!deploymentInfo?.netlifySiteUrl) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Netlify Deployment</CardTitle>
          <CardDescription>This project has not been deployed to Netlify yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deploy your project to Netlify to make it accessible on the web.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Netlify Deployment</CardTitle>
            <CardDescription>Your project is live on Netlify</CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-500">Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Deployment URL</h4>
            <a 
              href={deploymentInfo.netlifySiteUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center hover:underline"
            >
              {deploymentInfo.netlifySiteUrl}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            <span>
              Last deployed: {deploymentInfo.netlifySiteDeployedAt ? formatDate(deploymentInfo.netlifySiteDeployedAt) : 'Unknown'}
            </span>
          </div>
          
          {deploymentInfo.netlifySiteName && (
            <div className="text-xs text-muted-foreground">
              Site name: {deploymentInfo.netlifySiteName}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={fetchDeploymentInfo}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <a 
            href={deploymentInfo.netlifySiteUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Site
          </a>
        </div>
      </CardFooter>
    </Card>
  );
} 