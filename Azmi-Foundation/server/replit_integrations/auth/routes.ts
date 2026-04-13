import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { users } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Register local passport strategy for email/password auth
export function setupLocalAuth() {
  passport.use(
    "local",
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()));

        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, { localUser: true, id: user.id });
      } catch (err) {
        return done(err);
      }
    })
  );
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  setupLocalAuth();

  // Get current authenticated user (supports both Replit OIDC and local auth)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localUser ? req.user.id : req.user.claims?.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Signup with email/password
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "Name, email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const emailLower = email.toLowerCase().trim();

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, emailLower));

      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [newUser] = await db
        .insert(users)
        .values({
          email: emailLower,
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          passwordHash,
          role: "user",
        })
        .returning();

      const sessionUser = { localUser: true, id: newUser.id };

      req.login(sessionUser, (err: any) => {
        if (err) {
          console.error("Login after signup failed:", err);
          return res.status(500).json({ message: "Signup succeeded but login failed" });
        }
        const { passwordHash: _ph, ...safeUser } = newUser;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", (req: any, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, async (loginErr: any) => {
        if (loginErr) return next(loginErr);
        try {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id));
          const { passwordHash: _ph, ...safeUser } = dbUser;
          res.json(safeUser);
        } catch (e) {
          res.json({ id: user.id });
        }
      });
    })(req, res, next);
  });

  // Logout (works for both auth methods)
  app.post("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });
}
