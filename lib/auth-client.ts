import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Using the same domain, so no need to specify baseURL
});

// Export convenience methods
export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession, 
  getSession 
} = authClient; 