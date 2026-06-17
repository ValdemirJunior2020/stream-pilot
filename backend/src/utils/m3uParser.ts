import { MEDIA_TYPE, type MediaTypeValue } from "../constants/enums.js";
import { normalizeText } from "./http.js";

export type ParsedM3uItem = {
  title: string;
  streamUrl: string;
  tvgId?: string;
  tvgName?: string;
  logo?: string;
  groupTitle?: string;
  type: MediaTypeValue;
  seriesName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
};

function parseAttributes(line: string) {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function parseTitle(line: string, attrs: Record<string, string>) {
  const commaIndex = line.indexOf(",");
  const titleAfterComma = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : "";
  return titleAfterComma || attrs["tvg-name"] || attrs["tvg-id"] || "Sem título";
}

function detectSeries(title: string, groupTitle = "", streamUrl = "") {
  const source = `${title} ${groupTitle} ${streamUrl}`;
  const seasonEpisode = source.match(/(.+?)[\s._-]*(?:S(\d{1,2})E(\d{1,2})|(\d{1,2})x(\d{1,2}))[\s._-]*(.*)?$/i);

  if (!seasonEpisode) {
    const seriesLike = /series|séries|serie|temporada|episode|episodio|episódio/i.test(source);
    return seriesLike ? { seriesName: title, seasonNumber: undefined, episodeNumber: undefined } : null;
  }

  const seriesName = seasonEpisode[1]
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const seasonNumber = Number(seasonEpisode[2] || seasonEpisode[4]);
  const episodeNumber = Number(seasonEpisode[3] || seasonEpisode[5]);

  return {
    seriesName: seriesName || title,
    seasonNumber: Number.isFinite(seasonNumber) ? seasonNumber : undefined,
    episodeNumber: Number.isFinite(episodeNumber) ? episodeNumber : undefined
  };
}

function classifyItem(title: string, groupTitle = "", streamUrl = "") {
  const normalized = normalizeText(`${title} ${groupTitle} ${streamUrl}`);

  const series = detectSeries(title, groupTitle, streamUrl);
  if (series || /\/series\//i.test(streamUrl)) {
    return { type: MEDIA_TYPE.SERIES_EPISODE, ...series };
  }

  if (
    normalized.includes("movie") ||
    normalized.includes("movies") ||
    normalized.includes("filme") ||
    normalized.includes("filmes") ||
    normalized.includes("vod") ||
    /\/movie\//i.test(streamUrl)
  ) {
    return { type: MEDIA_TYPE.MOVIE };
  }

  return { type: MEDIA_TYPE.LIVE };
}

export function parseM3u(content: string): ParsedM3uItem[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results: ParsedM3uItem[] = [];
  let currentInfo: { attrs: Record<string, string>; title: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const attrs = parseAttributes(line);
      currentInfo = { attrs, title: parseTitle(line, attrs) };
      continue;
    }

    if (line.startsWith("#")) {
      continue;
    }

    if (!/^https?:\/\//i.test(line)) {
      continue;
    }

    const attrs = currentInfo?.attrs ?? {};
    const title = currentInfo?.title || attrs["tvg-name"] || "Sem título";
    const groupTitle = attrs["group-title"] || undefined;
    const classification = classifyItem(title, groupTitle, line);

    results.push({
      title,
      streamUrl: line,
      tvgId: attrs["tvg-id"] || undefined,
      tvgName: attrs["tvg-name"] || undefined,
      logo: attrs["tvg-logo"] || undefined,
      groupTitle,
      ...classification
    });

    currentInfo = null;
  }

  const unique = new Map<string, ParsedM3uItem>();
  for (const item of results) {
    if (!unique.has(item.streamUrl)) {
      unique.set(item.streamUrl, item);
    }
  }

  return Array.from(unique.values());
}
