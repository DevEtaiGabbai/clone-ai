"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { Plus, X, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalRef } from "@/components/terminal";
import Terminal from "@/components/terminal/terminal";
import { cn } from "@/lib/utils";
import { ResizablePanel } from "@/components/ui/resizable";

export interface TerminalTab {
  id: string;
  name: string;
  ref: React.RefObject<TerminalRef>;
  isDevServer?: boolean;
}

interface TerminalSectionProps {
  terminals: TerminalTab[];
  activeTerminal: string;
  setActiveTerminal: (id: string) => void;
  addNewTerminal: () => void;
  closeTerminal: (id: string) => void;
  webContainerRef: React.RefObject<any>;
}

export function TerminalSection({
  terminals,
  activeTerminal,
  setActiveTerminal,
  addNewTerminal,
  closeTerminal,
  webContainerRef
}: TerminalSectionProps) {
  // Reference to track the last resize
  const lastResizeRef = useRef<number>(0);

  // Effect to handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      // Throttle resize events
      const now = Date.now();
      if (now - lastResizeRef.current > 100) {
        lastResizeRef.current = now;
        
        // Force terminal fit by dispatching a resize event
        window.dispatchEvent(new Event('resize'));
      }
    };

    // Listen for resize events on the ResizablePanel
    const resizableHandles = document.querySelectorAll('[data-panel-group-direction="vertical"]');
    resizableHandles.forEach(handle => {
      handle.addEventListener('mouseup', handleResize);
      handle.addEventListener('touchend', handleResize);
    });

    return () => {
      resizableHandles.forEach(handle => {
        handle.removeEventListener('mouseup', handleResize);
        handle.removeEventListener('touchend', handleResize);
      });
    };
  }, []);

  return (
    <ResizablePanel defaultSize={25} minSize={15} maxSize={50} className="flex flex-col overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center border-b bg-muted/20 shrink-0 overflow-x-hidden">
          <div className="flex-1 flex items-center overflow-x-auto">
            {terminals.map(terminal => (
              <button
                key={terminal.id}
                className={cn(
                  "flex items-center h-9 px-4 border-r",
                  activeTerminal === terminal.id
                    ? "bg-background text-foreground"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                )}
                onClick={() => setActiveTerminal(terminal.id)}
              >
                <TerminalIcon className="h-4 w-4 mr-2" />
                <span>{terminal.name}</span>
                {!terminal.isDevServer && (
                  <button
                    className="ml-2 p-1 rounded-full hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTerminal(terminal.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-none shrink-0"
            onClick={addNewTerminal}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {terminals.map(terminal => (
            <div
              key={terminal.id}
              className={cn(
                "absolute inset-0 h-full",
                activeTerminal === terminal.id ? "block" : "hidden"
              )}
            >
              <div className="h-full overflow-x-auto">
                <Terminal
                  ref={terminal.ref}
                  prompt="~/project > "
                  readOnly={terminal.isDevServer}
                  className="h-full"
                  onCommand={terminal.isDevServer ? undefined : (command) => {
                    if (webContainerRef.current) {
                      webContainerRef.current.executeCommand(command, terminal.ref);
                    } else {
                      if (terminal.ref.current) {
                        terminal.ref.current.writeln("WebContainer is not ready yet. Please wait for it to initialize.");
                      }
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResizablePanel>
  );
} 