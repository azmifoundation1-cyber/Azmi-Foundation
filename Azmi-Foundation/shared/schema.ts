import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";
import { users } from "./models/auth";

// Campaigns Table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  story: text("story"),
  category: text("category", { enum: ["health", "education", "environment", "community", "emergency", "other"] }).default("other").notNull(),
  targetAmount: decimal("target_amount").notNull(),
  currentAmount: decimal("current_amount").default("0").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  status: text("status", { enum: ["active", "completed", "paused", "hidden"] }).default("active").notNull(),
  featured: boolean("featured").default(false),
  endDate: timestamp("end_date"),
  createdBy: text("created_by").references(() => users.id),
  // Campaign-specific payment account
  upiId: text("upi_id"),
  upiName: text("upi_name"),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  bankName: text("bank_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Updates Table
export const campaignUpdates = pgTable("campaign_updates", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Donations Table
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  amount: decimal("amount").notNull(),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email"),
  donorPhone: text("donor_phone"),
  message: text("message"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  userId: text("user_id").references(() => users.id),
  status: text("status", { enum: ["pending", "completed", "failed", "refunded"] }).default("pending").notNull(),
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method", { enum: ["upi", "bank_transfer", "card", "other"] }).default("other"),
  isAnonymous: boolean("is_anonymous").default(false),
  taxReceiptRequested: boolean("tax_receipt_requested").default(false),
  donorPan: text("donor_pan"),
  donorAddress: text("donor_address"),
  donorCity: text("donor_city"),
  donorState: text("donor_state"),
  donorPincode: text("donor_pincode"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Programs Table
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category").default("general"),
  location: text("location"),
  status: text("status", { enum: ["upcoming", "ongoing", "completed"] }).default("upcoming").notNull(),
  date: timestamp("date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Registrations Table (Members, Volunteers, Interns)
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["member", "volunteer", "intern"] }).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  adminNote: text("admin_note"),
  details: jsonb("details").$type<{
    phone?: string;
    address?: string;
    skills?: string;
    availability?: string;
    resumeUrl?: string;
    idProofUrl?: string;
    motivation?: string;
    education?: string;
    occupation?: string;
    experience?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact Messages Table
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "read", "replied"] }).default("new").notNull(),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  donations: many(donations),
  updates: many(campaignUpdates),
}));

export const campaignUpdatesRelations = relations(campaignUpdates, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignUpdates.campaignId],
    references: [campaigns.id],
  }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [donations.campaignId],
    references: [campaigns.id],
  }),
  user: one(users, {
    fields: [donations.userId],
    references: [users.id],
  }),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
}));

// CAF Signatures Table
export const cafSignatures = pgTable("caf_signatures", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  campaignTitle: text("campaign_title"),
  campaignerName: text("campaigner_name").notNull(),
  campaignerPhone: text("campaigner_phone").notNull(),
  beneficiaryName: text("beneficiary_name"),
  purpose: text("purpose"),
  targetAmount: text("target_amount"),
  hospital: text("hospital"),
  signatureDataUrl: text("signature_data_url").notNull(),
  ipAddress: text("ip_address"),
  otpVerified: boolean("otp_verified").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CafSignature = typeof cafSignatures.$inferSelect;

// Schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true, currentAmount: true });
export const insertCampaignUpdateSchema = createInsertSchema(campaignUpdates).omit({ id: true, createdAt: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true, status: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, createdAt: true, updatedAt: true, status: true, adminNote: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true, status: true, adminNote: true });

// Types
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CampaignUpdate = typeof campaignUpdates.$inferSelect;
export type InsertCampaignUpdate = z.infer<typeof insertCampaignUpdateSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
