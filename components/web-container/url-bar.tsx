"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, RotateCw, ExternalLink, Power } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  // Extract just the path from the full URL
  const getDisplayPath = (fullUrl: string) => {
    try {
      if (!fullUrl) return '';
      const urlObj = new URL(fullUrl);
      return urlObj.pathname || '/';
    } catch {
      return fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
    }
  };

  const displayPath = getDisplayPath(url);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // If it starts with a slash or is empty, treat as a path
    const newPath = inputValue.startsWith('/') ? inputValue : `/${inputValue}`;
    
    try {
      if (url) {
        const urlObj = new URL(url);
        urlObj.pathname = newPath;
        onUrlChange(urlObj.toString());
      } else {
        onUrlChange(newPath);
      }
    } catch {
      onUrlChange(newPath);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRefresh();
    }
  };

  const openInNewTab = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
      <div className="flex-1 flex items-center gap-1 bg-background rounded-md border px-2 h-9">
        <div className="w-3 h-3 rounded-full bg-muted-foreground/20"></div>
        <Input
          type="text"
          value={displayPath}
          onChange={handleUrlChange}
          onKeyDown={handleUrlKeyDown}
          placeholder="Enter path (e.g., /dashboard)"
          className="flex-1 border-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        title="Refresh preview"
        className="h-8 w-8"
      >
        <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openInNewTab} disabled={!url} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRestartDevServer} className="gap-2">
            <Power className="h-4 w-4" />
            Restart Dev Server
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 