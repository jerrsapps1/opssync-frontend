import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectNumber: text("project_number").notNull().unique(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  gpsLatitude: text("gps_latitude"),
  gpsLongitude: text("gps_longitude"),
  kmzFileUrl: text("kmz_file_url"),
  description: text("description"),
  status: text("status").notNull().default("Planned"), // Planned, Active, Paused, Completed
  progress: integer("progress").notNull().default(0), // 0-100
  percentComplete: integer("percent_complete").default(0), // 0-100 for manual mode
  percentMode: text("percent_mode").default("auto"), // auto, manual
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  // Analytics fields
  projectType: text("project_type"), // Residential Construction, Commercial, etc.
  estimatedBudget: integer("estimated_budget"), // Budget in cents
  actualCost: integer("actual_cost"), // Actual cost in cents
  contractValue: integer("contract_value"), // Contract value in cents
  profitMargin: integer("profit_margin"), // Profit margin percentage
  riskLevel: text("risk_level").default("medium"), // low, medium, high, critical
  priority: text("priority").default("medium"), // low, medium, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  phone: text("phone"),
  emergencyContactPhone: text("emergency_contact_phone"),
  company: text("company"),
  avatarUrl: text("avatar_url"),
  employmentStatus: text("employment_status").notNull().default("active"), // active, terminated, standby
  status: text("status").notNull().default("available"), // available, busy, offline
  currentProjectId: varchar("current_project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  make: text("make"),
  model: text("model"),
  assetNumber: text("asset_number").unique(),
  serialNumber: text("serial_number").unique(),
  status: text("status").notNull().default("available"), // available, in-use, maintenance, broken
  currentProjectId: varchar("current_project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // assignment, unassignment, maintenance, etc
  description: text("description").notNull(),
  entityType: text("entity_type").notNull(), // employee, equipment, project
  entityId: varchar("entity_id").notNull(),
  projectId: varchar("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project activity logs for settings/projects tracking
export const projectActivityLogs = pgTable("project_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  time: text("time").notNull(), // HH:MM format
  action: text("action").notNull(), // assigned, removed, moved
  entityType: text("entity_type").notNull(), // employee, equipment
  entityName: text("entity_name").notNull(),
  entityId: varchar("entity_id").notNull(),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  projectName: text("project_name").notNull(),
  fromProjectId: varchar("from_project_id").references(() => projects.id),
  fromProjectName: text("from_project_name"),
  performedBy: text("performed_by").notNull().default("System"),
  performedByEmail: text("performed_by_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // warning, error, info, success
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  isRead: boolean("is_read").notNull().default(false),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const brandConfigs = pgTable("brand_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  brandConfig: text("brand_config"), // JSON string for brand configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectContacts = pgTable("project_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: text("position").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  company: text("company").notNull(),
  isPrimary: boolean("is_primary").default(false), // Mark primary contact
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas with proper date handling
export const insertProjectSchema = createInsertSchema(projects)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
    endDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  });

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertProjectContactSchema = createInsertSchema(projectContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertBrandConfigSchema = createInsertSchema(brandConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBrandConfigSchema = z.object({
  companyName: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
});

// Update schemas for assignments and projects
export const updateEmployeeAssignmentSchema = z.object({
  projectId: z.string().nullable(),
});

export const updateProjectSchema = z.object({
  projectNumber: z.string().optional(),
  name: z.string().optional(),
  location: z.string().optional(),
  gpsLatitude: z.string().nullable().optional(),
  gpsLongitude: z.string().nullable().optional(),
  kmzFileUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  percentComplete: z.number().min(0).max(100).optional(),
  percentMode: z.enum(["auto", "manual"]).optional(),
  startDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  endDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  // Analytics fields
  projectType: z.string().nullable().optional(),
  estimatedBudget: z.number().nullable().optional(),
  actualCost: z.number().nullable().optional(),
  contractValue: z.number().nullable().optional(),
  profitMargin: z.number().nullable().optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const updateEquipmentAssignmentSchema = z.object({
  projectId: z.string().nullable(),
});

// Update schemas for employee details
export const updateEmployeeSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  employmentStatus: z.string().optional(),
  status: z.string().optional(),
});

// Update schemas for equipment details
export const updateEquipmentSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  assetNumber: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  status: z.string().optional(),
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BrandConfig = typeof brandConfigs.$inferSelect;
export type InsertBrandConfig = z.infer<typeof insertBrandConfigSchema>;
export type UpdateBrandConfig = z.infer<typeof updateBrandConfigSchema>;

export type ProjectContact = typeof projectContacts.$inferSelect;
export type InsertProjectContact = z.infer<typeof insertProjectContactSchema>;

export type UpdateEmployeeAssignment = z.infer<typeof updateEmployeeAssignmentSchema>;
export type UpdateEquipmentAssignment = z.infer<typeof updateEquipmentAssignmentSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>;

// Project Activity Log schema
export const insertProjectActivityLogSchema = z.object({
  date: z.string(),
  time: z.string(),
  action: z.enum(["assigned", "removed", "moved"]),
  entityType: z.enum(["employee", "equipment"]),
  entityName: z.string(),
  entityId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  fromProjectId: z.string().optional(),
  fromProjectName: z.string().optional(),
  performedBy: z.string().default("System"),
  performedByEmail: z.string().optional(),
});

export type ProjectActivityLog = typeof projectActivityLogs.$inferSelect;
export type InsertProjectActivityLog = z.infer<typeof insertProjectActivityLogSchema>;
