import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sheetsAction } from "../services/sheetsApi.service.js";

export const historyRoutes = Router();

historyRoutes.use(requireAuth);

historyRoutes.post("/", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ history: unknown }>("history.save", {
      userEmail: req.user?.email,
      mediaId: req.body.mediaItemId,
      progressSeconds: req.body.progressSeconds,
      durationSeconds: req.body.durationSeconds
    });

    res.json(data.history);
  } catch (error) {
    next(error);
  }
});

historyRoutes.get("/", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ history: unknown[] }>("history.list", {
      userEmail: req.user?.email
    });

    res.json(data.history);
  } catch (error) {
    next(error);
  }
});

historyRoutes.get("/continue-watching", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ history: unknown[] }>("history.continue", {
      userEmail: req.user?.email
    });

    res.json(data.history);
  } catch (error) {
    next(error);
  }
});
