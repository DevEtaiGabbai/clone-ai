"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Terminal as XTerm } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import type { WebLinksAddon } from '@xterm/addon-web-links';
import { getTerminalTheme } from './terminal-theme';
import '@xterm/xterm/css/xterm.css';

export interface TerminalRef {
  terminal: XTerm | null;
  writeln: (text: string) => void;
  write: (text: string) => void;
  clear: () => void;
  prompt: (promptText: string) => Promise<string>;
}

interface TerminalProps {
  className?: string;
  prompt?: string;
  onCommand?: (command: string) => void;
  readOnly?: boolean;
}

const Terminal = forwardRef<TerminalRef, TerminalProps>(({ className, prompt = "~/project > ", onCommand, readOnly = false }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useImperativeHandle(ref, () => ({
    terminal: terminalInstance.current,
    writeln: (text: string) => {
      terminalInstance.current?.writeln(text);
    },
    write: (text: string) => {
      terminalInstance.current?.write(text);
    },
    clear: () => {
      terminalInstance.current?.clear();
    },
    prompt: async (promptText: string) => {
      return new Promise((resolve) => {
        resolve("");
      });
    }
  }), []);

  useEffect(() => {
    let mounted = true;
    let currentLine = '';
    let currentPosition = 0;
    let resizeObserver: ResizeObserver | null = null;

    async function initializeTerminal() {
      if (!terminalRef.current) return;

      // Dynamic imports
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');
      
    
      if (!mounted) return;

      const terminal = new Terminal({
        cursorBlink: !readOnly,
        cursorStyle: readOnly ? 'underline' : 'block',
        disableStdin: readOnly,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: getTerminalTheme(),
        convertEol: true,
        rows: 20,
        scrollback: 1000
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      const container = terminalRef.current;
      container.style.padding = '12px';
      container.style.backgroundColor = '#0d1117';
      terminal.open(container);

      terminalInstance.current = terminal;
      fitAddonRef.current = fitAddon;

      // Initial fit
      setTimeout(() => {
        fitAddon.fit();
      }, 0);
      
      if (!readOnly) {
        terminal.write(prompt);

        // Add keyboard event handling
        terminal.onKey(({ key, domEvent }) => {
          const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

          if (domEvent.keyCode === 13) { // Enter key
            terminal.write('\r\n');
            if (onCommand) {
              onCommand(currentLine);
            }
            currentLine = '';
            currentPosition = 0;
            terminal.write(prompt);
          } else if (domEvent.keyCode === 8) { // Backspace
            if (currentPosition > 0) {
              currentLine = currentLine.slice(0, -1);
              currentPosition--;
              terminal.write('\b \b');
            }
          } else if (printable) {
            currentLine += key;
            currentPosition++;
            terminal.write(key);
          }
        });
      }

      // Create a ResizeObserver to handle container resizing
      resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      });
      
      // Observe the terminal container
      resizeObserver.observe(container);
    }

    initializeTerminal();

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      terminalInstance.current?.dispose();
    };
  }, [prompt, onCommand, readOnly]);

  return (
    <div 
      ref={terminalRef}
      className={`border relative ${className || ''} ${readOnly ? 'cursor-default' : 'cursor-text'}`}
      style={{ 
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        backgroundColor: '#0d1117',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style jsx global>{`
        .xterm {
          height: 100%;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .xterm-viewport {
          overflow-y: auto !important;
          flex: 1;
        }

        .xterm-screen {
          height: auto !important;
        }
      `}</style>
    </div>
  );
});

Terminal.displayName = 'Terminal';

export default Terminal;