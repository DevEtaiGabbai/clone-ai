import { useState, useEffect } from "react";
import { Loader, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface ProgressIndicatorProps {
  projectId: string;
  onComplete?: (projectId: string) => void;
  minimal?: boolean;
}

export function ProgressIndicator({ projectId, onComplete, minimal = false }: ProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/status`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to get project status");
        }

        setProgress(data.progress);
        setStatus(data.status);

        if (data.status === "completed" && onComplete) {
          onComplete(projectId);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Something went wrong");
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [projectId, onComplete]);

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Preparing to generate...";
      case "processing":
        if (progress < 20) return "Analyzing website";
        return "Processing website data";
      case "generating":
        if (progress < 40) return "Generating code structure";
        if (progress < 60) return "Writing first version of clone";
        return "Building application";
      case "revising":
        return "Refining UI to match design";
      case "finalizing":
        return "Finalizing project";
      case "completed":
        return "Generation complete!";
      case "failed":
        return "Generation failed";
      default:
        return "Processing...";
    }
  };

  if (error) {
    return minimal ? (
      <div className="flex items-center space-x-2 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Generation failed</span>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="text-destructive">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (minimal) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Loader className="h-4 w-4 animate-spin text-primary" />
            )}
            <TextShimmer className="text-sm font-medium">{getStatusText()}</TextShimmer>
          </div>
          <div className="text-sm font-medium tabular-nums text-muted-foreground">
          {progress}%
        </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg p-4 max-w-xs">
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5">
            {status !== "completed" ? (
              <Loader className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            )}
            <TextShimmer className="text-sm font-medium">{getStatusText()}</TextShimmer>
          </div>
          
          <div className="space-y-1.5">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">{progress}% complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 