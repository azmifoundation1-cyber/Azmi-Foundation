import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();

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
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

// Super admin middleware
async function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user as any;
  const dbUser = await storage.getUser(user.claims?.sub || user.id);
  if (!dbUser || dbUser.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin access required" });
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

  // --- Public Stats ---
  app.get("/api/public/stats", async (_req, res) => {
    try {
      const stats = await storage.getPublicStats();
      res.json(stats);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
      const { amount, campaignId, donorName } = z.object({
        amount: z.number().min(1),
        campaignId: z.coerce.number().optional(),
        donorName: z.string().optional(),
      }).parse(req.body);
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: `AF-${Date.now()}`,
        notes: {
          campaign_id: campaignId ? String(campaignId) : "",
          donor_name: donorName || "",
          source: "azmi-foundation-website",
        } as any,
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
      const {
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        campaignId, amount, donorName, donorEmail, donorPhone, isAnonymous,
        taxReceiptRequested, donorPan, donorAddress, donorCity, donorState, donorPincode,
      } = z.object({
          razorpay_order_id: z.string(),
          razorpay_payment_id: z.string(),
          razorpay_signature: z.string(),
          campaignId: z.coerce.number(),
          amount: z.string(),
          donorName: z.string().optional(),
          donorEmail: z.string().optional().nullable(),
          donorPhone: z.string().optional().nullable(),
          isAnonymous: z.boolean().optional(),
          taxReceiptRequested: z.boolean().optional(),
          donorPan: z.string().optional().nullable(),
          donorAddress: z.string().optional().nullable(),
          donorCity: z.string().optional().nullable(),
          donorState: z.string().optional().nullable(),
          donorPincode: z.string().optional().nullable(),
        }).parse(req.body);

      const expectedSig = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      // Prevent duplicate recording
      const existing = await storage.getDonationByPaymentId(razorpay_payment_id);
      if (existing) return res.status(200).json(existing);

      // Fetch full payment details from Razorpay to get method etc.
      let paymentMethod = "other";
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id) as any;
        const m = paymentDetails?.method;
        if (m === "upi") paymentMethod = "upi";
        else if (m === "card" || m === "emi") paymentMethod = "card";
        else if (m === "netbanking" || m === "bank_transfer") paymentMethod = "bank_transfer";
        // fill in contact details from Razorpay if not supplied by client
        if (!donorPhone && paymentDetails?.contact) (req.body as any).__rzpContact = paymentDetails.contact;
        if (!donorEmail && paymentDetails?.email) (req.body as any).__rzpEmail = paymentDetails.email;
      } catch { /* ignore — non-critical */ }

      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || null;

      const donation = await storage.createDonation({
        campaignId,
        amount,
        donorName: isAnonymous ? "Anonymous" : (donorName || "Anonymous"),
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null,
        isAnonymous: isAnonymous ?? false,
        taxReceiptRequested: taxReceiptRequested ?? false,
        donorPan: taxReceiptRequested ? (donorPan || null) : null,
        donorAddress: taxReceiptRequested ? (donorAddress || null) : null,
        donorCity: taxReceiptRequested ? (donorCity || null) : null,
        donorState: taxReceiptRequested ? (donorState || null) : null,
        donorPincode: taxReceiptRequested ? (donorPincode || null) : null,
        paymentId: razorpay_payment_id,
        paymentMethod: paymentMethod as any,
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

  // --- Razorpay: Webhook (server-to-server real-time) ---
  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
      if (webhookSecret) {
        const sig = req.headers["x-razorpay-signature"] as string;
        const expected = crypto
          .createHmac("sha256", webhookSecret)
          .update((req as any).rawBody || JSON.stringify(req.body))
          .digest("hex");
        if (sig !== expected) {
          return res.status(400).json({ message: "Invalid webhook signature" });
        }
      }

      const event = req.body?.event;
      const payment = req.body?.payload?.payment?.entity;
      if (!payment || !["payment.captured", "payment.authorized"].includes(event)) {
        return res.json({ status: "ignored" });
      }

      // Check for duplicate
      const existing = await storage.getDonationByPaymentId(payment.id);
      if (existing) return res.json({ status: "already_recorded" });

      const amountInRupees = String(Math.round(payment.amount / 100));
      const method = payment.method === "upi" ? "upi"
        : (payment.method === "card" || payment.method === "emi") ? "card"
        : (payment.method === "netbanking") ? "bank_transfer" : "other";

      // Try to find which campaign this order belongs to via notes
      let campaignId: number | null = null;
      if (payment.notes?.campaign_id) {
        campaignId = Number(payment.notes.campaign_id);
      }

      await storage.createDonation({
        campaignId,
        amount: amountInRupees,
        donorName: payment.notes?.donor_name || (payment.email ? payment.email.split("@")[0] : "Online Donor"),
        donorEmail: payment.email || null,
        donorPhone: payment.contact || null,
        isAnonymous: false,
        taxReceiptRequested: false,
        paymentId: payment.id,
        paymentMethod: method as any,
        status: "completed",
        userId: null,
      });

      console.log(`[Webhook] Recorded payment ${payment.id} ₹${amountInRupees}`);
      res.json({ status: "recorded" });
    } catch (err) {
      console.error("[Webhook] Error:", err);
      res.status(500).json({ message: "Webhook processing failed" });
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

  // --- My campaigns (submitted by user) ---
  app.get("/api/my/campaigns", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub || user?.id;
    const allCampaigns = await storage.getCampaigns();
    res.json(allCampaigns.filter((c: any) => c.createdBy === userId));
  });

  // --- User: Submit campaign proposal ---
  app.post("/api/user/campaigns", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id;
      const input = z.object({
        title: z.string().min(5),
        description: z.string().min(10),
        story: z.string().optional(),
        category: z.enum(["health", "education", "environment", "community", "emergency", "other"]),
        targetAmount: z.string(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
      }).parse(req.body);
      const campaign = await storage.createCampaign({
        ...input,
        status: "paused",
        featured: false,
        createdBy: userId,
      });
      res.status(201).json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- File Upload ---
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
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

  // --- Admin Analytics: Donation trend (last 30 days) ---
  app.get("/api/admin/analytics/donations", isAdmin, async (req, res) => {
    try {
      const { donations: allDonations } = await import("@shared/schema");
      const { gte, sql: sqlFn, and, eq: eqFn } = await import("drizzle-orm");
      const { db } = await import("./db");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 29);
      const rows = await db
        .select({
          day: sqlFn<string>`DATE(${allDonations.createdAt})`,
          total: sqlFn<number>`COALESCE(SUM(${allDonations.amount}), 0)`,
          count: sqlFn<number>`COUNT(*)`,
        })
        .from(allDonations)
        .where(and(gte(allDonations.createdAt, cutoff), eqFn(allDonations.status, "completed")))
        .groupBy(sqlFn`DATE(${allDonations.createdAt})`)
        .orderBy(sqlFn`DATE(${allDonations.createdAt})`);
      // Fill in missing days
      const map: Record<string, { total: number; count: number }> = {};
      rows.forEach(r => { map[r.day] = { total: Number(r.total), count: Number(r.count) }; });
      const result = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), total: map[key]?.total ?? 0, count: map[key]?.count ?? 0 });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Analytics error" });
    }
  });

  // --- Admin Analytics: Per-campaign stats ---
  app.get("/api/admin/analytics/campaigns", isAdmin, async (req, res) => {
    try {
      const { campaigns: campaignsTable, donations: donationsTable } = await import("@shared/schema");
      const { sql: sqlFn, eq: eqFn } = await import("drizzle-orm");
      const { db } = await import("./db");
      const rows = await db
        .select({
          campaignId: donationsTable.campaignId,
          total: sqlFn<number>`COALESCE(SUM(${donationsTable.amount}), 0)`,
          count: sqlFn<number>`COUNT(*)`,
        })
        .from(donationsTable)
        .where(eqFn(donationsTable.status, "completed"))
        .groupBy(donationsTable.campaignId);
      const stats: Record<number, { total: number; count: number }> = {};
      rows.forEach(r => { if (r.campaignId) stats[r.campaignId] = { total: Number(r.total), count: Number(r.count) }; });
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Analytics error" });
    }
  });

  // --- Admin: Update campaign current amount manually ---
  app.patch("/api/admin/campaigns/:id/amount", isAdmin, async (req, res) => {
    try {
      const { amount } = z.object({ amount: z.number().min(0) }).parse(req.body);
      const campaign = await storage.updateCampaign(Number(req.params.id), { currentAmount: String(amount) });
      res.json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Change password ---
  app.patch("/api/admin/change-password", isAdmin, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }).parse(req.body);
      const { users } = await import("@shared/models/auth");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const bcrypt = await import("bcrypt");
      const userId = req.user.localUser ? req.user.id : req.user.claims?.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.passwordHash) return res.status(400).json({ message: "No password set on this account" });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      const hash = await bcrypt.hash(newPassword, 12);
      await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
      res.json({ message: "Password updated successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Admin: Users ---
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const usersList = await storage.getAllUsers();
    res.json(usersList);
  });

  app.patch("/api/admin/users/:id/role", isAdmin, async (req: any, res) => {
    try {
      const { role } = z.object({ role: z.enum(["user", "admin", "super_admin"]) }).parse(req.body);
      // Only super_admins can grant or revoke super_admin role
      if (role === "super_admin") {
        const actor = req.user as any;
        const actorDb = await storage.getUser(actor.claims?.sub || actor.id);
        if (!actorDb || actorDb.role !== "super_admin") {
          return res.status(403).json({ message: "Only Super Admins can grant Super Admin role" });
        }
      }
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

  app.patch("/api/admin/campaigns/:id/status", isAdmin, async (req, res) => {
    try {
      const { status } = z.object({ status: z.enum(["active", "paused", "completed", "hidden"]) }).parse(req.body);
      const campaign = await storage.updateCampaign(Number(req.params.id), { status });
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

  // --- Admin: Sync from Razorpay ---
  app.post("/api/admin/razorpay/sync", isAdmin, async (req, res) => {
    try {
      let imported = 0;
      let skipped = 0;
      let from = 0; // page offset
      let hasMore = true;

      while (hasMore) {
        const result: any = await razorpay.payments.all({ count: 100, skip: from });
        const items: any[] = result?.items || [];
        if (!items.length) break;

        for (const p of items) {
          if (p.status !== "captured") { skipped++; continue; }

          // Skip if already recorded
          const dup = await storage.getDonationByPaymentId(p.id);
          if (dup) { skipped++; continue; }

          const amountRupees = String(Math.round(p.amount / 100));
          const method = p.method === "upi" ? "upi"
            : (p.method === "card" || p.method === "emi") ? "card"
            : (p.method === "netbanking") ? "bank_transfer" : "other";

          let campaignId: number | null = null;
          if (p.notes?.campaign_id) campaignId = Number(p.notes.campaign_id);

          const donorName = p.notes?.donor_name
            || (p.email ? p.email.split("@")[0] : "Online Donor");

          await storage.createDonation({
            campaignId,
            amount: amountRupees,
            donorName,
            donorEmail: p.email || null,
            donorPhone: p.contact || null,
            isAnonymous: false,
            taxReceiptRequested: false,
            paymentId: p.id,
            paymentMethod: method as any,
            status: "completed",
            userId: null,
          });
          imported++;
        }

        from += items.length;
        if (items.length < 100) hasMore = false;
        if (from >= 1000) hasMore = false; // safety cap
      }

      res.json({ imported, skipped, message: `Imported ${imported} payments, skipped ${skipped} (duplicates/non-captured)` });
    } catch (err: any) {
      console.error("Razorpay sync error:", err);
      res.status(500).json({ message: err.message || "Sync failed" });
    }
  });

  app.post("/api/admin/donations", isAdmin, async (req, res) => {
    try {
      const schema = z.object({
        donorName: z.string().min(1),
        donorEmail: z.string().email().optional().or(z.literal("")),
        donorPhone: z.string().optional(),
        amount: z.coerce.number().min(1),
        campaignId: z.coerce.number().optional(),
        paymentMethod: z.string().default("upi"),
        paymentId: z.string().optional(),
        message: z.string().optional(),
        isAnonymous: z.boolean().default(false),
        taxReceiptRequested: z.boolean().default(false),
        donorPan: z.string().optional(),
        donorAddress: z.string().optional(),
        donorCity: z.string().optional(),
        donorState: z.string().optional(),
        donorPincode: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const donation = await storage.createDonation({
        donorName: data.donorName,
        donorEmail: data.donorEmail || null,
        donorPhone: data.donorPhone || null,
        amount: String(data.amount),
        campaignId: data.campaignId || null,
        userId: null,
        status: "completed",
        paymentId: data.paymentId || `MANUAL-${Date.now()}`,
        paymentMethod: data.paymentMethod,
        message: data.message || null,
        isAnonymous: data.isAnonymous,
        taxReceiptRequested: data.taxReceiptRequested,
        donorPan: data.donorPan || null,
        donorAddress: data.donorAddress || null,
        donorCity: data.donorCity || null,
        donorState: data.donorState || null,
        donorPincode: data.donorPincode || null,
      });
      res.status(201).json(donation);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
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

  // ─── CAF: OTP & Signing ────────────────────────────────────────────────────
  // In-memory OTP store (production: use Redis or DB with expiry)
  const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

  app.post("/api/caf/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ phone: z.string().min(10).max(15) }).parse(req.body);
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

      // ── TODO: replace with real SMS gateway (MSG91 / Fast2SMS) ──
      // await fetch("https://api.msg91.com/api/v5/otp", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", "authkey": process.env.MSG91_KEY! },
      //   body: JSON.stringify({ template_id: "...", mobile: phone, otp }),
      // });
      console.log(`[CAF OTP] Phone: ${phone} | OTP: ${otp}`);

      const isDev = process.env.NODE_ENV !== "production";
      res.json({ success: true, message: "OTP sent successfully", ...(isDev ? { devOtp: otp } : {}) });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid phone number" });
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/caf/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = z.object({ phone: z.string(), otp: z.string() }).parse(req.body);
      const record = otpStore.get(phone);
      if (!record || record.otp !== otp.trim()) return res.status(400).json({ success: false, message: "Invalid OTP" });
      if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
      }
      otpStore.delete(phone);
      res.json({ success: true, message: "OTP verified" });
    } catch (err) {
      res.status(400).json({ success: false, message: "Verification failed" });
    }
  });

  app.post("/api/caf/save", async (req, res) => {
    try {
      const { cafSignatures: cafTable, cafRequests: reqTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const body = z.object({
        campaignId: z.number().optional(),
        campaignTitle: z.string().optional(),
        campaignerName: z.string().min(1),
        campaignerPhone: z.string().min(10),
        beneficiaryName: z.string().optional(),
        purpose: z.string().optional(),
        targetAmount: z.string().optional(),
        hospital: z.string().optional(),
        signatureDataUrl: z.string().min(10),
        requestToken: z.string().optional(),
        deviceInfo: z.object({
          userAgent: z.string().optional(),
          platform: z.string().optional(),
          screenSize: z.string().optional(),
          language: z.string().optional(),
          timezone: z.string().optional(),
        }).optional(),
      }).parse(req.body);
      const ip = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
      const now = new Date();
      const [saved] = await db.insert(cafTable).values({
        ...body,
        ipAddress: ip,
        otpVerified: true,
        signedAt: now,
        deviceInfo: body.deviceInfo || null,
      }).returning();
      // Mark linked request as signed
      if (body.requestToken) {
        await db.update(reqTable)
          .set({ status: "signed", signedAt: now })
          .where(eq(reqTable.token, body.requestToken));
      }
      res.json({ success: true, cafId: `CAF-${String(saved.id).padStart(6, "0")}`, id: saved.id, ipAddress: ip });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to save CAF" });
    }
  });

  // Admin: return current request IP (for PDF stamping)
  app.get("/api/admin/my-ip", isAdmin, (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    res.json({ ip });
  });

  // Public: return server's own public IP (for Campaign Manager stamp on non-admin CAFs)
  let _cachedServerIp: string | null = null;
  app.get("/api/server-ip", async (_req, res) => {
    try {
      if (!_cachedServerIp) {
        const r = await fetch("https://api.ipify.org?format=json");
        const d = await r.json() as { ip: string };
        _cachedServerIp = d.ip;
      }
      res.json({ ip: _cachedServerIp });
    } catch {
      res.json({ ip: "Azmi Foundation Server" });
    }
  });

  // Admin creates a signing link for a user
  app.post("/api/admin/caf/create-request", isAdmin, async (req: any, res) => {
    try {
      const { cafRequests: reqTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const body = z.object({
        campaignerName: z.string().min(1),
        campaignerPhone: z.string().min(10),
        beneficiaryName: z.string().optional(),
        purpose: z.string().optional(),
        targetAmount: z.string().optional(),
        hospital: z.string().optional(),
        campaignTitle: z.string().optional(),
        expiryHours: z.number().min(1).max(168).default(72),
      }).parse(req.body);
      const user = req.user as any;
      const dbUser = await storage.getUser(user.claims?.sub || user.id);
      const adminName = dbUser ? `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || dbUser.email || "Admin" : "Admin";
      const adminId = dbUser?.id || "unknown";
      const token = crypto.randomBytes(20).toString("hex");
      const expiresAt = new Date(Date.now() + body.expiryHours * 60 * 60 * 1000);
      const [saved] = await db.insert(reqTable).values({
        token, adminId, adminName,
        campaignerName: body.campaignerName,
        campaignerPhone: body.campaignerPhone,
        beneficiaryName: body.beneficiaryName,
        purpose: body.purpose,
        targetAmount: body.targetAmount,
        hospital: body.hospital,
        campaignTitle: body.campaignTitle,
        expiresAt,
      }).returning();
      const link = `${req.protocol}://${req.get("host")}/sign-caf?token=${token}`;
      res.json({ success: true, token, link, id: saved.id, expiresAt });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create signing request" });
    }
  });

  // Public: get pre-filled data from token
  app.get("/api/caf/request/:token", async (req, res) => {
    try {
      const { cafRequests: reqTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(reqTable).where(eq(reqTable.token, req.params.token));
      if (!row) return res.status(404).json({ message: "Signing link not found or expired" });
      if (row.status === "signed") return res.status(410).json({ message: "This CAF has already been signed" });
      if (row.expiresAt && row.expiresAt < new Date()) return res.status(410).json({ message: "This signing link has expired" });
      const { token: _t, adminId: _a, ...safe } = row as any;
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Failed to fetch signing request" });
    }
  });

  // Admin: get all signing requests
  app.get("/api/admin/caf/requests", isAdmin, async (_req, res) => {
    try {
      const { cafRequests: reqTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const rows = await db.select().from(reqTable).orderBy(desc(reqTable.createdAt));
      res.json(rows);
    } catch {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/admin/caf", isAdmin, async (req: any, res) => {
    try {
      const { cafSignatures: cafTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const rows = await db.select().from(cafTable).orderBy(desc(cafTable.createdAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch CAFs" });
    }
  });

  // Super Admin: delete a CAF record permanently
  app.delete("/api/admin/caf/:id", isSuperAdmin, async (req, res) => {
    try {
      const { cafSignatures: cafTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid CAF ID" });
      await db.delete(cafTable).where(eq(cafTable.id, id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete CAF" });
    }
  });

  // Return current admin's role info (used by frontend to gate super-admin UI)
  app.get("/api/admin/me", isAdmin, async (req: any, res) => {
    const actor = req.user as any;
    const dbUser = await storage.getUser(actor.claims?.sub || actor.id);
    if (!dbUser) return res.status(404).json({ message: "Not found" });
    res.json({ id: dbUser.id, email: dbUser.email, role: dbUser.role, firstName: dbUser.firstName, lastName: dbUser.lastName });
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Auto-promote designated main admins to super_admin (runs on every startup — safe & idempotent)
  try {
    const { db } = await import("./db");
    const { users } = await import("@shared/models/auth");
    const { inArray } = await import("drizzle-orm");
    const SUPER_ADMIN_EMAILS = ["support@azmifoundation.com", "azmifoundation1@gmail.com"];
    await db.update(users).set({ role: "super_admin" as any }).where(inArray(users.email, SUPER_ADMIN_EMAILS));
  } catch (e) {
    console.error("[seed] super_admin promotion failed:", e);
  }

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
      targetAmount: "50000000",
      imageUrl: "https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&q=80&w=800",
      status: "active",
      featured: true,
    });
    await storage.createCampaign({
      title: "Educate a Child",
      description: "Sponsor education for underprivileged children.",
      story: "Education is the most powerful tool to break the cycle of poverty. Help us provide school supplies, uniforms, and tuition support for children who would otherwise miss out on schooling.",
      category: "education",
      targetAmount: "50000000",
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
      targetAmount: "50000000",
      imageUrl: "/shahbaaz-thumb.jpg",
      status: "active",
      featured: true,
    });
  }

  const anwarExists = campaigns.some(c => c.title.includes("Anwar"));
  if (!anwarExists) {
    await storage.createCampaign({
      title: "Save Anwar — A Father Fighting to Survive After Traumatic Brain Injury",
      description: "Anwar (49) suffered a severe traumatic brain injury — emergency craniotomy, ICU, fractures. Hospital bills wiped out Rs. 1.05 crore in family savings. He now needs Rs. 50,000 to Rs. 2 lakh every month for physiotherapy, medicines and home nursing. His daughter Alqama is fighting for one more chance to save her father.",
      story: `My name is Alqma, and I am writing this with a heavy, shattered heart — tears blurring my vision as I beg the world to help save my father, my hero, Anwar (49 years old). Papa was our entire world: the strong, smiling man who woke at dawn every day for his car repair work, sweating through long hours to give us everything — my studies, our home, my mother's gentle smiles, my little siblings' innocent dreams. He would wrap me in his arms and say, "Beta, Papa is always here. No storm can touch us." That promise kept us alive.

Then came the nightmare no one saw coming — a horrific accident that crushed his skull and stole his strength. Severe head injury: blood flooding his brain, fractures everywhere, unbearable suffering. Doctors at Meera Hospital rushed him into emergency care, warning that immediate craniotomy (brain surgery) was critical. He battled in ICU, machines keeping him alive, while we watched in helpless agony. We poured in every last rupee — our savings wiped out, relatives drained dry with loans — but it was not enough.

The hospital handed us an official estimate letter: approximately Rs. 1 crore 5 lakh (Rs. 1.05 crore) for the full treatment — craniotomy surgery, extended ICU days (possibly months), daily medicines, repeated CT/MRI scans, and ongoing recovery care. That number felt like a death sentence. We had no way to pay. With broken hearts and endless tears, we had no choice but to discharge Papa and bring him home on basic home care — because staying longer would have meant abandoning him to fate.

Now he is here, in the same room where he used to laugh and play with us, but he is a shadow of himself. He struggles to speak even a word, his body barely moves, his eyes look straight into mine with silent pain, as if begging, "Beta, please do not give up on me." Every single morning, I sit beside his bed, hold his trembling hand, and cry until I cannot breathe — terrified that without proper funds, complications could take him from us forever. My mother weeps quietly through the night, praying endlessly. My younger siblings ask in scared whispers, "When will Papa hug us again?" We are completely shattered, helpless, and utterly alone.

Doctors insist that for any real chance at recovery, Papa needs urgent, continuous home care right now: daily specialized physiotherapy to rebuild strength and movement, powerful medicines to protect his brain, trained nurse visits to handle wounds and medication monitoring, and possible future hospital follow-ups and scans. Without this, his condition could worsen any moment. Monthly costs alone run Rs. 50,000 to 2 lakh+ (physio sessions Rs. 500 to 3,000 each, home nursing even higher), and we have nothing left after the hospital estimate crushed us.

Papa saved us from every hardship life threw at us. Now I am on my knees, alone and desperate, pleading for a miracle. Your compassion could be the light that brings my father back — lets him call my name again, walk to embrace his family, smile like the hero he is. Even the smallest amount — Rs. 100, Rs. 500, or just sharing this story — could cover a day of nursing, a week of physio, or a month of hope.

With tear-soaked gratitude and endless prayers, thank you for being our only hope in this darkness. Every rupee, every share, every dua keeps Papa fighting.

Papa... hold on just a little longer. Your beta is begging the world for you.`,
      category: "health",
      targetAmount: "10500000",
      imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800",
      status: "active",
      featured: true,
      endDate: new Date("2026-05-18T23:59:59.000Z"),
      upiId: "8320218861@okbizaxis",
      upiName: "Azmi Foundation",
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
