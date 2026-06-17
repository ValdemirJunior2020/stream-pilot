import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sheetsAction } from "../services/sheetsApi.service.js";

export const mediaRoutes = Router();

mediaRoutes.use(requireAuth);

mediaRoutes.get("/", async (req, res, next) => {
  try {
    const data = await sheetsAction<{
      items: unknown[];
      total: number;
      page: number;
      limit: number;
    }>("media.list", {
      userEmail: req.user?.email,
      type: req.query.type,
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

mediaRoutes.get("/categories", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ categories: unknown[] }>("media.categories", {
      userEmail: req.user?.email,
      type: req.query.type
    });

    res.json(data.categories);
  } catch (error) {
    next(error);
  }
});

mediaRoutes.get("/search", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ items: unknown[] }>("media.search", {
      userEmail: req.user?.email,
      q: req.query.q || ""
    });

    res.json(data.items);
  } catch (error) {
    next(error);
  }
});

mediaRoutes.get("/series", async (_req, res) => {
  res.json([]);
});

mediaRoutes.get("/:id", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ media: unknown }>("media.get", {
      userEmail: req.user?.email,
      mediaId: req.params.id
    });

    res.json(data.media);
  } catch (error) {
    next(error);
  }
});
