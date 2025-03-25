import { db } from "@/lib/db";
import { projects, projectFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

/**
 * Get all projects for the current authenticated user
 */
export async function getUserProjects() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return [];
  }

  const userProjects = await db.select().from(projects).where(eq(projects.userId, currentUser.id));
  return userProjects;
}

/**
 * Get a project by ID for the current authenticated user
 */
export async function getProjectById(projectId: string) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return null;
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      files: true,
    },
  });

  // Verify the project belongs to the current user
  if (project && project.userId !== currentUser.id) {
    return null;
  }

  return project;
}

/**
 * Create a new project for the current authenticated user
 */
export async function createProject(data: {
  name: string;
  description?: string;
  status?: string;
}) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const newProject = await db.insert(projects).values({
    name: data.name,
    description: data.description || "",
    status: data.status || "pending",
    userId: currentUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return newProject[0];
}

/**
 * Update a project by ID for the current authenticated user
 */
export async function updateProject(projectId: string, data: Partial<typeof projects.$inferInsert>) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Verify the project belongs to the current user
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project || project.userId !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  const updatedProject = await db.update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  return updatedProject[0];
}

/**
 * Delete a project by ID for the current authenticated user
 */
export async function deleteProject(projectId: string) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Verify the project belongs to the current user
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project || project.userId !== currentUser.id) {
    throw new Error("Unauthorized");
  }

  // Delete all project files first (to maintain referential integrity)
  await db.delete(projectFiles).where(eq(projectFiles.projectId, projectId));

  // Delete the project
  await db.delete(projects).where(eq(projects.id, projectId));

  return true;
} 