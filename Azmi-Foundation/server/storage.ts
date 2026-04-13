import { 
  users, type User, type UpsertUser,
  campaigns, type Campaign, type InsertCampaign,
  campaignUpdates, type CampaignUpdate, type InsertCampaignUpdate,
  donations, type Donation, type InsertDonation,
  programs, type Program, type InsertProgram,
  registrations, type Registration, type InsertRegistration,
  contactMessages, type ContactMessage, type InsertContactMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: "user" | "admin"): Promise<User>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getFeaturedCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, data: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;
  updateCampaignAmount(id: number, amount: number): Promise<void>;

  // Campaign Updates
  getCampaignUpdates(campaignId: number): Promise<CampaignUpdate[]>;
  createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate>;
  deleteCampaignUpdate(id: number): Promise<void>;

  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;
  getDonationsByCampaign(campaignId: number): Promise<Donation[]>;
  getDonationsByUser(userId: string): Promise<Donation[]>;
  updateDonationStatus(id: number, status: string): Promise<Donation>;

  // Programs
  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program>;
  deleteProgram(id: number): Promise<void>;

  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrations(): Promise<Registration[]>;
  getRegistrationsByUser(userId: string): Promise<Registration[]>;
  updateRegistrationStatus(id: number, status: "approved" | "rejected", adminNote?: string): Promise<Registration>;

  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  updateMessageStatus(id: number, status: "read" | "replied", adminNote?: string): Promise<ContactMessage>;

  // Public Stats
  getPublicStats(): Promise<{ totalAmount: number; totalDonors: number; activeCampaigns: number }>;

  // Admin Stats
  getAdminStats(): Promise<{
    totalDonations: number;
    totalAmount: number;
    activeCampaigns: number;
    totalUsers: number;
    pendingRegistrations: number;
    newMessages: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: "user" | "admin"): Promise<User> {
    const [user] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getFeaturedCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.featured, true)).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: number, data: Partial<InsertCampaign>): Promise<Campaign> {
    const [campaign] = await db.update(campaigns).set({ ...data, updatedAt: new Date() }).where(eq(campaigns.id, id)).returning();
    return campaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async updateCampaignAmount(id: number, additionalAmount: number): Promise<void> {
    await db.execute(sql`UPDATE campaigns SET current_amount = current_amount + ${additionalAmount} WHERE id = ${id}`);
  }

  // Campaign Updates
  async getCampaignUpdates(campaignId: number): Promise<CampaignUpdate[]> {
    return await db.select().from(campaignUpdates).where(eq(campaignUpdates.campaignId, campaignId)).orderBy(desc(campaignUpdates.createdAt));
  }

  async createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate> {
    const [upd] = await db.insert(campaignUpdates).values(update).returning();
    return upd;
  }

  async deleteCampaignUpdate(id: number): Promise<void> {
    await db.delete(campaignUpdates).where(eq(campaignUpdates.id, id));
  }

  // Donations
  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(insertDonation).returning();
    if (donation.campaignId && donation.status === "completed") {
      await this.updateCampaignAmount(donation.campaignId, Number(donation.amount));
    }
    return donation;
  }

  async getDonations(): Promise<Donation[]> {
    return await db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonationsByCampaign(campaignId: number): Promise<Donation[]> {
    return await db.select().from(donations)
      .where(and(eq(donations.campaignId, campaignId), eq(donations.status, "completed")))
      .orderBy(desc(donations.createdAt));
  }

  async getDonationsByUser(userId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.userId, userId)).orderBy(desc(donations.createdAt));
  }

  async updateDonationStatus(id: number, status: string): Promise<Donation> {
    const existing = await db.select().from(donations).where(eq(donations.id, id));
    const [donation] = await db.update(donations).set({ status: status as any }).where(eq(donations.id, id)).returning();
    // If status just became completed and campaign exists, update amount
    if (status === "completed" && donation.campaignId && existing[0]?.status !== "completed") {
      await this.updateCampaignAmount(donation.campaignId, Number(donation.amount));
    }
    return donation;
  }

  // Programs
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(insertProgram).returning();
    return program;
  }

  async updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program> {
    const [program] = await db.update(programs).set({ ...data, updatedAt: new Date() }).where(eq(programs.id, id)).returning();
    return program;
  }

  async deleteProgram(id: number): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  }

  // Registrations
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db.insert(registrations).values(insertRegistration).returning();
    return registration;
  }

  async getRegistrations(): Promise<Registration[]> {
    return await db.select().from(registrations).orderBy(desc(registrations.createdAt));
  }

  async getRegistrationsByUser(userId: string): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.userId, userId)).orderBy(desc(registrations.createdAt));
  }

  async updateRegistrationStatus(id: number, status: "approved" | "rejected", adminNote?: string): Promise<Registration> {
    const [registration] = await db.update(registrations)
      .set({ status, adminNote: adminNote || null, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();
    return registration;
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [msg] = await db.insert(contactMessages).values(message).returning();
    return msg;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async updateMessageStatus(id: number, status: "read" | "replied", adminNote?: string): Promise<ContactMessage> {
    const [msg] = await db.update(contactMessages)
      .set({ status, adminNote: adminNote || null })
      .where(eq(contactMessages.id, id))
      .returning();
    return msg;
  }

  // Admin Stats
  async getPublicStats() {
    const [donationStats] = await db.select({
      totalAmount: sum(donations.amount),
      total: count(),
    }).from(donations).where(eq(donations.status, "completed"));
    const [campaignStats] = await db.select({ total: count() }).from(campaigns).where(eq(campaigns.status, "active"));
    return {
      totalAmount: Number(donationStats?.totalAmount || 0),
      totalDonors: Number(donationStats?.total || 0),
      activeCampaigns: Number(campaignStats?.total || 0),
    };
  }

  async getAdminStats() {
    const [donationStats] = await db.select({
      total: count(),
      totalAmount: sum(donations.amount),
    }).from(donations).where(eq(donations.status, "completed"));

    const [campaignStats] = await db.select({ total: count() }).from(campaigns).where(eq(campaigns.status, "active"));
    const [userStats] = await db.select({ total: count() }).from(users);
    const [pendingRegs] = await db.select({ total: count() }).from(registrations).where(eq(registrations.status, "pending"));
    const [newMsgs] = await db.select({ total: count() }).from(contactMessages).where(eq(contactMessages.status, "new"));

    return {
      totalDonations: Number(donationStats?.total || 0),
      totalAmount: Number(donationStats?.totalAmount || 0),
      activeCampaigns: Number(campaignStats?.total || 0),
      totalUsers: Number(userStats?.total || 0),
      pendingRegistrations: Number(pendingRegs?.total || 0),
      newMessages: Number(newMsgs?.total || 0),
    };
  }
}

export const storage = new DatabaseStorage();
