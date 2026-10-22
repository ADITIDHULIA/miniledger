import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { loansRouter, UPLOAD_DIR } from "./routes/loans";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  // Receipts are served from local disk by unguessable UUID file names (see README "Known limitations").
  app.use("/uploads", express.static(UPLOAD_DIR, { index: false }));
  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api/auth", authRouter);
  app.use("/api/loans", loansRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
