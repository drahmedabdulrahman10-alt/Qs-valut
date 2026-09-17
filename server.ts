import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { apiRouter } from "./server/routes.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Root lightweight health endpoint (responds immediately, no credentials required)
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Mount API router
  app.use("/api", apiRouter);

  // Serve static frontend in production when dist exists, or use Vite middleware in development
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (isProduction && hasDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Question Vault server listening on 0.0.0.0:${PORT} (PORT=${process.env.PORT || 3000})`);
  });
}

startServer().catch((error) => {
  console.error("Fatal error starting Question Vault server:", error);
  process.exit(1);
});
