import { NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/sso-callback"
];

// Define routes that are always accessible for API authentication
const authRoutes = [
  "/api/auth"
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check if the path is in the public routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
  
  // Check if the path is an auth API route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Allow public routes and auth routes
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next();
  }

  // Check for auth cookie - Better Auth stores session in a cookie
  const authCookie = req.cookies.get("better_auth_session");
  
  // If there's no cookie and this isn't a public route, redirect to login
  if (!authCookie) {
    const loginUrl = new URL("/auth/login", req.url);
    // Add the current URL as the callbackUrl
    loginUrl.searchParams.set("callbackUrl", encodeURI(req.url));
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};