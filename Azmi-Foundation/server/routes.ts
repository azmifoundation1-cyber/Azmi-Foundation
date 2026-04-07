import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Campaigns ===
  app.get(api.campaigns.list.path, async (req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.get(api.campaigns.get.path, async (req, res) => {
    const campaign = await storage.getCampaign(Number(req.params.id));
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json(campaign);
  });

  app.post(api.campaigns.create.path, isAuthenticated, async (req, res) => {
    try {
      // In a real app, check for admin role here
      const input = api.campaigns.create.input.parse(req.body);
      const campaign = await storage.createCampaign(input);
      res.status(201).json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Donations ===
  app.post(api.donations.create.path, async (req, res) => {
    try {
      const input = api.donations.create.input.parse(req.body);
      const donation = await storage.createDonation(input);
      
      // Update campaign amount if applicable
      if (input.campaignId) {
        // ideally we'd update the campaign total here transactionally
      }

      res.status(201).json(donation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.donations.list.path, async (req, res) => {
    const donations = await storage.getDonations();
    res.json(donations);
  });

  app.get("/api/donations/campaign/:campaignId", async (req, res) => {
    const donations = await storage.getDonationsByCampaign(Number(req.params.campaignId));
    res.json(donations);
  });

  // === Programs ===
  app.get(api.programs.list.path, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.post(api.programs.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.programs.create.input.parse(req.body);
      const program = await storage.createProgram(input);
      res.status(201).json(program);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Registrations ===
  app.post(api.registrations.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.registrations.create.input.parse(req.body);
      const registration = await storage.createRegistration(input);
      res.status(201).json(registration);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.registrations.list.path, isAuthenticated, async (req, res) => {
    // Admin only in real app
    const registrations = await storage.getRegistrations();
    res.json(registrations);
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const campaigns = await storage.getCampaigns();
  if (campaigns.length === 0) {
    await storage.createCampaign({
      title: "Clean Water for Villages",
      description: "Providing clean and safe drinking water to remote villages.",
      targetAmount: "50000",
      imageUrl: "https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&q=80&w=800",
      status: "active"
    });
    await storage.createCampaign({
      title: "Educate a Child",
      description: "Sponsor education for underprivileged children.",
      targetAmount: "25000",
      imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
      status: "active"
    });
  }

  const programs = await storage.getPrograms();
  if (programs.length === 0) {
    await storage.createProgram({
      title: "Community Health Camps",
      description: "Regular health checkups and medicine distribution.",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
      date: new Date()
    });
    await storage.createProgram({
      title: "Women Empowerment",
      description: "Skill development workshops for women.",
      imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800",
      date: new Date()
    });
  }
}
