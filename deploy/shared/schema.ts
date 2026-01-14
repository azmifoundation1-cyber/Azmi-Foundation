import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
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
  targetAmount: decimal("target_amount").notNull(),
  currentAmount: decimal("current_amount").default("0").notNull(),
  imageUrl: text("image_url"),
  status: text("status", { enum: ["active", "completed"] }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Donations Table
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  amount: decimal("amount").notNull(),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  status: text("status", { enum: ["pending", "completed"] }).default("pending").notNull(),
  paymentId: text("payment_id"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Programs Table
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  date: timestamp("date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Registrations Table (Members, Volunteers, Interns)
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(), // Link to Auth User
  type: text("type", { enum: ["member", "volunteer", "intern"] }).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  details: jsonb("details").$type<{
    phone?: string;
    address?: string;
    skills?: string;
    availability?: string;
    resumeUrl?: string;
    idProofUrl?: string;
    motivation?: string;
    education?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [donations.campaignId],
    references: [campaigns.id],
  }),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, currentAmount: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true, status: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, createdAt: true, status: true });

// Types
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
