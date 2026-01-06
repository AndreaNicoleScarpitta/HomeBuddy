import { pgTable, varchar, integer, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (IMPORTANT for Replit Auth)
export * from "./models/auth";
export * from "./models/chat";
import { users } from "./models/auth";

// Homes table - stores user's home profile
export const homes = pgTable("homes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  streetAddress: varchar("street_address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  zipPlus4: varchar("zip_plus_4", { length: 4 }),
  addressVerified: boolean("address_verified").default(false),
  builtYear: integer("built_year"),
  sqFt: integer("sq_ft"),
  beds: integer("beds"),
  baths: integer("baths"),
  type: varchar("type", { length: 100 }),
  zillowUrl: text("zillow_url"),
  healthScore: integer("health_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("homes_user_id_idx").on(table.userId),
]);

export const insertHomeSchema = createInsertSchema(homes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHome = z.infer<typeof insertHomeSchema>;
export type Home = typeof homes.$inferSelect;

// System categories enum
export const systemCategories = [
  "Roof",
  "HVAC", 
  "Plumbing",
  "Electrical",
  "Windows",
  "Siding/Exterior",
  "Foundation",
  "Appliances",
  "Water Heater",
  "Landscaping",
  "Pest",
  "Other"
] as const;
export type SystemCategory = typeof systemCategories[number];

// System conditions enum
export const systemConditions = ["Great", "Good", "Fair", "Poor", "Unknown"] as const;
export type SystemCondition = typeof systemConditions[number];

// Systems table - stores home systems (HVAC, Roof, etc.)
export const systems = pgTable("systems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).default("Other"),
  name: varchar("name", { length: 100 }).notNull(),
  installYear: integer("install_year"),
  lastServiceDate: timestamp("last_service_date"),
  condition: varchar("condition", { length: 50 }).default("Unknown"),
  notes: text("notes"),
  photos: text("photos"), // JSON array of { uri, caption, createdAt }
  documents: text("documents"), // JSON array of { uri, type, createdAt }
  source: varchar("source", { length: 50 }).default("manual"), // manual, chat, import, inspection
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("systems_home_id_idx").on(table.homeId),
  index("systems_category_idx").on(table.category),
]);

export const insertSystemSchema = createInsertSchema(systems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSystem = z.infer<typeof insertSystemSchema>;
export type System = typeof systems.$inferSelect;

// Task statuses
export const taskStatuses = ["pending", "scheduled", "completed", "skipped"] as const;
export type TaskStatus = typeof taskStatuses[number];

// Maintenance tasks table
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  relatedSystemId: integer("related_system_id").references(() => systems.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  dueDate: timestamp("due_date"),
  urgency: varchar("urgency", { length: 50 }).default("later"), // now, soon, later, monitor
  diyLevel: varchar("diy_level", { length: 50 }).default("DIY-Safe"), // DIY-Safe, Caution, Pro-Only
  status: varchar("status", { length: 50 }).default("pending"), // pending, scheduled, completed, skipped
  estimatedCost: varchar("estimated_cost", { length: 100 }),
  actualCost: integer("actual_cost"), // in cents
  difficulty: varchar("difficulty", { length: 50 }),
  safetyWarning: text("safety_warning"),
  createdFrom: varchar("created_from", { length: 50 }).default("manual"), // manual, chat, inspection, import
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("maintenance_tasks_home_id_idx").on(table.homeId),
  index("maintenance_tasks_urgency_idx").on(table.urgency),
  index("maintenance_tasks_system_id_idx").on(table.relatedSystemId),
]);

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

// Maintenance log entries - tracks completed maintenance work
export const maintenanceLogEntries = pgTable("maintenance_log_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => maintenanceTasks.id, { onDelete: "set null" }),
  systemId: integer("system_id").references(() => systems.id, { onDelete: "set null" }),
  date: timestamp("date").notNull().defaultNow(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  photos: text("photos"), // JSON array of photo URIs
  cost: integer("cost"), // in cents
  provider: varchar("provider", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("maintenance_log_home_id_idx").on(table.homeId),
  index("maintenance_log_task_id_idx").on(table.taskId),
  index("maintenance_log_date_idx").on(table.date),
]);

export const insertMaintenanceLogEntrySchema = createInsertSchema(maintenanceLogEntries).omit({ id: true, createdAt: true });
export type InsertMaintenanceLogEntry = z.infer<typeof insertMaintenanceLogEntrySchema>;
export type MaintenanceLogEntry = typeof maintenanceLogEntries.$inferSelect;

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("chat_messages_home_id_idx").on(table.homeId),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Funds table - stores user's budget funds/buckets
export const funds = pgTable("funds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  balance: integer("balance").notNull().default(0), // in cents
  monthlyContribution: integer("monthly_contribution").default(0), // in cents
  fundType: varchar("fund_type", { length: 50 }).default("general"), // general, emergency, dedicated
  label: text("label"), // optional mental label like "Do not touch unless critical"
  color: varchar("color", { length: 20 }).default("#f97316"), // for visual distinction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("funds_home_id_idx").on(table.homeId),
]);

export const insertFundSchema = createInsertSchema(funds).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFund = z.infer<typeof insertFundSchema>;
export type Fund = typeof funds.$inferSelect;

// Fund allocations table - tracks money earmarked for specific tasks
export const fundAllocations = pgTable("fund_allocations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fundId: integer("fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  taskId: integer("task_id").notNull().references(() => maintenanceTasks.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull().default(0), // in cents
  status: varchar("status", { length: 50 }).default("planned"), // planned, committed, paid
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("fund_allocations_fund_id_idx").on(table.fundId),
  index("fund_allocations_task_id_idx").on(table.taskId),
]);

export const insertFundAllocationSchema = createInsertSchema(fundAllocations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundAllocation = z.infer<typeof insertFundAllocationSchema>;
export type FundAllocation = typeof fundAllocations.$inferSelect;

// Expenses table - tracks actual spending
export const expenses = pgTable("expenses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fundId: integer("fund_id").notNull().references(() => funds.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => maintenanceTasks.id, { onDelete: "set null" }),
  amount: integer("amount").notNull().default(0), // in cents
  description: text("description"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("paid"), // estimated, partial, paid
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("expenses_fund_id_idx").on(table.fundId),
  index("expenses_task_id_idx").on(table.taskId),
]);

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Contact messages table - stores contact form submissions
export const contactMessages = pgTable("contact_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("new"), // new, read, replied
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true, status: true });
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Inspection reports table - stores uploaded inspection reports
export const inspectionReports = pgTable("inspection_reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }),
  objectPath: text("object_path").notNull(),
  reportType: varchar("report_type", { length: 100 }).default("general"),
  inspectionDate: timestamp("inspection_date"),
  status: varchar("status", { length: 50 }).default("pending"),
  summary: text("summary"),
  issuesFound: integer("issues_found").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  analyzedAt: timestamp("analyzed_at"),
}, (table) => [
  index("inspection_reports_home_id_idx").on(table.homeId),
]);

