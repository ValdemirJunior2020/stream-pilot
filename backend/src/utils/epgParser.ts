import { XMLParser } from "fast-xml-parser";

export type ParsedEpgProgram = {
  channelId: string;
  title: string;
  description?: string;
  category?: string;
  start: Date;
  end: Date;
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function readText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as Record<string, unknown>)["#text"];
    return typeof text === "string" ? text : undefined;
  }
  return undefined;
}

export function parseXmltvDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?$/);
  if (!match) return new Date(value);

  const [, y, mo, d, h, mi, s, tz] = match;
  const offset = tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : "Z";
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`);
}

export function parseXmltv(content: string): ParsedEpgProgram[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true
  });

  const parsed = parser.parse(content);
  const programmes = asArray(parsed?.tv?.programme);

  return programmes
    .map((programme: Record<string, unknown>) => {
      const channelId = String(programme["@_channel"] || "");
      const startRaw = String(programme["@_start"] || "");
      const stopRaw = String(programme["@_stop"] || "");
      const title = readText(programme.title) || "Programa sem título";
      const description = readText(programme.desc);
      const category = readText(programme.category);

      return {
        channelId,
        title,
        description,
        category,
        start: parseXmltvDate(startRaw),
        end: parseXmltvDate(stopRaw)
      };
    })
    .filter((program) => program.channelId && !Number.isNaN(program.start.getTime()) && !Number.isNaN(program.end.getTime()));
}
