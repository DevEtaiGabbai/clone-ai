import * as React from "react";
import { ChevronRight, File, Folder, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: TreeNode[];
}

interface AppSidebarProps {
  files: Array<{ path: string; content: string }>;
  selectedFile?: string | null;
  onFileSelect: (path: string) => void;
  projectName: string;
  projectDescription?: string | null;
}

export function AppSidebar({ 
  files, 
  selectedFile, 
  onFileSelect, 
  projectName,
  projectDescription,
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
    <Sidebar {...props}>
      <SidebarContent>
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-accent"
              onClick={() => router.push('/dashboard')}
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          
          <div className="space-y-1.5 px-1">
            <h2 className="text-lg font-medium tracking-tight text-foreground">{projectName}</h2>
            {projectDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">{projectDescription}</p>
            )}
          </div>
          
          <Separator className="bg-border/60" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fileTree.map((node) => (
                <FileTreeNode 
                  key={node.path} 
                  node={node} 
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function FileTreeNode({ 
  node, 
  selectedFile, 
  onFileSelect 
}: { 
  node: TreeNode; 
  selectedFile?: string | null;
  onFileSelect: (path: string) => void;
}) {
  const isFile = node.type === 'file';
  const isActive = node.path === selectedFile;

  if (isFile) {
    return (
      <SidebarMenuButton
        isActive={isActive}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
        onClick={() => onFileSelect(node.path)}
      >
        <File className="h-4 w-4" />
        {node.name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={true}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder className="h-4 w-4" />
            {node.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {node.children.map((child) => (
              <FileTreeNode 
                key={child.path} 
                node={child} 
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
} 