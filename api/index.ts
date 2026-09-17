import express from "express";
import type { Request, Response } from "express";
import { apiRouter } from "../server/routes";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Support both /api/* (when preserved in request) and stripped routes
app.use("/api", apiRouter);
app.use(apiRouter);

export default function handler(req: Request, res: Response) {
  return app(req, res);
}

