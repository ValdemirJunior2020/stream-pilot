import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sheetsAction } from "../services/sheetsApi.service.js";

export const favoriteRoutes = Router();

favoriteRoutes.use(requireAuth);

favoriteRoutes.get("/", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ favorites: unknown[] }>("favorites.list", {
      userEmail: req.user?.email
    });

    res.json(data.favorites);
  } catch (error) {
    next(error);
  }
});

favoriteRoutes.post("/:mediaId", async (req, res, next) => {
  try {
    const data = await sheetsAction("favorites.add", {
      userEmail: req.user?.email,
      mediaId: req.params.mediaId
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

favoriteRoutes.delete("/:mediaId", async (req, res, next) => {
  try {
    const data = await sheetsAction("favorites.remove", {
      userEmail: req.user?.email,
      mediaId: req.params.mediaId
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});