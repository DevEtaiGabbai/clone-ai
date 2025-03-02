'use client';

import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

export type SaveStatus = 'saved' | 'saving' | 'not-saved';

interface FileStatusPillProps {
  status?: SaveStatus;
  lastSavedTime?: string;
  className?: string;
}

export function FileStatusPill({ 
  status: externalStatus, 
  lastSavedTime: externalLastSavedTime,
  className
}: FileStatusPillProps) {
  const [internalStatus, setInternalStatus] = useState<SaveStatus>('saved');
  const [internalLastSavedTime, setInternalLastSavedTime] = useState<string>('');
  
  // Use either external or internal state
  const status = externalStatus || internalStatus;
  const lastSavedTime = externalLastSavedTime || internalLastSavedTime;

  const updateLastSavedTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setInternalLastSavedTime(timeString);
  };

  useEffect(() => {
    if (!externalLastSavedTime) {
      updateLastSavedTime();
    }
  }, [externalLastSavedTime]);

  const getStatusDetails = () => {
    switch (status) {
      case 'saved':
        return {
          text: `Saved at ${lastSavedTime}`,
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          bgColor: 'bg-emerald-500/10',
          textColor: 'text-emerald-500',
          borderColor: 'border-emerald-500/20',
          iconColor: 'text-emerald-500',
        };
      case 'saving':
        return {
          text: 'Saving...',
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-500',
          borderColor: 'border-amber-500/20',
          iconColor: 'text-amber-500',
        };
      case 'not-saved':
        return {
          text: 'Not saved',
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-500',
          borderColor: 'border-red-500/20',
          iconColor: 'text-red-500',
        };
    };
  };

  const statusDetails = getStatusDetails();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border shadow-sm transition-all duration-200",
            statusDetails.bgColor,
            statusDetails.borderColor,
            className
          )}>
            <span className={statusDetails.iconColor}>
              {statusDetails.icon}
            </span>
            <span className={cn(
              "text-xs font-medium",
              statusDetails.textColor
            )}>
              {statusDetails.text}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Press {navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'} + S to save</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 