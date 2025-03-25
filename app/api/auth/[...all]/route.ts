import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export GET and POST methods to handle auth requests
export const { GET, POST } = toNextJsHandler(auth); 