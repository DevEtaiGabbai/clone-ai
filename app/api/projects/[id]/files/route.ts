import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { path, content } = await request.json();

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "Path and content are required" },
        { status: 400 }
      );
    }

    // Find the file by project ID and path
    const [existingFile] = await db
      .select()
      .from(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, params.id),
          eq(projectFiles.path, path)
        )
      );

    if (!existingFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Update the file content
    await db
      .update(projectFiles)
      .set({ content })
      .where(
        and(
          eq(projectFiles.projectId, params.id),
          eq(projectFiles.path, path)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { path, content } = await request.json();

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "Path and content are required" },
        { status: 400 }
      );
    }

    // Check if file already exists
    const [existingFile] = await db
      .select()
      .from(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, params.id),
          eq(projectFiles.path, path)
        )
      );

    if (existingFile) {
      return NextResponse.json(
        { error: "File already exists" },
        { status: 409 }
      );
    }

    // Create new file
    await db.insert(projectFiles).values({
      projectId: params.id,
      path,
      content,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    // Delete the file
    await db
      .delete(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, params.id),
          eq(projectFiles.path, path)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
} 