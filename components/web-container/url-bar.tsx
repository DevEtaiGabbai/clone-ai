"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, ExternalLink, Power, Globe, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlBarProps {
  url: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onRefresh: () => void;
  onRestartDevServer: () => void;
}

export function validateUrl(url: string) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function UrlBar({ url, loading, onUrlChange, onRefresh, onRestartDevServer }: UrlBarProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopyUrl = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInNewTab = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/10 border-b backdrop-blur-sm">
      <div className="flex-1 flex items-center bg-background/90 rounded-md border shadow-sm">
        {/* URL display */}
        <div className="flex-1 flex items-center px-3 py-1.5 h-9 gap-1.5 overflow-hidden">
          <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          
          {url ? (
            <span className="text-sm truncate text-muted-foreground font-medium">{url}</span>
          ) : (
            <div className="flex-1 flex items-center">
              <div className="h-4 bg-muted animate-pulse rounded w-full max-w-[300px]" />
            </div>
          )}
        </div>
        
        {/* Actions group */}
        <div className="flex items-center border-l">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyUrl}
            className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/20"
            title={copied ? "URL copied!" : "Copy URL"}
            disabled={!url}
          >
            {copied ? 
              <Check className="h-3.5 w-3.5 text-green-500" /> : 
              <Copy className="h-3.5 w-3.5" />
            }
          </Button>
          
          <div className="h-5 border-r mx-0.5 border-muted/20"></div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={openInNewTab}
            className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/20"
            title="Open in new tab"
            disabled={!url}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          
          <div className="h-5 border-r mx-0.5 border-muted/20"></div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/20"
            title="Refresh preview"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
          </Button>
          
          <div className="h-5 border-r mx-0.5 border-muted/20"></div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestartDevServer}
            className="h-9 w-9 rounded-none rounded-r-md text-muted-foreground hover:text-foreground hover:bg-red-500/10"
            title="Restart Dev Server"
          >
            <Power className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 