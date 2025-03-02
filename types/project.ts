import React from 'react';

export interface ProjectData {
  project: {
    name: string;
    description: string | null;
  };
  files: {
    path: string;
    content: string;
  }[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: FileTreeNode[];
}

export interface TerminalTab {
  id: string;
  name: string;
  ref: React.RefObject<any>;
  isDevServer?: boolean;
} 