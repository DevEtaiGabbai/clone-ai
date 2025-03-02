import { TerminalRef } from "../terminal";

export interface TerminalTabInfo {
  id: string;
  name: string;
  ref: React.RefObject<TerminalRef>;
  isDevServer?: boolean;
} 