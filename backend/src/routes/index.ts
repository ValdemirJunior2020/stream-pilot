import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { playlistRoutes } from "./playlists.routes.js";
import { mediaRoutes } from "./media.routes.js";
import { historyRoutes } from "./history.routes.js";
import { favoriteRoutes } from "./favorites.routes.js";
import { epgRoutes } from "./epg.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/playlists", playlistRoutes);
apiRoutes.use("/media", mediaRoutes);
apiRoutes.use("/history", historyRoutes);
apiRoutes.use("/favorites", favoriteRoutes);
apiRoutes.use("/epg", epgRoutes);
