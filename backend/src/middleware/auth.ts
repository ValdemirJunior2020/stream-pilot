import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

type TokenPayload = {
  sub: string;
  email: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, "Token não informado."));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new HttpError(401, "Token inválido ou expirado."));
  }
}
