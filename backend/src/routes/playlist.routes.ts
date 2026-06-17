import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sheetsAction } from "../services/sheetsApi.service.js";

export const playlistRoutes = Router();

playlistRoutes.use(requireAuth);

playlistRoutes.get("/", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ playlists: unknown[] }>("playlists.list", {
      userEmail: req.user?.email
    });

    res.json(data.playlists);
  } catch (error) {
    next(error);
  }
});

playlistRoutes.post("/", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ playlist: unknown }>("playlists.create", {
      userEmail: req.user?.email,
      name: req.body.name,
      url: req.body.url
    });

    res.json(data.playlist);
  } catch (error) {
    next(error);
  }
});

playlistRoutes.post("/:id/sync", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ imported: number; playlistId: string }>("playlists.sync", {
      userEmail: req.user?.email,
      playlistId: req.params.id
    });

    res.json({
      imported: data.imported,
      playlistId: data.playlistId
    });
  } catch (error) {
    next(error);
  }
});

playlistRoutes.delete("/:id", async (req, res, next) => {
  try {
    const data = await sheetsAction("playlists.delete", {
      userEmail: req.user?.email,
      playlistId: req.params.id
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});