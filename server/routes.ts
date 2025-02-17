import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertKidSchema, insertUserSchema, insertLunchSelectionSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Monthly Menu endpoints
  app.get("/api/menu/:year/:month", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const date = new Date(parseInt(req.params.year), parseInt(req.params.month) - 1);
    const menuItems = await storage.getMonthlyMenuItems(date);
    res.json(menuItems);
  });

  app.get("/api/menu/:year/:month/veg", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const date = new Date(parseInt(req.params.year), parseInt(req.params.month) - 1);
    const menuItems = await storage.getVegMenuItems(date);
    res.json(menuItems);
  });

  app.get("/api/menu/:year/:month/non-veg", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const date = new Date(parseInt(req.params.year), parseInt(req.params.month) - 1);
    const menuItems = await storage.getNonVegMenuItems(date);
    res.json(menuItems);
  });

  // Lunch Selection endpoints
  app.get("/api/kids/:kidId/lunch-selections/:year/:month", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const kidId = parseInt(req.params.kidId);
    const kid = await storage.getKid(kidId);

    if (!kid || kid.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const date = new Date(parseInt(req.params.year), parseInt(req.params.month) - 1);
    const selections = await storage.getLunchSelectionsForKid(kidId, date);
    res.json(selections);
  });

  app.post("/api/kids/:kidId/lunch-selections", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const kidId = parseInt(req.params.kidId);
    const kid = await storage.getKid(kidId);

    if (!kid || kid.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    try {
      const selectionData = insertLunchSelectionSchema.parse({
        ...req.body,
        kidId,
      });

      const selection = await storage.createLunchSelection(selectionData);
      res.status(201).json(selection);
    } catch (error) {
      console.error('Error creating lunch selection:', error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ 
          message: "Failed to create lunch selection",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.put("/api/kids/:kidId/lunch-selections/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const kidId = parseInt(req.params.kidId);
    const kid = await storage.getKid(kidId);

    if (!kid || kid.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    try {
      const selectionData = insertLunchSelectionSchema.partial().parse(req.body);
      const updated = await storage.updateLunchSelection(
        parseInt(req.params.id),
        selectionData,
        req.user.id
      );

      if (!updated) {
        return res.status(400).json({
          message: "Cannot modify selection - either it doesn't exist, or it's within 24 hours of delivery",
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating lunch selection:', error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ 
          message: "Failed to update lunch selection",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.delete("/api/kids/:kidId/lunch-selections/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const kidId = parseInt(req.params.kidId);
    const kid = await storage.getKid(kidId);

    if (!kid || kid.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    try {
      const deleted = await storage.deleteLunchSelection(parseInt(req.params.id));
      if (!deleted) {
        return res.status(400).json({
          message: "Cannot delete selection - either it doesn't exist, or it's within 24 hours of delivery",
        });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting lunch selection:', error);
      res.status(500).json({ 
        message: "Failed to delete lunch selection", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
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
        res.status(500).json({ message: "Failed to update user profile", error: error instanceof Error ? error.message : String(error) });
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
        res.status(500).json({ message: "Failed to create kid profile", error: error instanceof Error ? error.message : String(error) });
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
        res.status(500).json({ message: "Failed to update kid profile", error: error instanceof Error ? error.message : String(error) });
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

  // Add this endpoint inside registerRoutes function
  app.get("/api/holidays/:year/:month", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const holidays = await storage.getHolidays(startDate, endDate);
    res.json(holidays);
  });

  const httpServer = createServer(app);
  return httpServer;
}