import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sheetsAction } from "../services/sheetsApi.service.js";

export const epgRoutes = Router();

epgRoutes.use(requireAuth);

epgRoutes.post("/source", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ source: unknown }>("epg.source", {
      userEmail: req.user?.email,
      name: req.body.name,
      url: req.body.url
    });

    res.json(data.source);
  } catch (error) {
    next(error);
  }
});

epgRoutes.post("/sync", async (req, res, next) => {
  try {
    const data = await sheetsAction("epg.sync", {
      userEmail: req.user?.email,
      sourceId: req.body.sourceId
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

epgRoutes.get("/channel/:channelId", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ programs: unknown[] }>("epg.channel", {
      userEmail: req.user?.email,
      channelId: req.params.channelId
    });

    res.json(data.programs);
  } catch (error) {
    next(error);
  }
});

epgRoutes.get("/guide", async (_req, res) => {
  res.json([]);
});
