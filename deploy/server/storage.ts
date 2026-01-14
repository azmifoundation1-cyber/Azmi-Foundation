import { 
  users, type User, type InsertUser,
  campaigns, type Campaign, type InsertCampaign,
  donations, type Donation, type InsertDonation,
  programs, type Program, type InsertProgram,
  registrations, type Registration, type InsertRegistration
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users (from Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  
  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;
  getDonationsByCampaign(campaignId: number): Promise<Donation[]>;
  
  // Programs
  getPrograms(): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  
  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrations(): Promise<Registration[]>;
  getRegistrationsByUser(userId: string): Promise<Registration[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods (Auth integration uses specific authStorage, but we keep these for compatibility/mock)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: Replit Auth uses email mostly, but this is kept for interface
    return undefined; 
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // This is handled by Replit Auth's upsertUser usually, but implemented for completeness
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  // Donations
  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(insertDonation).returning();
    return donation;
  }

  async getDonations(): Promise<Donation[]> {
    return await db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonationsByCampaign(campaignId: number): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.campaignId, campaignId));
  }

  // Programs
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(insertProgram).returning();
    return program;
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
    return await db.select().from(registrations).where(eq(registrations.userId, userId));
  }
}

export const storage = new DatabaseStorage();
