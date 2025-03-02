import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import GithubProvider from "next-auth/providers/github";
// Define a type for our user
interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export const authOptions: NextAuthOptions = {
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      // Follow the "Login with Google" tutorial to get your credentials
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    signIn: async ({ user }) => {
      if (!user.email) return false;
      
      // Check if user exists in our database
      const existingUser = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
      
      // If user doesn't exist, create them
      if (existingUser.length === 0) {
        await db.insert(users).values({
          id: uuidv4(), // Generate a UUID for the user
          name: user.name,
          email: user.email,
          image: user.image,
        });
      }
      
      return true;
    },
    session: async ({ session, token }) => {
      if (session?.user && session.user.email) {
        // Get user from database by email
        const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
        if (dbUser.length > 0) {
          // @ts-ignore - adding id to session user
          session.user.id = dbUser[0].id;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: "#444444",
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://cloneai.dev/Logo.png`,
  },
};

export default NextAuth(authOptions);