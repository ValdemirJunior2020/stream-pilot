import { z } from "zod";
import type { Request, Response } from "express";
import * as playlistService from "../services/playlist.service.js";
import { assertUserId } from "../utils/http.js";

export const playlistSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), "Use uma URL http/https válida.")
});

export async function create(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const playlist = await playlistService.createPlaylist(userId, req.body);
  res.status(201).json(playlist);
}

export async function list(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const playlists = await playlistService.listPlaylists(userId);
  res.json(playlists);
}

export async function sync(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await playlistService.syncPlaylist(userId, req.params.id);
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const userId = assertUserId(req.user?.id);
  const result = await playlistService.deletePlaylist(userId, req.params.id);
  res.json(result);
}
