import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { unauthorized } from "../lib/errors";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(unauthorized("Missing or malformed Authorization header"));
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as jwt.JwtPayload;
    if (!payload.sub) throw new Error("no subject");
    req.userId = payload.sub;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
