import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, params.id));

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, project.id));

    return NextResponse.json({ project, files });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
} 