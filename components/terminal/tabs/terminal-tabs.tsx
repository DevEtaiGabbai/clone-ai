"use client";

import { Button } from "@/components/ui/button";
import { TerminalTabInfo } from "@/components/web-container/types";
import { Plus, X } from "lucide-react";

interface TerminalTabsProps {
  activeTerminal: string;
  additionalTerminals: TerminalTabInfo[];
  onTerminalSelect: (id: string) => void;
  onTerminalAdd: () => void;
  onTerminalRemove: (id: string) => void;
}

export function TerminalTabs({
  activeTerminal,
  additionalTerminals,
  onTerminalSelect,
  onTerminalAdd,
  onTerminalRemove,
}: TerminalTabsProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted">
      <div
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded cursor-pointer ${
          activeTerminal === 'dev-server' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onTerminalSelect('dev-server')}
      >
        Dev Server
      </div>
      {additionalTerminals.map(({ id }, index) => (
        <div
          key={id}
          className={`flex items-center gap-1 px-2 py-1 text-sm rounded cursor-pointer ${
            activeTerminal === id ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTerminalSelect(id)}
        >
          Terminal {index + 1}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTerminalRemove(id);
            }}
            className="p-0.5 hover:bg-muted-foreground/20 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onTerminalAdd}
        title="Add new terminal"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
} 