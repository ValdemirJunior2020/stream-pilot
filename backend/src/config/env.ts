import dotenv from "dotenv";
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

export const env = envSchema.parse(process.env);
