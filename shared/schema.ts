import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
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
  startBlocked: boolean("start_blocked").default(true), // Project blocked until checklist complete
  supervisorEmail: text("supervisor_email"),
  supervisorPhone: text("supervisor_phone"),
  // Company/Client Information
  clientName: text("client_name"), // Name of the client/customer
  clientContact: text("client_contact"), // Primary client contact person
  clientEmail: text("client_email"), // Client email
  clientPhone: text("client_phone"), // Client phone number
  generalContractor: text("general_contractor"), // General contractor company name
  contractorContact: text("contractor_contact"), // GC contact person
  contractorEmail: text("contractor_email"), // GC email
  contractorPhone: text("contractor_phone"), // GC phone number
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

// Supervisor Portal Tables
export const timelinessItems = pgTable("timeliness_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'UPDATE' or 'CHANGE_REQUEST'
  title: text("title").notNull(),
  description: text("description").default(""),
  dueAt: timestamp("due_at").notNull(),
  submittedAt: timestamp("submitted_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  payload: json("payload").notNull().default({}),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TimelinessItem = typeof timelinessItems.$inferSelect;
export type InsertTimelinessItem = typeof timelinessItems.$inferInsert;
export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = typeof checklists.$inferInsert;

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

// Work Orders table
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reason: text("reason").notNull(), // Why equipment needs repair
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("open"), // open, in-progress, completed, cancelled, pending-approval, approved, rejected
  assignedTo: text("assigned_to"), // Who is working on the repair
  comments: text("comments"), // User comments for the work order
  estimatedCost: integer("estimated_cost"), // Estimated repair cost in cents
  actualCost: integer("actual_cost"), // Actual repair cost in cents
  laborCost: integer("labor_cost"), // Labor cost in cents
  partsCost: integer("parts_cost"), // Parts cost in cents
  externalServiceCost: integer("external_service_cost"), // External service cost in cents
  jobNumber: text("job_number"), // Billing job number
  poNumber: text("po_number"), // Purchase order number
  vendorInvoiceNumber: text("vendor_invoice_number"), // Vendor invoice number
  approvalRequired: boolean("approval_required").default(false),
  approvalStatus: text("approval_status").default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  dateCreated: timestamp("date_created").defaultNow(),
  dateStarted: timestamp("date_started"),
  dateCompleted: timestamp("date_completed"),
  notes: text("notes"), // Additional repair notes
  partsUsed: text("parts_used"), // Parts/materials used
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  costCenter: text("cost_center"), // Cost center for accounting
  warrantyInfo: text("warranty_info"), // Warranty information
  completionNotes: text("completion_notes"), // Notes added upon completion
  technicianNotes: text("technician_notes"), // Private technician notes
  taxExempt: boolean("tax_exempt").default(false), // Tax exempt status
});

