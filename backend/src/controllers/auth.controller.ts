import { z } from "zod";
import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { assertUserId } from "../utils/http.js";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(80).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const user = await authService.getMe(userId);
  res.json(user);
}
