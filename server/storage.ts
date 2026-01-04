import {
  homes,
  type Home,
  type InsertHome,
  systems,
  type System,
  type InsertSystem,
  maintenanceTasks,
  type MaintenanceTask,
  type InsertMaintenanceTask,
  chatMessages,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Homes
  getHome(userId: string): Promise<Home | undefined>;
  createHome(home: InsertHome): Promise<Home>;
  updateHome(id: number, data: Partial<InsertHome>): Promise<Home>;
  
  // Systems
  getSystemsByHomeId(homeId: number): Promise<System[]>;
  createSystem(system: InsertSystem): Promise<System>;
  updateSystem(id: number, data: Partial<InsertSystem>): Promise<System>;
  deleteSystem(id: number): Promise<void>;
  
  // Maintenance Tasks
  getTasksByHomeId(homeId: number): Promise<MaintenanceTask[]>;
  createTask(task: InsertMaintenanceTask): Promise<MaintenanceTask>;
  updateTask(id: number, data: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask>;
  deleteTask(id: number): Promise<void>;
  
  // Chat Messages
  getChatMessagesByHomeId(homeId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Homes
  async getHome(userId: string): Promise<Home | undefined> {
    const [home] = await db.select().from(homes).where(eq(homes.userId, userId));
    return home;
  }
  
  async createHome(homeData: InsertHome): Promise<Home> {
    const [home] = await db.insert(homes).values(homeData).returning();
    return home;
  }
  
  async updateHome(id: number, data: Partial<InsertHome>): Promise<Home> {
    const [home] = await db
      .update(homes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homes.id, id))
      .returning();
    return home;
  }
  
  // Systems
  async getSystemsByHomeId(homeId: number): Promise<System[]> {
    return await db.select().from(systems).where(eq(systems.homeId, homeId));
  }
  
  async createSystem(systemData: InsertSystem): Promise<System> {
    const [system] = await db.insert(systems).values(systemData).returning();
    return system;
  }
  
  async updateSystem(id: number, data: Partial<InsertSystem>): Promise<System> {
    const [system] = await db
      .update(systems)
      .set(data)
      .where(eq(systems.id, id))
      .returning();
    return system;
  }
  
  async deleteSystem(id: number): Promise<void> {
    await db.delete(systems).where(eq(systems.id, id));
  }
  
  // Maintenance Tasks
  async getTasksByHomeId(homeId: number): Promise<MaintenanceTask[]> {
    return await db
      .select()
      .from(maintenanceTasks)
      .where(eq(maintenanceTasks.homeId, homeId))
      .orderBy(maintenanceTasks.dueDate);
  }
  
  async createTask(taskData: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const [task] = await db.insert(maintenanceTasks).values(taskData).returning();
    return task;
  }
  
  async updateTask(id: number, data: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask> {
    const [task] = await db
      .update(maintenanceTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(maintenanceTasks.id, id))
      .returning();
    return task;
  }
  
  async deleteTask(id: number): Promise<void> {
    await db.delete(maintenanceTasks).where(eq(maintenanceTasks.id, id));
  }
  
  // Chat Messages
  async getChatMessagesByHomeId(homeId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.homeId, homeId))
      .orderBy(chatMessages.createdAt);
  }
  
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
