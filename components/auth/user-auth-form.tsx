"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { signIn } from "@/lib/auth-client"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "signin" | "signup"
}

export function UserAuthForm({ mode = "signin", className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isGitHubLoading, setIsGitHubLoading] = React.useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      // Using the standard parameters supported by Better Auth
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard" // Correct camelCase for the parameter
      });
      // Redirect handled by Better Auth
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong with Google authentication");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    try {
      setIsGitHubLoading(true);
      // Using the standard parameters supported by Better Auth
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard" // Correct camelCase for the parameter
      });
      // Redirect handled by Better Auth
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong with GitHub authentication");
    } finally {
      setIsGitHubLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6 w-full", className)} {...props}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={signInWithGitHub}
        disabled={isLoading || isGitHubLoading}
      >
        {isGitHubLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}{" "}
        Github
      </Button>
      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-1 h-4 w-4" />
        )}{" "}
        Google
      </Button>
    </div>
  )
}