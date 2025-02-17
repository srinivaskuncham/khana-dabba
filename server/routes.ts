import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertKidSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";

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

  // User profile endpoint
  app.put("/api/user", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const updateData = insertUserSchema
        .omit({ username: true, password: true })
        .partial()
        .parse(req.body);

      const updated = await storage.updateUser(req.user.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the session with new user data
      req.login(updated, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to update session" });
        }
        res.json(updated);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update user profile" });
      }
    }
  });

  // Kids endpoints
  app.get("/api/kids", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const kids = await storage.getKidsByUserId(req.user.id);
    res.json(kids);
  });

  app.post("/api/kids", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const kidData = insertKidSchema.parse({ ...req.body, userId: req.user.id });
      const kid = await storage.createKid(kidData);
      res.status(201).json(kid);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create kid profile" });
      }
    }
  });

  app.put("/api/kids/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const kidId = parseInt(req.params.id);
    const kid = await storage.getKid(kidId);

    if (!kid || kid.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    try {
      const updateData = insertKidSchema.partial().parse(req.body);
      const updated = await storage.updateKid(kidId, updateData);
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update kid profile" });
      }
    }
  });

  app.delete("/api/kids/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const kidId = parseInt(req.params.id);
    const kid = await storage.getKid(kidId);

    if (!kid || kid.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    await storage.deleteKid(kidId);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}