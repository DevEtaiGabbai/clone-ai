'use client';

import { cn } from "@/lib/utils";
import { Loader2, LucideProps } from "lucide-react";

interface SpinnerProps extends LucideProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin text-current", 
        sizeClasses[size],
        className
      )} 
      {...props} 
    />
  );
} 