import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export function registerRoutes(app: Express): Server {
  // Goals API routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.updateGoal(parseInt(req.params.id), req.body);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}