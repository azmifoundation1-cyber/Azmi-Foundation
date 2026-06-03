import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : false
});

// Test database connection on startup
pool.query('SELECT NOW()').then(() => {
  console.log("[db] Successfully connected to PostgreSQL");
}).catch((err: any) => {
  console.error("[db] Database connection error:", err.message);
  if (err.message.includes("endpoint has been disabled")) {
    console.error("CRITICAL: Your Neon database endpoint is disabled. Please enable it in the Neon console.");
  }
});

export const db = drizzle(pool, { schema });
