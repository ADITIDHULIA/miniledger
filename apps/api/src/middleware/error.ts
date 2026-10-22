import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
}

// Centralised error handler: every error leaves the API in the same JSON shape.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: Object.values(fields)[0] ?? "Invalid input", details: fields },
    });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Receipt must be 5 MB or smaller" : err.message;
    return res.status(400).json({ success: false, error: { code: "UPLOAD_ERROR", message } });
  }
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ success: false, error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res
      .status(400)
      .json({ success: false, error: { code: "BAD_JSON", message: "Request body is not valid JSON" } });
  }
  console.error(err);
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
}
