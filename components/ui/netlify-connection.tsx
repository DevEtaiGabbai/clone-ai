'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Loader2, X, Calendar, Clock, Globe, Link2, RefreshCw, RotateCw, Lock, KeyRound, MoreVertical, LogOut, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getInitialNetlifyConnection, 
  connectToNetlify, 
  disconnectFromNetlify,
  fetchNetlifyStats
} from '@/lib/netlify';
import { Icons } from '@/components/ui/icons';
import type { NetlifyConnection, NetlifySite } from '@/types/netlify';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

export function NetlifyConnectionCard() {
  const [connection, setConnection] = useState<NetlifyConnection>(getInitialNetlifyConnection());
  const [connecting, setConnecting] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [token, setToken] = useState(connection.token || '');
  const statsRequestRef = useRef<number | null>(null);

  // Fetch sites when user is connected but only once
  useEffect(() => {
    if (connection.user && connection.token && !connection.stats) {
      loadNetlifyStats();
    }
    
    // Clear any existing timeout when component unmounts
    return () => {
      if (statsRequestRef.current) {
        window.clearTimeout(statsRequestRef.current);
      }
    };
  }, [connection.user, connection.token]);

  // Handle potential external changes to localStorage (e.g., from other components)
  useEffect(() => {
    const handleStorageChange = () => {
      setConnection(getInitialNetlifyConnection());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadNetlifyStats = async () => {
    if (!connection.token || fetchingStats) return;
    
    // Clear any existing timeout to prevent overlapping requests
    if (statsRequestRef.current) {
      window.clearTimeout(statsRequestRef.current);
      statsRequestRef.current = null;
    }
    
    setFetchingStats(true);
    try {
      const stats = await fetchNetlifyStats(connection.token);
      // Refresh connection data from localStorage
      setConnection(getInitialNetlifyConnection());
    } catch (error) {
      console.error('Error loading Netlify stats:', error);
    } finally {
      setFetchingStats(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('Please enter your Netlify token');
      return;
    }

    setConnecting(true);
    try {
      const success = await connectToNetlify(token);
      if (success) {
        setConnection(getInitialNetlifyConnection());
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectFromNetlify();
    setConnection(getInitialNetlifyConnection());
    setToken('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to extract domain from URL for display
  const formatDomain = (url: string) => {
    if (!url) return 'N/A';
    try {
      const domain = url.replace(/https?:\/\//i, '').split('/')[0];
      return domain;
    } catch (error) {
      return url;
    }
  };

  const getDeployTimeText = (site: NetlifySite) => {
    if (!site.published_deploy?.deploy_time) return 'N/A';
    
    const deployTime = site.published_deploy.deploy_time;
    if (deployTime < 60) {
      return `${deployTime}s`;
    } else {
      return `${Math.floor(deployTime / 60)}m ${deployTime % 60}s`;
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Icons.netlify className="h-5 w-5 text-[#00AD9F]" />
          <h2 className="text-xl font-semibold">Netlify Integration</h2>
        </div>
      </div>
      
      {!connection.user ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Personal Access Token
            </label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={connecting}
              placeholder="Enter your Netlify personal access token"
              className=""
            />
            <p className="text-xs text-muted-foreground">
              <a
                href="https://app.netlify.com/user/applications#personal-access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
              >
                Get your token from Netlify
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={connecting || !token.trim()} 
            className="w-full"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Icons.netlify className="mr-2 h-4 w-4" />
                Connect to Netlify
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col space-y-5">
            <div className="border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 rounded-full overflow-hidden">
                    <AvatarImage src={connection.user.avatar_url} alt={connection.user.full_name} />
                    <AvatarFallback className="bg-[#00AD9F]/10 text-[#00AD9F]">{connection.user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium">{connection.user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{connection.user.email}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="cursor-pointer flex items-center gap-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30" 
                      onClick={handleDisconnect}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Disconnect Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-foreground" />
                <h3 className="font-medium">Your Netlify Sites</h3>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={loadNetlifyStats}
                disabled={fetchingStats}
                className="h-8 w-8 rounded-full"
              >
                <RotateCw className={`h-4 w-4 ${fetchingStats ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            {fetchingStats ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading sites...</span>
              </div>
            ) : connection.stats?.sites.length ? (
              <ScrollArea className="h-[280px] pr-2 -mr-2 overflow-y-auto">
                <div className="space-y-3">
                  {connection.stats.sites.map((site) => (
                    <div 
                      key={site.id} 
                      className="rounded-xl border border-border/40 bg-muted/20 hover:border-[#00AD9F]/20 hover:bg-muted/30 transition-all duration-300"
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium flex items-center gap-1.5 truncate max-w-[190px]">
                            <Icons.netlify className="h-3.5 w-3.5 text-[#00AD9F]" />
                            {site.name}
                          </h4>
                          <div className="flex gap-1">
                            <a
                              href={site.ssl_url || site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-muted transition-colors"
                              title="Visit site"
                            >
                              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                            <a
                              href={site.admin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-muted transition-colors"
                              title="Netlify admin"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1" title="Domain">
                            <Globe className="h-3 w-3" />
                            <span className="truncate max-w-[140px]">
                              {formatDomain(site.ssl_url || site.url)}
                            </span>
                          </div>
                          
                          {site.published_deploy?.published_at && (
                            <div className="flex items-center gap-1" title="Published at">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(site.published_deploy.published_at)}</span>
                            </div>
                          )}
                          
                          {site.published_deploy?.deploy_time && (
                            <div className="flex items-center gap-1" title="Deploy time">
                              <Clock className="h-3 w-3" />
                              <span>{getDeployTimeText(site)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium mb-1">No sites found</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  You don't have any sites on Netlify yet
                </p>
                <a
                  href="https://app.netlify.com/start"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00AD9F] hover:underline text-xs inline-flex items-center gap-1"
                >
                  Create a new site
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-2 mt-6">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Your token is stored securely in your browser cookies
        </p>
      </div>
    </div>
  );
} 