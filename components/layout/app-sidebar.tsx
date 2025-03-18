import * as React from "react";
import {
  ChevronRight,
  ArrowLeft,
  File,
  Folder,
  ChevronDown,
  Check,
  X,
  Code,
  Bookmark,
  Pencil,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icons } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: TreeNode[];
}

interface DeploymentStatus {
  deployed: boolean;
  url?: string;
  lastDeployed?: string;
}

interface AppSidebarProps {
  files: Array<{ path: string; content: string }>;
  selectedFile?: string | null;
  onFileSelect: (path: string) => void;
  projectName: string;
  projectDescription?: string | null;
  deploymentStatus?: DeploymentStatus;
  onCloseSidebar?: () => void;
  createdAt?: string;
  fileCount?: number;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function AppSidebar({
  files,
  selectedFile,
  onFileSelect,
  projectName,
  projectDescription,
  deploymentStatus,
  onCloseSidebar,
  createdAt,
  fileCount = 0,
  user,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  // Build file tree from flat files array
  const buildFileTree = (files: Array<{ path: string; content: string }>): TreeNode[] => {
    const root: TreeNode[] = [];

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentLevel = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');
        let node = currentLevel.find(n => n.name === part);

        if (!node) {
          node = {
            name: part,
            path,
            type: isFile ? 'file' : 'directory',
            children: [],
          };
          currentLevel.push(node);
        }

        currentLevel = node.children;
      });
    });

    // Sort the tree: directories first, then files, both alphabetically
    const sortTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      }).map(node => ({
        ...node,
        children: sortTree(node.children)
      }));
    };

    return sortTree(root);
  };

  const fileTree = buildFileTree(files);

  return (
    <Sidebar {...props} className="border-r border-border/10">
      <SidebarHeader className="border-b">
        <div className="flex flex-col space-y-4">
          {/* Logo and project section */}
          <div className="flex items-center gap-3">
            <Icons.logo className="h-7 w-7 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">cloneai.dev</span>
              <span className="text-xs text-muted-foreground">Clone of notion.so</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">Back to dashboard</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-black/95 backdrop-blur-sm flex flex-col h-full border-t border-border/10">
        <div className="flex flex-col flex-1 overflow-hidden pt-5 px-5">
          {/* Files Section */}
          <span className="text-xs text-muted-foreground pb-2">Files</span>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto file-tree-container flex-1 pb-20">
              <div className="file-tree">
                {fileTree.map((node) => (
                  <FileTreeNode
                    key={node.path}
                    node={node}
                    selectedFile={selectedFile}
                    onFileSelect={onFileSelect}
                    level={0}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function FileTreeNode({
  node,
  selectedFile,
  onFileSelect,
  level = 0
}: {
  node: TreeNode;
  selectedFile?: string | null;
  onFileSelect: (path: string) => void;
  level: number;
}) {
  const isFile = node.type === 'file';
  const isActive = node.path === selectedFile;
  const [isOpen, setIsOpen] = React.useState(level < 2); // Auto-expand first two levels

  if (isFile) {
    return (
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md text-xs cursor-pointer transition-colors relative",
          isActive ?
            "bg-accent text-accent-foreground" :
            "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        {/* Tree connector lines */}
        {level > 0 && (
          <div className="absolute left-0 top-0 h-full">
            {Array.from({ length: level }).map((_, i) => (
              <div
                key={i}
                className="absolute border-l border-border/50 h-full"
                style={{ left: `${(i + 1) * 12 - 4}px` }}
              />
            ))}
            <div
              className="absolute border-t border-border/50 w-2 h-1"
              style={{ left: `${level * 12 - 4}px`, top: '50%' }}
            />
          </div>
        )}
        <File className="h-3.5 w-3.5 text-muted-foreground mr-1.5 shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded-md text-xs cursor-pointer select-none relative",
          "hover:bg-muted transition-colors"
        )}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Tree connector lines */}
        {level > 0 && (
          <div className="absolute left-0 top-0 h-full">
            {Array.from({ length: level }).map((_, i) => (
              <div
                key={i}
                className="absolute border-l border-border/50 h-full"
                style={{ left: `${(i + 1) * 12 - 4}px` }}
              />
            ))}
            <div
              className="absolute border-t border-border/50 w-2 h-1"
              style={{ left: `${level * 12 - 4}px`, top: '50%' }}
            />
          </div>
        )}
        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
          isOpen && "rotate-90"
        )} />
        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium text-muted-foreground">{node.name}</span>
      </div>

      {isOpen && (
        <div className="relative overflow-hidden">
          {/* Vertical connector line */}
          {node.children.length > 0 && (
            <div
              className="absolute border-l border-border/50 h-full"
              style={{ left: `${(level + 1) * 12 - 4}px` }}
            />
          )}
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
} 