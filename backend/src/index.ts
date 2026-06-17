import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SHEETS_AUTH_URL: z.string().url(),
  SHEETS_AUTH_SECRET: z.string().min(16),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
});

const env = envSchema.parse(process.env);

type TokenUser = {
  id: string;
  email: string;
  name?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser;
    }
  }
}

const app = express();

app.disable("etag");

app.use((_req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const allowedOrigins = env.FRONTEND_ORIGIN
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const isLocalhost =
    origin?.startsWith("http://localhost:") ||
    origin?.startsWith("http://127.0.0.1:");

  const isAllowed =
    !origin ||
    allowedOrigins.includes("*") ||
    allowedOrigins.includes(origin) ||
    (env.NODE_ENV !== "production" && isLocalhost);

  if (isAllowed && origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  next();
});

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false
  })
);

function signToken(user: TokenUser) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name || ""
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as any
    }
  );
}

function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenUser;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({
      ok: false,
      message: "Missing token"
    });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      ok: false,
      message: "Invalid token"
    });
  }
}

async function sheetsAction<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(env.SHEETS_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      secret: env.SHEETS_AUTH_SECRET,
      action,
      ...payload
    })
  });

  const data = (await response.json()) as { ok?: boolean; message?: string; [key: string]: any };

  if (!data.ok) {
    throw new Error(data.message || "Google Sheets API error");
  }

  return data as T;
}

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

type SheetUser = {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "StreamPilot API",
    storage: "Google Sheets"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "StreamPilot API",
    storage: "Google Sheets"
  });
});

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ user: SheetUser }>("auth.register", {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name
    });

    const token = signToken(data.user);

    res.json({
      token,
      user: data.user
    });
  })
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ user: SheetUser }>("auth.login", {
      email: req.body.email,
      password: req.body.password
    });

    const token = signToken(data.user);

    res.json({
      token,
      user: data.user
    });
  })
);

app.get(
  "/api/auth/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ user: SheetUser }>("auth.me", {
      email: req.user?.email
    });

    res.json(data.user);
  })
);

app.get(
  "/api/playlists",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ playlists: unknown[] }>("playlists.list", {
      userEmail: req.user?.email
    });

    res.json(data.playlists);
  })
);

app.post(
  "/api/playlists",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ playlist: unknown }>("playlists.create", {
      userEmail: req.user?.email,
      name: req.body.name,
      url: req.body.url
    });

    res.json(data.playlist);
  })
);

app.post(
  "/api/playlists/:id/sync",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ imported: number; playlistId: string }>("playlists.sync", {
      userEmail: req.user?.email,
      playlistId: req.params.id
    });

    res.json(data);
  })
);

app.delete(
  "/api/playlists/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction("playlists.delete", {
      userEmail: req.user?.email,
      playlistId: req.params.id
    });

    res.json(data);
  })
);

app.get(
  "/api/media",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction("media.list", {
      userEmail: req.user?.email,
      type: req.query.type,
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit
    });

    res.json(data);
  })
);

app.get(
  "/api/media/categories",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ categories: unknown[] }>("media.categories", {
      userEmail: req.user?.email,
      type: req.query.type
    });

    res.json(data.categories);
  })
);

app.get(
  "/api/media/search",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ items: unknown[] }>("media.search", {
      userEmail: req.user?.email,
      q: req.query.q || ""
    });

    res.json(data.items);
  })
);

app.get("/api/media/series", requireAuth, (_req, res) => {
  res.json([]);
});

app.get(
  "/api/media/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ media: unknown }>("media.get", {
      userEmail: req.user?.email,
      mediaId: req.params.id
    });

    res.json(data.media);
  })
);

app.post(
  "/api/history",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ history: unknown }>("history.save", {
      userEmail: req.user?.email,
      mediaId: req.body.mediaItemId,
      progressSeconds: req.body.progressSeconds,
      durationSeconds: req.body.durationSeconds
    });

    res.json(data.history);
  })
);

app.get(
  "/api/history",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ history: unknown[] }>("history.list", {
      userEmail: req.user?.email
    });

    res.json(data.history);
  })
);

app.get(
  "/api/history/continue-watching",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ history: unknown[] }>("history.continue", {
      userEmail: req.user?.email
    });

    res.json(data.history);
  })
);

app.get(
  "/api/favorites",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ favorites: unknown[] }>("favorites.list", {
      userEmail: req.user?.email
    });

    res.json(data.favorites);
  })
);

app.post(
  "/api/favorites/:mediaId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction("favorites.add", {
      userEmail: req.user?.email,
      mediaId: req.params.mediaId
    });

    res.json(data);
  })
);

app.delete(
  "/api/favorites/:mediaId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction("favorites.remove", {
      userEmail: req.user?.email,
      mediaId: req.params.mediaId
    });

    res.json(data);
  })
);

app.post(
  "/api/epg/source",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ source: unknown }>("epg.source", {
      userEmail: req.user?.email,
      name: req.body.name,
      url: req.body.url
    });

    res.json(data.source);
  })
);

app.post(
  "/api/epg/sync",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction("epg.sync", {
      userEmail: req.user?.email,
      sourceId: req.body.sourceId
    });

    res.json(data);
  })
);

app.get(
  "/api/epg/channel/:channelId",
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = await sheetsAction<{ programs: unknown[] }>("epg.channel", {
      userEmail: req.user?.email,
      channelId: req.params.channelId
    });

    res.json(data.programs);
  })
);

app.get("/api/epg/guide", requireAuth, (_req, res) => {
  res.json([]);
});

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found"
  });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API_ERROR]", error.message);

  res.status(400).json({
    ok: false,
    message: error.message || "Server error"
  });
});

app.listen(env.PORT, "0.0.0.0", () => {
  console.log("");
  console.log("======================================");
  console.log(" StreamPilot API running");
  console.log("======================================");
  console.log(` API: http://localhost:${env.PORT}`);
  console.log(` Health: http://localhost:${env.PORT}/health`);
  console.log(" Storage: Google Sheets");
  console.log("======================================");
  console.log("");
});
