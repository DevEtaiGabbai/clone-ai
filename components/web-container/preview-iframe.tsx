"use client";

import { Loader } from "lucide-react";
import { forwardRef } from "react";
import { Icons } from "../ui/icons";

interface PreviewIframeProps {
  url?: string;
}

export const PreviewIframe = forwardRef<HTMLIFrameElement, PreviewIframeProps>(
  ({ url }, ref) => {
    if (!url) {
      return (
        <div className="flex items-center justify-center h-full bg-background text-muted-foreground">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
            <p className="mb-2">Waiting for server to start...</p>
            <p className="text-sm">The preview will appear here once the development server is running.</p>
          </div>
        </div>
      );
    }

    // Extract the base URL without any cache-busting parameters
    const baseUrl = url.split('?')[0];
    
    return (
      <iframe
        ref={ref}
        src={url}
        key={url}
        className="w-full h-full border-0 bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
      />
    );
  }
);

PreviewIframe.displayName = "PreviewIframe"; 