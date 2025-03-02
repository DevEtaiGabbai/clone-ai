import { WebContainer } from "@webcontainer/api";
import { TerminalRef } from "../terminal";
import { RefObject } from "react";

export interface File {
  path: string;
  content: string;
}

export interface WebContainerProps {
  files: File[];
  persistentMode?: boolean;
  devServerTerminal?: RefObject<TerminalRef>;
}

export interface TerminalTabInfo {
  id: string;
  ref: RefObject<TerminalRef>;
}

export interface WebContainerContext {
  instance: WebContainer | null;
  loading: boolean;
  error: string | null;
  url: string;
  iframeUrl?: string;
  handleCommand: (command: string, terminalRef: RefObject<TerminalRef>) => Promise<void>;
  updateFile: (path: string, content: string) => Promise<void>;
} 