"use client";

import { WebContainer as WebContainerType } from "@webcontainer/api";
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { TerminalRef } from "@/components/terminal";
import Terminal from "@/components/terminal/terminal";
import React from "react";
import { UrlBar } from "@/components/web-container/url-bar";
import { PreviewIframe } from "@/components/web-container/preview-iframe";
import { formatTerminalOutput, processFiles } from "@/components/web-container/utils";
import { WebContainerProps, TerminalTabInfo } from "@/components/web-container/types";

// Track if we're currently cleaning up an instance
let isCleaningUp = false;
// Track the global WebContainer instance
let globalWebContainerInstance: WebContainerType | null = null;

// Define the interface for imperative methods
export interface WebContainerHandle {
  updateFile: (path: string, content: string) => Promise<void>;
  executeCommand: (command: string, terminalRef: React.RefObject<TerminalRef>) => Promise<void>;
  refreshPreview: () => void;
  restart: () => Promise<void>;
}

export const WebContainer = forwardRef<WebContainerHandle, WebContainerProps & { persistentMode?: boolean }>(
  ({ files, persistentMode = false, devServerTerminal }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const instanceRef = useRef<WebContainerType | null>(null);
    const [url, setUrl] = useState('');
    const [iframeUrl, setIframeUrl] = useState<string | undefined>();
    const localDevServerTerminalRef = useRef<TerminalRef>(null);
    // Use the provided terminal ref if available, otherwise use the local one
    const devServerTerminalRef = devServerTerminal || localDevServerTerminalRef;
    const [additionalTerminals, setAdditionalTerminals] = useState<TerminalTabInfo[]>([]);
    const [activeTerminal, setActiveTerminal] = useState<string>('dev-server');
    const mountedFilesRef = useRef<Record<string, any>>({});
    const [filesLoaded, setFilesLoaded] = useState(false);

    // Expose methods to parent components through the ref
    useImperativeHandle(ref, () => ({
      updateFile: async (path: string, content: string) => {
        if (!instanceRef.current) {
          console.error("WebContainer instance not available");
          return Promise.reject(new Error("WebContainer instance not available"));
        }
        
        try {
          // Log to terminal
          if (devServerTerminalRef.current) {
            devServerTerminalRef.current.writeln(`\nUpdating file: ${path}`);
          }
          
          // Update the file in the WebContainer
          await instanceRef.current.fs.writeFile(path, content);
          
          // Log success
          if (devServerTerminalRef.current) {
            devServerTerminalRef.current.writeln(`File ${path} updated successfully`);
          }
          
          // Update the mounted files reference to keep track of changes
          const pathParts = path.split('/');
          let current = mountedFilesRef.current;
          
          // Navigate to the directory containing the file
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part]) {
              current[part] = { directory: {} };
            }
            current = current[part].directory;
          }
          
          // Update the file content in our reference
          const fileName = pathParts[pathParts.length - 1];
          if (current[fileName] && current[fileName].file) {
            current[fileName].file.contents = content;
          } else {
            current[fileName] = {
              file: {
                contents: content,
              },
            };
          }
          
          // For Next.js files, we need to touch a file to trigger HMR
          // This is a workaround to ensure Next.js detects the file change
          if (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.js')) {
            try {
              // Create or update a temporary file to trigger HMR
              const tempFilePath = '.trigger-refresh';
              const timestamp = new Date().toISOString();
              await instanceRef.current.fs.writeFile(tempFilePath, `// Trigger refresh: ${timestamp}`);
              
              if (devServerTerminalRef.current) {
                console.log(`Triggered Next.js HMR refresh`);
              }
            } catch (err) {
              console.warn('Failed to trigger HMR refresh:', err);
            }
          }
          
          return Promise.resolve();
        } catch (error) {
          console.error(`Failed to update file ${path}:`, error);
          if (devServerTerminalRef.current) {
            devServerTerminalRef.current.writeln(`\nError updating file ${path}: ${error}`);
          }
          return Promise.reject(error);
        }
      },
      executeCommand: async (command: string, terminalRef: React.RefObject<TerminalRef>) => {
        if (!instanceRef.current || !terminalRef.current) {
          console.error("WebContainer instance or terminal not available");
          return;
        }
        
        try {
          const process = await instanceRef.current.spawn("sh", ["-c", command]);
          
          process.output.pipeTo(
            new WritableStream({
              write(data) {
                if (terminalRef.current) {
                  terminalRef.current.writeln(formatTerminalOutput(data));
                }
              },
            })
          );

          const exitCode = await process.exit;
          if (exitCode !== 0) {
            terminalRef.current.writeln(`Command failed with exit code ${exitCode}`);
          }
        } catch (error) {
          if (terminalRef.current) {
            terminalRef.current.writeln(`Error: ${error instanceof Error ? error.message : 'Failed to execute command'}`);
          }
        }
      },
      refreshPreview: () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          try {
            if (devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln("\nRefreshing preview...");
            }
            
            // Show loading state while refreshing
            setLoading(true);
            
            // Force a hard refresh of the iframe
            try {
              // Get the current URL
              const currentUrl = iframeRef.current.src;
              
              // Create a new URL with a cache-busting parameter
              const timestamp = Date.now();
              const refreshUrl = currentUrl.includes('?') 
                ? currentUrl.replace(/([?&])_t=\d+/, `$1_t=${timestamp}`)
                : `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}_t=${timestamp}`;
              
              // Set the new URL to force a refresh
              iframeRef.current.src = refreshUrl;
              
              // Listen for the iframe to load
              const handleLoad = () => {
                setLoading(false);
                if (devServerTerminalRef.current) {
                  devServerTerminalRef.current.writeln("Preview refreshed successfully");
                }
                iframeRef.current?.removeEventListener('load', handleLoad);
              };
              
              iframeRef.current.addEventListener('load', handleLoad);
              
              // Set a timeout to reset loading state in case the load event doesn't fire
              setTimeout(() => {
                setLoading(false);
              }, 3000);
            } catch (e) {
              console.error("Error refreshing preview:", e);
              
              // Fallback to a simple reload
              try {
                iframeRef.current.contentWindow.location.reload();
              } catch (reloadError) {
                console.error("Failed to reload iframe:", reloadError);
              }
              
              // Reset loading state after a delay
              setTimeout(() => {
                setLoading(false);
                if (devServerTerminalRef.current) {
                  devServerTerminalRef.current.writeln("Preview refresh completed");
                }
              }, 1000);
            }
          } catch (outerError) {
            console.error("Failed to refresh preview:", outerError);
            setLoading(false);
            if (devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln(`Error refreshing preview: ${outerError}`);
            }
          }
        }
      },
      restart: async () => {
        await restartDevServer();
      }
    }));

    const restartDevServer = useCallback(async () => {
      if (instanceRef.current && devServerTerminalRef.current) {
        try {
          devServerTerminalRef.current.writeln("\nRestarting dev server...");
          setLoading(true);
          
          // Kill any existing dev process
          try {
            await instanceRef.current.spawn("pkill", ["-f", "node"]);
          } catch (error) {
            // Ignore errors when trying to kill processes
            console.log("Failed to kill processes, continuing anyway:", error);
          }
          
          // Small delay to ensure processes are terminated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Start the dev server again
          const devProcess = await instanceRef.current.spawn("npm", ["run", "dev"]);
          
          devProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                if (devServerTerminalRef.current) {
                  devServerTerminalRef.current.writeln(formatTerminalOutput(data));
                }
              },
            })
          );
          
          // Set a timeout to stop loading if server doesn't respond
          const timeout = setTimeout(() => {
            setLoading(false);
          }, 10000);
          
          // Listen for server ready event
          instanceRef.current.on("server-ready", (port, serverUrl) => {
            clearTimeout(timeout);
            setUrl(serverUrl);
            setIframeUrl(serverUrl);
            setLoading(false);
            
            if (devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln(`\nDev server restarted successfully at ${serverUrl}`);
            }
          });
          
          // Handle process exit
          devProcess.exit.then((code) => {
            clearTimeout(timeout);
            setLoading(false);
            if (code !== 0 && devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln(`\nDev server exited with code ${code}`);
            }
          });
          
        } catch (error) {
          console.error('Failed to restart dev server:', error);
          setLoading(false);
          if (devServerTerminalRef.current) {
            devServerTerminalRef.current.writeln(`\nFailed to restart dev server: ${error}`);
          }
        }
      }
    }, [devServerTerminalRef]);

    const handleUrlChange = useCallback((newUrl: string) => {
      setUrl(newUrl);
      try {
        const baseUrl = new URL(iframeUrl || '');
        baseUrl.pathname = newUrl.startsWith('/') ? newUrl : `/${newUrl}`;
        setIframeUrl(baseUrl.toString());
      } catch (error) {
        setUrl(newUrl);
      }
    }, [iframeUrl]);

    // Handle refresh button click - use the refreshPreview method
    const handleRefresh = useCallback(() => {
      // Just call the refreshPreview method directly
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // Show loading state while refreshing
        setLoading(true);
        
        if (devServerTerminalRef.current) {
          devServerTerminalRef.current.writeln("\nRefreshing preview...");
        }
        
        // Use our refreshPreview implementation logic
        try {
          // Get the current URL
          const currentUrl = iframeRef.current.src;
          
          // Create a new URL with a cache-busting parameter
          const timestamp = Date.now();
          const refreshUrl = currentUrl.includes('?') 
            ? currentUrl.replace(/([?&])_t=\d+/, `$1_t=${timestamp}`)
            : `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}_t=${timestamp}`;
          
          // Set the new URL to force a refresh
          iframeRef.current.src = refreshUrl;
          
          // Listen for the iframe to load
          const handleLoad = () => {
            setLoading(false);
            if (devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln("Preview refreshed successfully");
            }
            iframeRef.current?.removeEventListener('load', handleLoad);
          };
          
          iframeRef.current.addEventListener('load', handleLoad);
          
          // Set a timeout to reset loading state in case the load event doesn't fire
          setTimeout(() => {
            setLoading(false);
          }, 3000);
        } catch (e) {
          console.error("Error refreshing preview:", e);
          setLoading(false);
        }
      }
    }, [devServerTerminalRef]);

    const addNewTerminal = useCallback(() => {
      const newTerminalRef = React.createRef<TerminalRef>();
      const newId = `terminal-${Date.now()}`;
      setAdditionalTerminals(prev => [...prev, { id: newId, ref: newTerminalRef }]);
      setActiveTerminal(newId);
    }, []);

    const removeTerminal = useCallback((id: string) => {
      setAdditionalTerminals(prev => prev.filter(t => t.id !== id));
      setActiveTerminal('dev-server');
    }, []);

    const handleTerminalCommand = useCallback(async (command: string, terminalRef: React.RefObject<TerminalRef>) => {
      if (!instanceRef.current || !terminalRef.current) return;

      try {
        const process = await instanceRef.current.spawn("sh", ["-c", command]);
        
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef.current) {
                terminalRef.current.writeln(formatTerminalOutput(data));
              }
            },
          })
        );

        const exitCode = await process.exit;
        if (exitCode !== 0) {
          terminalRef.current.writeln(`Command failed with exit code ${exitCode}`);
        }
      } catch (error) {
        if (terminalRef.current) {
          terminalRef.current.writeln(`Error: ${error instanceof Error ? error.message : 'Failed to execute command'}`);
        }
      }
    }, []);

    // Function to check if cross-origin isolation is enabled
    const checkCrossOriginIsolation = () => {
      if (!crossOriginIsolated) {
        throw new Error(
          "Cross-Origin Isolation is not enabled. Please reload the page. If the error persists, try clearing your browser cache."
        );
      }
    };

    // Function to safely cleanup WebContainer instance
    const cleanup = async () => {
      if (isCleaningUp) return;
      isCleaningUp = true;

      try {
        if (globalWebContainerInstance) {
          await globalWebContainerInstance.teardown();
          globalWebContainerInstance = null;
          instanceRef.current = null;
        }
      } catch (e) {
        console.warn("Error during cleanup:", e);
      } finally {
        isCleaningUp = false;
      }
    };

    // Effect to initialize WebContainer once
    useEffect(() => {
      let mounted = true;

      async function initializeWebContainer() {
        if (globalWebContainerInstance) {
          // If we already have a global instance, use it
          instanceRef.current = globalWebContainerInstance;
          setLoading(false);
          return;
        }

        try {
          checkCrossOriginIsolation();
          
          const { WebContainer } = await import("@webcontainer/api");
          if (!mounted) return;

          globalWebContainerInstance = await WebContainer.boot();
          instanceRef.current = globalWebContainerInstance;
          
          if (!mounted) {
            await cleanup();
            return;
          }
          
          setFilesLoaded(true);
        } catch (error) {
          if (mounted) {
            console.error("Failed to initialize WebContainer:", error);
            setError(error instanceof Error ? error.message : "Failed to initialize WebContainer");
            setLoading(false);
          }
        }
      }

      initializeWebContainer();

      return () => {
        mounted = false;
      };
    }, []);

    // Effect to handle files and start dev server
    useEffect(() => {
      let mounted = true;

      async function setupFilesAndStartServer() {
        if (!filesLoaded || !instanceRef.current || !files.length) return;

        try {
          setError(null);
          
          // Check if we already have a running server
          const hasExistingServer = url !== '' && iframeUrl !== undefined;
          
          // Only reset URL if we're starting fresh
          if (!hasExistingServer) {
            setUrl('');
            setIframeUrl(undefined);
          }
          
          // Only mount files if they haven't been mounted yet or if we're forcing a remount
          const shouldMountFiles = Object.keys(mountedFilesRef.current).length === 0;
          
          if (shouldMountFiles) {
            // Mount files
            const webContainerFiles = processFiles(files);
            mountedFilesRef.current = webContainerFiles;
            await instanceRef.current.mount(webContainerFiles);

            if (!mounted) return;

            if (devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln("Installing dependencies...");
            }
            
            const installProcess = await instanceRef.current.spawn("npm", ["install"]);
            installProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (mounted && devServerTerminalRef.current) {
                    devServerTerminalRef.current.writeln(formatTerminalOutput(data));
                  }
                },
              })
            );

            const installExitCode = await installProcess.exit;
            if (!mounted) return;

            if (installExitCode !== 0) {
              throw new Error("Failed to install dependencies");
            }

            if (devServerTerminalRef.current) {
              devServerTerminalRef.current.writeln("\nStarting development server...");
            }
            
            const devProcess = await instanceRef.current.spawn("npm", ["run", "dev"]);
            devProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (mounted && devServerTerminalRef.current) {
                    devServerTerminalRef.current.writeln(formatTerminalOutput(data));
                  }
                },
              })
            );

            instanceRef.current.on("server-ready", (port, url) => {
              if (mounted) {
                setUrl(url);
                setIframeUrl(url);
                setLoading(false);
              }
            });

            devProcess.exit.then((code) => {
              if (mounted && code !== 0) {
                setError("Dev server exited with code " + code);
              }
            });
          } else if (hasExistingServer) {
            // If we already have a server running, just refresh the preview
            setTimeout(() => {
              if (mounted) {
                setLoading(false);
              }
            }, 500);
          }
        } catch (error) {
          if (mounted) {
            console.error("Failed to start WebContainer:", error);
            setError(error instanceof Error ? error.message : "Failed to start WebContainer");
            setLoading(false);
          }
        }
      }

      setupFilesAndStartServer();

      return () => {
        mounted = false;
      };
    }, [files, filesLoaded, url, iframeUrl, devServerTerminalRef]);

    // Cleanup on unmount only if not in persistent mode
    useEffect(() => {
      return () => {
        if (!persistentMode) {
          cleanup().catch(console.warn);
        }
      };
    }, [persistentMode]);

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <UrlBar
          url={url}
          loading={loading}
          onUrlChange={setUrl}
          onRefresh={handleRefresh}
          onRestartDevServer={restartDevServer}
        />
        <div className="flex-1 overflow-hidden">
          <PreviewIframe ref={iframeRef} url={iframeUrl} />
        </div>
        {!devServerTerminal && (
          <Terminal 
            ref={localDevServerTerminalRef}
            readOnly={true}
            prompt="~/project > "
          />
        )}
      </div>
    );
  }
);

WebContainer.displayName = "WebContainer";