import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import Razorpay from "razorpay";
import crypto from "crypto";

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || "").replace(/[^a-zA-Z0-9_]/g, "");
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").replace(/[^a-zA-Z0-9_]/g, "");

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Admin middleware
async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user as any;
  const dbUser = await storage.getUser(user.claims?.sub || user.id);
  if (!dbUser || dbUser.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ==============================
  // PUBLIC ROUTES
  // ==============================

  // --- Campaigns ---
  app.get(api.campaigns.list.path, async (req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.get("/api/campaigns/featured", async (req, res) => {
    const campaigns = await storage.getFeaturedCampaigns();
    res.json(campaigns);
  });

  app.get(api.campaigns.get.path, async (req, res) => {
    const campaign = await storage.getCampaign(Number(req.params.id));
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  });

  app.get("/api/campaigns/:id/updates", async (req, res) => {
    const updates = await storage.getCampaignUpdates(Number(req.params.id));
    res.json(updates);
  });

  // --- Programs ---
  app.get(api.programs.list.path, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  // --- Donations (public read per campaign) ---
  app.get("/api/donations/campaign/:campaignId", async (req, res) => {
    const donations = await storage.getDonationsByCampaign(Number(req.params.campaignId));
    res.json(donations);
  });

  // --- Contact Form ---
  app.post("/api/contact", async (req, res) => {
    try {
      const { insertContactMessageSchema } = await import("@shared/schema");
      const input = insertContactMessageSchema.parse(req.body);
      const msg = await storage.createContactMessage(input);
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==============================
  // AUTHENTICATED USER ROUTES
  // ==============================

  // --- Razorpay: Create Order ---
  app.post("/api/razorpay/order", async (req, res) => {
    try {
      const { amount } = z.object({ amount: z.number().min(1) }).parse(req.body);
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
      res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
      console.error("Razorpay order error:", err);
      res.status(500).json({ message: "Could not create payment order" });
    }
  });

  // --- Razorpay: Verify Payment & Record Donation ---
  app.post("/api/razorpay/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaignId, amount, donorName, donorEmail, isAnonymous } =
        z.object({
          razorpay_order_id: z.string(),
          razorpay_payment_id: z.string(),
          razorpay_signature: z.string(),
          campaignId: z.number(),
          amount: z.string(),
          donorName: z.string().optional(),
          donorEmail: z.string().optional().nullable(),
          isAnonymous: z.boolean().optional(),
        }).parse(req.body);

      const expectedSig = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || null;

      const donation = await storage.createDonation({
        campaignId,
        amount,
        donorName: isAnonymous ? "Anonymous" : (donorName || "Anonymous"),
        donorEmail: donorEmail || null,
        isAnonymous: isAnonymous ?? false,
        paymentId: razorpay_payment_id,
        status: "completed",
        userId,
      });

      res.status(201).json(donation);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Razorpay verify error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Razorpay: Key (public) ---
  app.get("/api/razorpay/key", (_req, res) => {
    res.json({ key: RAZORPAY_KEY_ID });
  });

  // --- Donation creation (legacy fallback) ---
  app.post(api.donations.create.path, async (req, res) => {
    try {
      const input = api.donations.create.input.parse(req.body);
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || null;
      const donation = await storage.createDonation({ ...input, userId });
      res.status(201).json(donation);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- My donations ---
  app.get("/api/my/donations", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub || user?.id;
    const donations = await storage.getDonationsByUser(userId);
    res.json(donations);
  });

  // --- My registrations ---
  app.get("/api/my/registrations", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub || user?.id;
    const registrations = await storage.getRegistrationsByUser(userId);
    res.json(registrations);
  });

  // --- Submit Registration ---
  app.post(api.registrations.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.registrations.create.input.parse(req.body);
      const registration = await storage.createRegistration(input);
      res.status(201).json(registration);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==============================
  // ADMIN ROUTES
  // ==============================

  // --- Bootstrap Admin (only works if no admins exist yet) ---
  app.post("/api/admin/bootstrap", isAuthenticated, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    const hasAdmin = allUsers.some(u => u.role === "admin");
    if (hasAdmin) {
      return res.status(403).json({ message: "Admin already exists. Contact your administrator." });
    }
    const user = req.user as any;
    const userId = user?.claims?.sub || user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const updated = await storage.updateUserRole(userId, "admin");
    res.json({ success: true, user: updated });
  });

  // --- Admin Stats ---
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  // --- Admin: Users ---
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const usersList = await storage.getAllUsers();
    res.json(usersList);
  });

  app.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
    try {
      const { role } = z.object({ role: z.enum(["user", "admin"]) }).parse(req.body);
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Campaigns ---
  app.post(api.campaigns.create.path, isAdmin, async (req, res) => {
    try {
      const input = api.campaigns.create.input.parse(req.body);
      const campaign = await storage.createCampaign(input);
      res.status(201).json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/campaigns/:id", isAdmin, async (req, res) => {
    try {
      const { insertCampaignSchema } = await import("@shared/schema");
      const input = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(Number(req.params.id), input);
      res.json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/campaigns/:id", isAdmin, async (req, res) => {
    await storage.deleteCampaign(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/campaigns/:id/updates", isAdmin, async (req, res) => {
    try {
      const { insertCampaignUpdateSchema } = await import("@shared/schema");
      const input = insertCampaignUpdateSchema.parse({ ...req.body, campaignId: Number(req.params.id) });
      const update = await storage.createCampaignUpdate(input);
      res.status(201).json(update);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/campaign-updates/:id", isAdmin, async (req, res) => {
    await storage.deleteCampaignUpdate(Number(req.params.id));
    res.json({ success: true });
  });

  // --- Admin: Donations ---
  app.get(api.donations.list.path, isAdmin, async (req, res) => {
    const donations = await storage.getDonations();
    res.json(donations);
  });

  app.patch("/api/admin/donations/:id/status", isAdmin, async (req, res) => {
    try {
      const { status } = z.object({ status: z.enum(["pending", "completed", "failed", "refunded"]) }).parse(req.body);
      const donation = await storage.updateDonationStatus(Number(req.params.id), status);
      res.json(donation);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Programs ---
  app.post(api.programs.create.path, isAdmin, async (req, res) => {
    try {
      const input = api.programs.create.input.parse(req.body);
      const program = await storage.createProgram(input);
      res.status(201).json(program);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/programs/:id", isAdmin, async (req, res) => {
    try {
      const { insertProgramSchema } = await import("@shared/schema");
      const input = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(Number(req.params.id), input);
      res.json(program);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/programs/:id", isAdmin, async (req, res) => {
    await storage.deleteProgram(Number(req.params.id));
    res.json({ success: true });
  });

  // --- Admin: Registrations ---
  app.get(api.registrations.list.path, isAdmin, async (req, res) => {
    const registrations = await storage.getRegistrations();
    res.json(registrations);
  });

  app.patch("/api/admin/registrations/:id/status", isAdmin, async (req, res) => {
    try {
      const { status, adminNote } = z.object({
        status: z.enum(["approved", "rejected"]),
        adminNote: z.string().optional(),
      }).parse(req.body);
      const registration = await storage.updateRegistrationStatus(Number(req.params.id), status, adminNote);
      res.json(registration);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Contact Messages ---
  app.get("/api/admin/messages", isAdmin, async (req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  app.patch("/api/admin/messages/:id/status", isAdmin, async (req, res) => {
    try {
      const { status, adminNote } = z.object({
        status: z.enum(["read", "replied"]),
        adminNote: z.string().optional(),
      }).parse(req.body);
      const msg = await storage.updateMessageStatus(Number(req.params.id), status, adminNote);
      res.json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const campaigns = await storage.getCampaigns();
  
  // Fix existing campaigns that were seeded without category/featured
  for (const c of campaigns) {
    const updates: any = {};
    if (!c.category || c.category === "other") {
      if (c.title.includes("Water")) updates.category = "community";
      else if (c.title.includes("Educate")) updates.category = "education";
      else if (c.title.includes("Shahbaaz")) updates.category = "community";
    }
    if (!c.featured && (c.title.includes("Shahbaaz") || c.title.includes("Water") || c.title.includes("Educate"))) {
      updates.featured = true;
    }
    if (!c.story) {
      if (c.title.includes("Water")) updates.story = "Thousands of families in remote villages walk miles every day just to access clean water. Your donation will fund water purification units and bore wells that will serve entire communities for decades.";
      else if (c.title.includes("Educate")) updates.story = "Education is the most powerful tool to break the cycle of poverty. Help us provide school supplies, uniforms, and tuition support for children who would otherwise miss out on schooling.";
      else if (c.title.includes("Shahbaaz")) updates.story = "Every day, Dr. Shahbaaz Azmi wakes up before dawn to coordinate the preparation and distribution of free meals to over 2,000 people on the streets of Ahmedabad. Despite bearing the burden of his father's critical medical expenses, he has never once stopped this mission. Your support ensures no one goes to sleep hungry.";
    }
    if (Object.keys(updates).length > 0) {
      await storage.updateCampaign(c.id, updates);
    }
  }

  if (campaigns.length === 0) {
    await storage.createCampaign({
      title: "Clean Water for Villages",
      description: "Providing clean and safe drinking water to remote villages in Gujarat.",
      story: "Thousands of families in remote villages walk miles every day just to access clean water. Your donation will fund water purification units and bore wells that will serve entire communities for decades.",
      category: "community",
      targetAmount: "50000",
      imageUrl: "https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&q=80&w=800",
      status: "active",
      featured: true,
    });
    await storage.createCampaign({
      title: "Educate a Child",
      description: "Sponsor education for underprivileged children.",
      story: "Education is the most powerful tool to break the cycle of poverty. Help us provide school supplies, uniforms, and tuition support for children who would otherwise miss out on schooling.",
      category: "education",
      targetAmount: "25000",
      imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
      status: "active",
      featured: true,
    });
  }

  const shahbaazExists = campaigns.some(c => c.title.includes("Shahbaaz"));
  if (!shahbaazExists) {
    await storage.createCampaign({
      title: "Help Dr. Shahbaaz Feed 2000+ Needy People Everyday For Free",
      description: "Dr. Shahbaaz Azmi is managing both his father's critical medical condition and feeding over 2000+ hungry people every single day from the streets of Ahmedabad. Your donation keeps this mission alive.",
      story: "Every day, Dr. Shahbaaz Azmi wakes up before dawn to coordinate the preparation and distribution of free meals to over 2,000 people on the streets of Ahmedabad. Despite bearing the burden of his father's critical medical expenses, he has never once stopped this mission. Your support ensures no one goes to sleep hungry.",
      category: "community",
      targetAmount: "500000",
      imageUrl: "/shahbaaz-thumb.jpg",
      status: "active",
      featured: true,
    });
  }

  const programs = await storage.getPrograms();
  if (programs.length === 0) {
    await storage.createProgram({
      title: "Community Health Camps",
      description: "Regular health checkups and medicine distribution in underserved areas.",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
      category: "health",
      status: "ongoing",
      date: new Date(),
    });
    await storage.createProgram({
      title: "Women Empowerment",
      description: "Skill development workshops for women to achieve financial independence.",
      imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800",
      category: "empowerment",
      status: "ongoing",
      date: new Date(),
    });
    await storage.createProgram({
      title: "Youth Leadership Training",
      description: "Empowering young people with leadership and entrepreneurship skills.",
      imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800",
      category: "education",
      status: "upcoming",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }
}
