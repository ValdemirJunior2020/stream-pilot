import { MEDIA_TYPE_VALUES, type MediaTypeValue } from "../constants/enums.js";
import { z } from "zod";
import type { Request, Response } from "express";
import * as mediaService from "../services/media.service.js";
import { assertUserId } from "../utils/http.js";

export const mediaQuerySchema = z.object({
  type: z.enum(MEDIA_TYPE_VALUES).optional(),
  category: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});

export const searchQuerySchema = z.object({
  q: z.string().min(1)
});

export const categoriesQuerySchema = z.object({
  type: z.enum(MEDIA_TYPE_VALUES).optional()
});

export async function list(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await mediaService.listMedia(userId, req.query as never);
  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await mediaService.getMedia(userId, req.params.id);
  res.json(result);
}

export async function categories(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await mediaService.getCategories(userId, req.query.type as MediaTypeValue | undefined);
  res.json(result);
}

export async function search(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await mediaService.searchMedia(userId, String(req.query.q));
  res.json(result);
}

export async function series(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await mediaService.getSeries(userId);
  res.json(result);
}
