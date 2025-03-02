import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get project status from database
    const project = await db
      .select({
        id: projects.id,
        status: projects.status,
        progress: projects.progress,
        workflowRunId: projects.workflowRunId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((res) => res[0]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Get project status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get project status" },
      { status: 500 }
    );
  }
} 