export const insertInspectionReportSchema = createInsertSchema(inspectionReports).omit({ id: true, createdAt: true, analyzedAt: true });
export type InsertInspectionReport = z.infer<typeof insertInspectionReportSchema>;
export type InspectionReport = typeof inspectionReports.$inferSelect;

// Inspection findings table - stores individual findings from reports
export const inspectionFindings = pgTable("inspection_findings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportId: integer("report_id").notNull().references(() => inspectionReports.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 50 }).default("minor"),
  location: varchar("location", { length: 255 }),
  estimatedCost: varchar("estimated_cost", { length: 100 }),
  urgency: varchar("urgency", { length: 50 }).default("later"),
  diyLevel: varchar("diy_level", { length: 50 }).default("Pro-Only"),
  taskCreated: boolean("task_created").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("inspection_findings_report_id_idx").on(table.reportId),
]);

export const insertInspectionFindingSchema = createInsertSchema(inspectionFindings).omit({ id: true, createdAt: true });
export type InsertInspectionFinding = z.infer<typeof insertInspectionFindingSchema>;
export type InspectionFinding = typeof inspectionFindings.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  homes: many(homes),
}));

export const homesRelations = relations(homes, ({ one, many }) => ({
  user: one(users, {
    fields: [homes.userId],
    references: [users.id],
  }),
  systems: many(systems),
  maintenanceTasks: many(maintenanceTasks),
  maintenanceLogEntries: many(maintenanceLogEntries),
  chatMessages: many(chatMessages),
  funds: many(funds),
  inspectionReports: many(inspectionReports),
}));

export const systemsRelations = relations(systems, ({ one, many }) => ({
  home: one(homes, {
    fields: [systems.homeId],
    references: [homes.id],
  }),
  tasks: many(maintenanceTasks),
  logEntries: many(maintenanceLogEntries),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one, many }) => ({
  home: one(homes, {
    fields: [maintenanceTasks.homeId],
    references: [homes.id],
  }),
  relatedSystem: one(systems, {
    fields: [maintenanceTasks.relatedSystemId],
    references: [systems.id],
  }),
  logEntries: many(maintenanceLogEntries),
  allocations: many(fundAllocations),
  expenses: many(expenses),
}));

export const maintenanceLogEntriesRelations = relations(maintenanceLogEntries, ({ one }) => ({
  home: one(homes, {
    fields: [maintenanceLogEntries.homeId],
    references: [homes.id],
  }),
  task: one(maintenanceTasks, {
    fields: [maintenanceLogEntries.taskId],
    references: [maintenanceTasks.id],
  }),
  system: one(systems, {
    fields: [maintenanceLogEntries.systemId],
    references: [systems.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  home: one(homes, {
    fields: [chatMessages.homeId],
    references: [homes.id],
  }),
}));

export const fundsRelations = relations(funds, ({ one, many }) => ({
  home: one(homes, {
    fields: [funds.homeId],
    references: [homes.id],
  }),
  allocations: many(fundAllocations),
  expenses: many(expenses),
}));

export const fundAllocationsRelations = relations(fundAllocations, ({ one }) => ({
  fund: one(funds, {
    fields: [fundAllocations.fundId],
    references: [funds.id],
  }),
  task: one(maintenanceTasks, {
    fields: [fundAllocations.taskId],
    references: [maintenanceTasks.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  fund: one(funds, {
    fields: [expenses.fundId],
    references: [funds.id],
  }),
  task: one(maintenanceTasks, {
    fields: [expenses.taskId],
    references: [maintenanceTasks.id],
  }),
}));

export const inspectionReportsRelations = relations(inspectionReports, ({ one, many }) => ({
  home: one(homes, {
    fields: [inspectionReports.homeId],
    references: [homes.id],
  }),
  findings: many(inspectionFindings),
}));

export const inspectionFindingsRelations = relations(inspectionFindings, ({ one }) => ({
  report: one(inspectionReports, {
    fields: [inspectionFindings.reportId],
    references: [inspectionReports.id],
  }),
}));
