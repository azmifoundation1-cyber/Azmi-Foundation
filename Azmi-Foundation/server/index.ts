import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();
const httpServer = createServer(app);

app.use(compression());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ── Startup: fix campaign end dates that are in the past ──
  try {
    const { storage } = await import("./storage");
    const campaigns = await storage.getCampaigns();
    const fixes: Record<number, string> = {
      3: "2026-06-30T23:59:59.000Z",
      4: "2026-07-31T23:59:59.000Z",
      5: "2026-06-15T23:59:59.000Z",
      6: "2026-05-22T23:59:59.000Z",
    };
    for (const c of campaigns) {
      const fixDate = fixes[c.id];
      if (fixDate) {
        const endDate = c.endDate ? new Date(c.endDate as string) : null;
        const now = new Date();
        if (!endDate || endDate < now) {
          await storage.updateCampaign(c.id, { endDate: fixDate as any });
          console.log(`[startup] Fixed end date for campaign ${c.id}`);
        }
      }
    }
  } catch (e) {
    console.error("[startup] Could not fix campaign end dates:", e);
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);

  // On Vercel, we don't call listen() as the platform handles the lifecycle
  if (process.env.VERCEL) {
    log(`running as Vercel Serverless Function`);
  } else {
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  }
})();