// Work Order Comments table for progressive commenting
export const workOrderComments = pgTable("work_order_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Work Order Documents table for PDF attachments
export const workOrderDocuments = pgTable("work_order_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  documentType: text("document_type").notNull(), // receipt, invoice, photo, warranty, estimate, report
  description: text("description"),
  objectPath: text("object_path").notNull(), // Path in object storage
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Work Order Approvals table for approval workflow
export const workOrderApprovals = pgTable("work_order_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  approverRole: text("approver_role").notNull(), // equipment-manager, maintenance-manager, financial-approver
  approverUserId: varchar("approver_user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  thresholdAmount: integer("threshold_amount"), // Cost threshold that triggered this approval
  requiredBy: timestamp("required_by"), // When approval is needed by
});

// Work Order Activity Log table
export const workOrderActivities = pgTable("work_order_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created, updated, started, completed, approved, rejected, document-added, etc.
  description: text("description").notNull(),
  performedBy: varchar("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow(),
  metadata: text("metadata"), // JSON metadata for additional context
});

// Cost Approval Thresholds table
export const costApprovalThresholds = pgTable("cost_approval_thresholds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // equipment-manager, maintenance-manager, financial-approver
  maxAmount: integer("max_amount").notNull(), // Maximum amount in cents this role can approve
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings table for configurable thresholds and notification preferences
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // work_order_approval_threshold, notification_emails, etc.
  value: text("value").notNull(), // JSON stringified value
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table for in-app notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // work-order-approval, work-order-created, work-order-completed, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: text("related_id"), // ID of the related entity (work order, project, etc.)
  relatedType: text("related_type"), // work_order, project, equipment, etc.
  isRead: boolean("is_read").default(false),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification Recipients table for email notifications
export const notificationRecipients = pgTable("notification_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role"), // approver, manager, supervisor, etc.
  isActive: boolean("is_active").default(true),
  notificationTypes: text("notification_types"), // JSON array of notification types they want to receive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work Order schema
export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  dateCreated: true,
  updatedAt: true,
  approvedAt: true,
});

export const updateWorkOrderSchema = insertWorkOrderSchema.partial();

// Work Order Comments schema
export const insertWorkOrderCommentSchema = createInsertSchema(workOrderComments).omit({
  id: true,
  createdAt: true,
});

export const updateWorkOrderCommentSchema = insertWorkOrderCommentSchema.partial();

// Work Order Documents schema
export const insertWorkOrderDocumentSchema = createInsertSchema(workOrderDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const updateWorkOrderDocumentSchema = insertWorkOrderDocumentSchema.partial();

// Work Order Approvals schema
export const insertWorkOrderApprovalSchema = createInsertSchema(workOrderApprovals).omit({
  id: true,
  approvedAt: true,
});

export const updateWorkOrderApprovalSchema = insertWorkOrderApprovalSchema.partial();

// Work Order Activities schema
export const insertWorkOrderActivitySchema = createInsertSchema(workOrderActivities).omit({
  id: true,
  performedAt: true,
});

export const updateWorkOrderActivitySchema = insertWorkOrderActivitySchema.partial();

// Cost Approval Thresholds schema
export const insertCostApprovalThresholdSchema = createInsertSchema(costApprovalThresholds).omit({
  id: true,
  createdAt: true,
});

export const updateCostApprovalThresholdSchema = insertCostApprovalThresholdSchema.partial();

// System Settings schemas
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const updateSystemSettingSchema = insertSystemSettingSchema.partial();

// Notifications schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const updateNotificationSchema = insertNotificationSchema.partial();

// Notification Recipients schemas
export const insertNotificationRecipientSchema = createInsertSchema(notificationRecipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationRecipientSchema = insertNotificationRecipientSchema.partial();

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

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type UpdateWorkOrder = z.infer<typeof updateWorkOrderSchema>;

export type WorkOrderComment = typeof workOrderComments.$inferSelect;
export type InsertWorkOrderComment = z.infer<typeof insertWorkOrderCommentSchema>;
export type UpdateWorkOrderComment = z.infer<typeof updateWorkOrderCommentSchema>;

export type WorkOrderDocument = typeof workOrderDocuments.$inferSelect;
export type InsertWorkOrderDocument = z.infer<typeof insertWorkOrderDocumentSchema>;
export type UpdateWorkOrderDocument = z.infer<typeof updateWorkOrderDocumentSchema>;

export type WorkOrderApproval = typeof workOrderApprovals.$inferSelect;
export type InsertWorkOrderApproval = z.infer<typeof insertWorkOrderApprovalSchema>;
export type UpdateWorkOrderApproval = z.infer<typeof updateWorkOrderApprovalSchema>;

export type WorkOrderActivity = typeof workOrderActivities.$inferSelect;
export type InsertWorkOrderActivity = z.infer<typeof insertWorkOrderActivitySchema>;
export type UpdateWorkOrderActivity = z.infer<typeof updateWorkOrderActivitySchema>;

export type CostApprovalThreshold = typeof costApprovalThresholds.$inferSelect;
export type InsertCostApprovalThreshold = z.infer<typeof insertCostApprovalThresholdSchema>;
export type UpdateCostApprovalThreshold = z.infer<typeof updateCostApprovalThresholdSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type UpdateSystemSetting = z.infer<typeof updateSystemSettingSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;

export type NotificationRecipient = typeof notificationRecipients.$inferSelect;
export type InsertNotificationRecipient = z.infer<typeof insertNotificationRecipientSchema>;
export type UpdateNotificationRecipient = z.infer<typeof updateNotificationRecipientSchema>;
