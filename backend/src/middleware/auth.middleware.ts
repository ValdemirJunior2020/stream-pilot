import type { NextFunction, Request, Response } from "express";
import { verifyToken, type TokenUser } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({
      ok: false,
      message: "Missing token"
    });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      ok: false,
      message: "Invalid token"
    });
  }
}
