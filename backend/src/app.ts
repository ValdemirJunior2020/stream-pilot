import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

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

app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found"
  });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API_ERROR]", error.message);

  res.status(400).json({
    ok: false,
    message: error.message || "Server error"
  });
});
