import { z } from "zod";
import type { Request, Response } from "express";
import * as epgService from "../services/epg.service.js";
import { assertUserId } from "../utils/http.js";

export const epgSourceSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), "Use uma URL http/https válida.")
});

export const epgSyncSchema = z.object({
  sourceId: z.string().optional()
});

export async function createSource(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await epgService.createEpgSource(userId, req.body);
  res.status(201).json(result);
}

export async function sync(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await epgService.syncEpg(userId, req.body?.sourceId);
  res.json(result);
}

export async function channel(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await epgService.getChannelEpg(userId, req.params.channelId);
  res.json(result);
}

export async function guide(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await epgService.getGuide(userId);
  res.json(result);
}
