import { File, Folder } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

interface FileBreadcrumbProps {
  pathSegments?: string[];
  onFileSelect?: (filePath: string) => void;
  getDirectoryContents?: (path: string) => Array<FileTreeNode>;
  selectedFile?: string | null;
}

export const FileBreadcrumb = memo<FileBreadcrumbProps>(({ 
  pathSegments = [], 
  onFileSelect,
  getDirectoryContents = () => [],
  selectedFile
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [directoryContents, setDirectoryContents] = useState<{[key: string]: FileTreeNode[]}>({});
  
  // Reset state when path changes
  useEffect(() => {
    setOpenDropdown(null);
  }, [selectedFile]);

  if (pathSegments.length === 0) {
    return null;
  }

  const handleDirectoryClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Fetch directory contents if we don't have them yet
    if (!directoryContents[path]) {
      const contents = getDirectoryContents(path);
      setDirectoryContents(prev => ({ ...prev, [path]: contents }));
    }
    
    // Toggle dropdown
    setOpenDropdown(openDropdown === path ? null : path);
  };

  const handleItemClick = (item: FileTreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (item.type === 'directory') {
      // For directories, load their contents and update the dropdown
      const contents = getDirectoryContents(item.path);
      setDirectoryContents(prev => ({ ...prev, [item.path]: contents }));
      
      // Find a file in this directory to navigate to
      const firstFile = findFirstFileInDirectory(contents);
      if (firstFile) {
        onFileSelect?.(firstFile);
      }
      
      // Close current dropdown
      setOpenDropdown(null);
    } else {
      // For files, navigate to them
      onFileSelect?.(item.path);
      setOpenDropdown(null);
    }
  };
  
  // Helper function to find the first file in a directory
  const findFirstFileInDirectory = (items: FileTreeNode[]): string | null => {
    // First try to find a direct file
    const file = items.find(item => item.type === 'file');
    if (file) return file.path;
    
    // If no direct files, look in subdirectories
    for (const item of items) {
      if (item.type === 'directory') {
        const subContents = getDirectoryContents(item.path);
        const subFile = findFirstFileInDirectory(subContents);
        if (subFile) return subFile;
      }
    }
    
    return null;
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex flex-nowrap items-center text-xs">
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const path = pathSegments.slice(0, index + 1).join('/');
          
          return (
            <BreadcrumbItem key={index} className="flex-shrink-0">
              {isLast ? (
                <BreadcrumbPage className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/10">
                  <File className="h-3 w-3 text-primary/70" />
                  <span className="text-foreground font-medium truncate max-w-[120px]">{segment}</span>
                </BreadcrumbPage>
              ) : (
                <DropdownMenu 
                  open={openDropdown === path}
                  onOpenChange={(open) => {
                    if (!open) {
                      setOpenDropdown(null);
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-1 p-0 px-1 h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded"
                      onClick={(e) => handleDirectoryClick(path, e)}
                    >
                      {index === 0 && <Folder className="h-3 w-3 text-primary/70" />}
                      <span className="truncate max-w-[80px]">{segment}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 max-h-[300px] overflow-y-auto"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {directoryContents[path]?.length > 0 ? (
                      directoryContents[path].map((item) => (
                        <DropdownMenuItem 
                          key={item.path}
                          onClick={(e) => handleItemClick(item, e)}
                          className={cn(
                            "flex items-center gap-2 text-xs py-1.5",
                            item.path === selectedFile && "bg-accent text-accent-foreground font-medium"
                          )}
                          disabled={item.path === selectedFile}
                        >
                          {item.type === 'directory' ? (
                            <>
                              <Folder className="h-3.5 w-3.5 text-primary/80" />
                              <span className="flex-1 truncate">{item.name}</span>
                            </>
                          ) : (
                            <>
                              <File className="h-3.5 w-3.5 text-muted-foreground/80" />
                              <span className="truncate">{item.name}</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="text-xs">Empty directory</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!isLast && <BreadcrumbSeparator className="mx-0" />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
});

FileBreadcrumb.displayName = 'FileBreadcrumb'; 