import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // Using "pg" instead of "postgresql" for PostgreSQL
  }),
  // Map Better Auth's default 'user' table to our existing 'users' table
  user: {
    modelName: "users", // Use our existing 'users' table name
  },
  // Configure email/password authentication
  emailAndPassword: {
    enabled: true,
  },
  // Configure social providers (can be added later)
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  // Add hooks for any additional user setup if needed
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log("User created:", user.id);
          // Any additional setup for new users can be done here
        },
      },
    },
  },
});

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    // Try to get the current user's session
    const headersInstance = headers();
    const session = await auth.api.getSession({
      headers: headersInstance
    });
    return session?.user || null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get user by ID from the database
 */
export async function getUserById(userId: string) {
  if (!userId) {
    return null;
  }
  
  try {
    // Use the users table in our database
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId)
    });
    return userResult;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
} 