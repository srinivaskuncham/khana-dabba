import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/menu", async (_req, res) => {
    const menuItems = await storage.getMenuItems();
    res.json(menuItems);
  });

  app.get("/api/menu/:category", async (req, res) => {
    const menuItems = await storage.getMenuItemsByCategory(req.params.category);
    res.json(menuItems);
  });

  const httpServer = createServer(app);
  return httpServer;
}
