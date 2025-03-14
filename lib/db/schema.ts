import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Simple users table for NextAuth
export const users = pgTable('users', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('pending').notNull(),
  progress: integer('progress').default(0).notNull(),
  workflowRunId: text('workflow_run_id'),
  userId: text('user_id').references(() => users.id),
  // Netlify deployment fields
  netlifySiteId: text('netlify_site_id'),
  netlifySiteName: text('netlify_site_name'),
  netlifySiteUrl: text('netlify_site_url'),
  netlifySiteDeployId: text('netlify_site_deploy_id'),
  netlifySiteDeployedAt: timestamp('netlify_site_deployed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectFiles = pgTable('project_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  path: text('path').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  files: many(projectFiles),
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
})); 