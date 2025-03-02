import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { Client } from "@upstash/workflow";
import { eq } from "drizzle-orm";

// Interface for image data
interface ImageData {
  url: string;
}

/**
 * Handles project creation and workflow triggering
 * POST /api/generate
 */
export async function POST(req: Request) {
  let project = null;
  const startTime = Date.now();
  
  try {
    console.log("Generate API: Starting new project generation");
    
    // Parse request body
    const { images, html, userPrompt, siteUrl, userId } = await req.json();
    
    // Validate required fields
    if (!images || !images.length) {
      console.error("Generate API: Missing screenshots");
      return NextResponse.json({ error: "Screenshots are required" }, { status: 400 });
    }

    if (!html) {
      console.error("Generate API: Missing HTML content");
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }
    
    if (!siteUrl) {
      console.error("Generate API: Missing site URL");
      return NextResponse.json({ error: "Site URL is required" }, { status: 400 });
    }

    console.log(`Generate API: Creating project for ${siteUrl} with ${images.length} screenshots`);
    
    // Create project in database with userId if available
    const [createdProject] = await db
      .insert(projects)
      .values({
        name: `Clone of ${siteUrl} on ${new Date().toISOString().split('T')[0]}`,
        description: userPrompt || `Next.js clone of ${siteUrl} created on ${new Date().toISOString().split('T')[0]} using CloneAI.dev`,
        status: "pending",
        progress: 0,
        userId: userId || null // Include userId if available
      })
      .returning();
    
    project = createdProject;
    console.log(`Generate API: Created project with ID ${project.id}${userId ? ` for user ${userId}` : ''}`);

    // Initialize Upstash Workflow client
    if (!process.env.QSTASH_TOKEN) {
      throw new Error("QSTASH_TOKEN is not set. Please check your environment variables.");
    }
    
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    const workflowUrl = process.env.UPSTASH_WORKFLOW_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    if (!workflowUrl) {
      throw new Error("UPSTASH_WORKFLOW_URL or NEXT_PUBLIC_APP_URL is not set. Please check your environment variables.");
    }

    try {
      console.log(`Generate API: Triggering workflow for project ${project.id}`);
      
      // Prepare request payload - avoid sending full HTML in logs
      const requestPayload = {
        images,
        html,
        userPrompt,
        siteUrl,
        projectId: project.id,
        userId // Include userId in the workflow payload
      };
      
      console.log(`Generate API: Workflow payload prepared with ${images.length} images and ${html.length} HTML characters`);
      
      // Trigger the workflow
      const { workflowRunId } = await client.trigger({
        url: `${workflowUrl}/api/workflow`,
        body: JSON.stringify(requestPayload),
        headers: { "Content-Type": "application/json" },
        retries: 3
      });

      console.log(`Generate API: Workflow triggered successfully with run ID ${workflowRunId}`);

      // Update the project with the workflow run ID
      await db
        .update(projects)
        .set({ workflowRunId })
        .where(eq(projects.id, project.id));

      const duration = Date.now() - startTime;
      console.log(`Generate API: Request completed in ${duration}ms`);
      
      return NextResponse.json({ 
        projectId: project.id, 
        workflowRunId,
        message: "Project generation started successfully"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Generate API: Workflow trigger error for project ${project.id}:`, errorMessage);
      
      // Update the project status to failed
      if (project) {
        await db
          .update(projects)
          .set({ 
            status: "failed",
            progress: 0
          })
          .where(eq(projects.id, project.id));
        
        console.log(`Generate API: Updated project ${project.id} status to failed`);
      }
      
      throw error; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate API: Error:", errorMessage);
    
    // If we have a project but failed to trigger the workflow, return the project ID
    if (project) {
      return NextResponse.json(
        { 
          error: errorMessage, 
          projectId: project.id,
          message: "Failed to trigger workflow, but project was created"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: "Failed to generate project"
      },
      { status: 500 }
    );
  }
}
