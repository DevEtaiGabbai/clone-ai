import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth, getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get userId from query params or from auth
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId") || session.user.id;
    
    // Verify the user is requesting their own projects
    if (requestedUserId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch projects for the user
    const userProjects = await db.select().from(projects).where(eq(projects.userId, requestedUserId));
    
    return NextResponse.json(userProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    // Get current user
    const currentUser = session.user;
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Create new project
    const newProject = await db.insert(projects).values({
      name: body.name,
      description: body.description || "",
      status: body.status || "pending",
      progress: body.progress || 0,
      workflowRunId: body.workflowRunId,
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 