import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export type SheetsUser = {
  id: string;
  email: string;
  name?: string;
  status?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

type SheetsResponse = {
  ok: boolean;
  message?: string;
  user?: SheetsUser;
};

function assertSheetsConfig() {
  if (!env.SHEETS_AUTH_URL || !env.SHEETS_AUTH_SECRET) {
    throw new HttpError(500, "Google Sheets Auth não está configurado no backend.");
  }
}

function statusFromMessage(message: string | undefined) {
  const text = (message || "").toLowerCase();
  if (text.includes("já está cadastrado")) return 409;
  if (text.includes("inválid")) return 401;
  if (text.includes("inativo")) return 403;
  if (text.includes("não autorizado")) return 502;
  return 400;
}

async function callSheets(action: string, payload: Record<string, unknown>) {
  assertSheetsConfig();

  const response = await fetch(env.SHEETS_AUTH_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action,
      secret: env.SHEETS_AUTH_SECRET,
      ...payload
    })
  });

  const data = (await response.json().catch(() => null)) as SheetsResponse | null;

  if (!data) {
    throw new HttpError(502, "Resposta inválida do Google Sheets Auth.");
  }

  if (!data.ok) {
    throw new HttpError(statusFromMessage(data.message), data.message || "Erro no Google Sheets Auth.");
  }

  if (!data.user) {
    throw new HttpError(502, "Google Sheets Auth não retornou o usuário.");
  }

  return data.user;
}

export async function registerWithSheets(input: { email: string; password: string; name?: string }) {
  return callSheets("register", input);
}

export async function loginWithSheets(input: { email: string; password: string }) {
  return callSheets("login", input);
}
