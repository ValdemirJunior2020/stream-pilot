import { z } from "zod";
import type { Request, Response } from "express";
import * as historyService from "../services/history.service.js";
import { assertUserId } from "../utils/http.js";

export const historySchema = z.object({
  mediaItemId: z.string().min(1),
  progressSeconds: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().min(0).optional()
});

export async function save(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await historyService.saveHistory(userId, req.body);
  res.status(201).json(result);
}

export async function list(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await historyService.getHistory(userId);
  res.json(result);
}

export async function continueWatching(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await historyService.getContinueWatching(userId);
  res.json(result);
}
