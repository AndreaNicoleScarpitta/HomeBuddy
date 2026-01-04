import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import {
  insertHomeSchema,
  insertSystemSchema,
  insertMaintenanceTaskSchema,
  insertChatMessageSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // All routes protected by authentication
  
  // Home routes
  app.get("/api/home", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const home = await storage.getHome(userId);
      
      if (!home) {
        return res.status(404).json({ message: "Home not found" });
      }
      
      res.json(home);
    } catch (error) {
      console.error("Error fetching home:", error);
      res.status(500).json({ message: "Failed to fetch home" });
    }
  });
  
  app.post("/api/home", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const homeData = insertHomeSchema.parse({ ...req.body, userId });
      const home = await storage.createHome(homeData);
      res.json(home);
    } catch (error) {
      console.error("Error creating home:", error);
      res.status(400).json({ message: "Failed to create home" });
    }
  });
  
  app.patch("/api/home/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const home = await storage.updateHome(id, req.body);
      res.json(home);
    } catch (error) {
      console.error("Error updating home:", error);
      res.status(400).json({ message: "Failed to update home" });
    }
  });
  
  // System routes
  app.get("/api/home/:homeId/systems", isAuthenticated, async (req, res) => {
    try {
      const homeId = parseInt(req.params.homeId);
      const systems = await storage.getSystemsByHomeId(homeId);
      res.json(systems);
    } catch (error) {
      console.error("Error fetching systems:", error);
      res.status(500).json({ message: "Failed to fetch systems" });
    }
  });
  
  app.post("/api/home/:homeId/systems", isAuthenticated, async (req, res) => {
    try {
      const homeId = parseInt(req.params.homeId);
      const systemData = insertSystemSchema.parse({ ...req.body, homeId });
      const system = await storage.createSystem(systemData);
      res.json(system);
    } catch (error) {
      console.error("Error creating system:", error);
      res.status(400).json({ message: "Failed to create system" });
    }
  });
  
  // Maintenance task routes
  app.get("/api/home/:homeId/tasks", isAuthenticated, async (req, res) => {
    try {
      const homeId = parseInt(req.params.homeId);
      const tasks = await storage.getTasksByHomeId(homeId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  app.post("/api/home/:homeId/tasks", isAuthenticated, async (req, res) => {
    try {
      const homeId = parseInt(req.params.homeId);
      const taskData = insertMaintenanceTaskSchema.parse({ ...req.body, homeId });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });
  
  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Failed to update task" });
    }
  });
  
  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(400).json({ message: "Failed to delete task" });
    }
  });
  
  // Chat message routes
  app.get("/api/home/:homeId/chat", isAuthenticated, async (req, res) => {
    try {
      const homeId = parseInt(req.params.homeId);
      const messages = await storage.getChatMessagesByHomeId(homeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  app.post("/api/home/:homeId/chat", isAuthenticated, async (req, res) => {
    try {
      const homeId = parseInt(req.params.homeId);
      const messageData = insertChatMessageSchema.parse({ ...req.body, homeId });
      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: "Failed to create chat message" });
    }
  });

  return httpServer;
}
