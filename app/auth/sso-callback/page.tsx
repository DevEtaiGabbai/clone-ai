"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SSOCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // For Better Auth, we don't need a special handler
    // The redirect handling is done by the server
    
    // If there's an error, show it in the UI
    const error = searchParams.get("error");
    if (error) {
      console.error("Authentication error:", error);
      // You could add error handling UI here
    }
    
    // Get the callback URL or redirect to dashboard
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    
    // Add a small delay for better UX
    const timeout = setTimeout(() => {
      router.push(callbackUrl);
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [router, searchParams]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8 rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-70"></div>
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl">Authenticating</h1>
          <p className="text-muted-foreground">Please wait while we redirect you...</p>
        </div>
      </div>
    </div>
  );
}