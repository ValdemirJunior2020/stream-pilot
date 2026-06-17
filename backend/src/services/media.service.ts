import type { Prisma } from "@prisma/client";
import { MEDIA_TYPE, type MediaTypeValue } from "../constants/enums.js";
import { prisma } from "../prisma/client.js";
import { HttpError, normalizeText } from "../utils/http.js";

function decorateMedia<T extends { id: string; favorites?: unknown[]; histories?: { progressSeconds: number; durationSeconds: number; percent: number; completed: boolean }[] }>(item: T) {
  const history = item.histories?.[0] ?? null;
  return {
    ...item,
    isFavorite: Boolean(item.favorites?.length),
    watchProgress: history
      ? {
          progressSeconds: history.progressSeconds,
          durationSeconds: history.durationSeconds,
          percent: history.percent,
          completed: history.completed
        }
      : null,
    favorites: undefined,
    histories: undefined
  };
}

function includeForUser(userId: string) {
  return {
    category: true,
    playlist: { select: { id: true, name: true } },
    favorites: { where: { userId }, select: { id: true } },
    histories: { where: { userId }, select: { progressSeconds: true, durationSeconds: true, percent: true, completed: true } }
  } satisfies Prisma.MediaItemInclude;
}

export async function listMedia(userId: string, query: { type?: MediaTypeValue; category?: string; page?: number; limit?: number }) {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 36, 1), 200);
  const where: Prisma.MediaItemWhereInput = { userId };

  if (query.type) where.type = query.type;
  if (query.category) where.category = { name: query.category };

  const [items, total] = await Promise.all([
    prisma.mediaItem.findMany({
      where,
      include: includeForUser(userId),
      orderBy: [{ groupTitle: "asc" }, { title: "asc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.mediaItem.count({ where })
  ]);

  return {
    items: items.map(decorateMedia),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getMedia(userId: string, id: string) {
  const item = await prisma.mediaItem.findFirst({
    where: { id, userId },
    include: includeForUser(userId)
  });

  if (!item) {
    throw new HttpError(404, "Mídia não encontrada.");
  }

  return decorateMedia(item);
}

export async function getCategories(userId: string, type?: MediaTypeValue) {
  return prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
    include: { _count: { select: { mediaItems: true } } }
  });
}

export async function searchMedia(userId: string, q: string) {
  const search = normalizeText(q);
  if (!search) return [];

  const items = await prisma.mediaItem.findMany({
    where: {
      userId,
      OR: [
        { normalizedTitle: { contains: search } },
        { title: { contains: q } },
        { seriesName: { contains: q } },
        { groupTitle: { contains: q } }
      ]
    },
    include: includeForUser(userId),
    orderBy: { title: "asc" },
    take: 80
  });

  return items.map(decorateMedia);
}

export async function getSeries(userId: string) {
  const episodes = await prisma.mediaItem.findMany({
    where: { userId, type: MEDIA_TYPE.SERIES_EPISODE },
    include: includeForUser(userId),
    orderBy: [{ seriesName: "asc" }, { seasonNumber: "asc" }, { episodeNumber: "asc" }, { title: "asc" }]
  });

  const groups = new Map<string, ReturnType<typeof decorateMedia>[]>();
  for (const episode of episodes.map(decorateMedia)) {
    const key = episode.seriesName || episode.title;
    const current = groups.get(key) ?? [];
    current.push(episode);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([seriesName, seriesEpisodes]) => {
    const seasons = new Map<number, typeof seriesEpisodes>();
    for (const episode of seriesEpisodes) {
      const season = episode.seasonNumber ?? 1;
      seasons.set(season, [...(seasons.get(season) ?? []), episode]);
    }

    return {
      seriesName,
      poster: seriesEpisodes.find((episode) => episode.logo)?.logo ?? null,
      totalEpisodes: seriesEpisodes.length,
      watchedEpisodes: seriesEpisodes.filter((episode) => episode.watchProgress?.completed).length,
      seasons: Array.from(seasons.entries()).map(([seasonNumber, episodes]) => ({ seasonNumber, episodes }))
    };
  });
}
