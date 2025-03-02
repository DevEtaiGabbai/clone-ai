"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const CodePreviewTab = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn("w-fit", className)}
    {...props}
  />
));
CodePreviewTab.displayName = TabsPrimitive.Root.displayName;

const CodePreviewTabList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const [activeRect, setActiveRect] = React.useState<DOMRect | null>(null);
  const [listRect, setListRect] = React.useState<DOMRect | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateRects = () => {
      const activeTab = list.querySelector('[data-state="active"]');
      if (activeTab) {
        setActiveRect(activeTab.getBoundingClientRect());
        setListRect(list.getBoundingClientRect());
      }
    };

    updateRects();
    const observer = new MutationObserver(updateRects);
    observer.observe(list, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 bg-muted overflow-hidden rounded-full p-1 relative",
        className
      )}
      {...props}
    >
      <div ref={listRef} className="relative flex gap-1">
        {activeRect && listRect && (
          <div
            className="absolute z-0 bg-primary/10 rounded-full transition-all duration-200"
            style={{
              left: `${activeRect.left - listRect.left}px`,
              top: '0',
              width: `${activeRect.width}px`,
              height: '100%',
            }}
          />
        )}
        {children}
      </div>
    </TabsPrimitive.List>
  );
});
CodePreviewTabList.displayName = TabsPrimitive.List.displayName;

const CodePreviewTabTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative px-2.5 py-0.5 text-sm rounded-full transition-colors duration-200",
      "text-muted-foreground data-[state=active]:text-primary",
      "outline-none focus:outline-none",
      className
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
));
CodePreviewTabTrigger.displayName = TabsPrimitive.Trigger.displayName;

const CodePreviewTabContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 outline-none",
      className
    )}
    {...props}
  />
));
CodePreviewTabContent.displayName = TabsPrimitive.Content.displayName;

export {
  CodePreviewTab,
  CodePreviewTabList,
  CodePreviewTabTrigger,
  CodePreviewTabContent,
};