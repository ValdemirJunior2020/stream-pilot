import { env } from "../config/env.js";

export async function sheetsAction<T>(
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

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || "Google Sheets API error");
  }

  return data as T;
}
