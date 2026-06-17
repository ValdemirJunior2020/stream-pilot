import type { Request, Response } from "express";
import * as favoriteService from "../services/favorite.service.js";
import { assertUserId } from "../utils/http.js";

export async function add(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await favoriteService.addFavorite(userId, req.params.mediaId);
  res.status(201).json(result);
}

export async function remove(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await favoriteService.removeFavorite(userId, req.params.mediaId);
  res.json(result);
}

export async function list(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await favoriteService.listFavorites(userId);
  res.json(result);
}
