import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  let distPath = path.resolve(__dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    // Try one level up (if running from server/ directory)
    distPath = path.resolve(__dirname, "..", "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    // Try root dist (if running from server/ on Vercel)
    distPath = path.resolve(process.cwd(), "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory. Tried ${distPath}, make sure to build the client first`,
    );
  }

  app.use((_, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
    next();
  });

  // Dedicated video streaming route with proper range-request support
  app.get("/shahbaaz-video.mp4", (req: Request, res: Response) => {
    const videoPath = path.resolve(distPath, "shahbaaz-video.mp4");
    if (!fs.existsSync(videoPath)) {
      res.status(404).end();
      return;
    }
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunkSize);

      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader("Content-Length", fileSize);
      fs.createReadStream(videoPath).pipe(res);
    }
  });

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css") || filePath.endsWith(".js")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
      if (filePath.endsWith(".mp4") || filePath.endsWith(".webm") || filePath.endsWith(".ogg")) {
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
