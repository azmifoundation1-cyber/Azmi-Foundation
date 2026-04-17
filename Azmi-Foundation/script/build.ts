import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";
import path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
// Only pure-JS packages safe to bundle. Native addons (bcrypt, pg with native bindings)
// must remain external so they load from node_modules at runtime.
const allowlist = [
  "@google/generative-ai",
  "axios",
  "compression",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "razorpay",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  // Remove 'crossorigin' from all link/script tags that reference same-origin assets.
  // Instagram WebView and old Android WebViews mishandle CORS preflight for same-origin
  // resources — stripping crossorigin avoids the issue entirely. All assets are served
  // with Access-Control-Allow-Origin: * from static.ts so nothing breaks.
  const htmlPath = path.resolve("dist/public/index.html");
  let html = await readFile(htmlPath, "utf-8");
  html = html.replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"');
  html = html.replace(/<link rel="modulepreload" crossorigin/g, '<link rel="modulepreload"');
  html = html.replace(/<script type="module" crossorigin/g, '<script type="module"');
  await writeFile(htmlPath, html);
  console.log("patched index.html: removed crossorigin from all same-origin tags");

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "dist/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
    banner: {
      js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
