import { pgTable, varchar, integer, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (IMPORTANT for Replit Auth)
export * from "./models/auth";
import { users } from "./models/auth";

// Homes table - stores user's home profile
export const homes = pgTable("homes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  builtYear: integer("built_year"),
  sqFt: integer("sq_ft"),
  type: varchar("type", { length: 100 }),
  healthScore: integer("health_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("homes_user_id_idx").on(table.userId),
]);

export const insertHomeSchema = createInsertSchema(homes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHome = z.infer<typeof insertHomeSchema>;
export type Home = typeof homes.$inferSelect;

// Systems table - stores home systems (HVAC, Roof, etc.)
export const systems = pgTable("systems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  age: integer("age"),
  status: varchar("status", { length: 50 }).default("good"), // good, warning, critical
  lastService: timestamp("last_service"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("systems_home_id_idx").on(table.homeId),
]);

export const insertSystemSchema = createInsertSchema(systems).omit({ id: true, createdAt: true });
export type InsertSystem = z.infer<typeof insertSystemSchema>;
export type System = typeof systems.$inferSelect;

// Maintenance tasks table
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  homeId: integer("home_id").notNull().references(() => homes.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  dueDate: timestamp("due_date"),
  urgency: varchar("urgency", { length: 50 }).default("later"), // now, soon, later, monitor
  diyLevel: varchar("diy_level", { length: 50 }).default("DIY-Safe"), // DIY-Safe, Caution, Pro-Only
  status: varchar("status", { length: 50 }).default("pending"), // pending, scheduled, completed, overdue
  estimatedCost: varchar("estimated_cost", { length: 100 }),
  difficulty: varchar("difficulty", { length: 50 }),
  safetyWarning: text("safety_warning"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("maintenance_tasks_home_id_idx").on(table.homeId),
  index("maintenance_tasks_urgency_idx").on(table.urgency),
]);

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

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
  chatMessages: many(chatMessages),
}));

export const systemsRelations = relations(systems, ({ one }) => ({
  home: one(homes, {
    fields: [systems.homeId],
    references: [homes.id],
  }),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one }) => ({
  home: one(homes, {
    fields: [maintenanceTasks.homeId],
    references: [homes.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  home: one(homes, {
    fields: [chatMessages.homeId],
    references: [homes.id],
  }),
}));
