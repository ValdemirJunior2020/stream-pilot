import { MEDIA_TYPE } from "../constants/enums.js";
import { prisma } from "../prisma/client.js";
import { HttpError } from "../utils/http.js";

export async function saveHistory(
  userId: string,
  input: { mediaItemId: string; progressSeconds: number; durationSeconds?: number }
) {
  const media = await prisma.mediaItem.findFirst({ where: { id: input.mediaItemId, userId } });
  if (!media) {
    throw new HttpError(404, "Mídia não encontrada.");
  }

  const durationSeconds = Math.max(input.durationSeconds ?? 0, 0);
  const progressSeconds = Math.max(input.progressSeconds, 0);
  const percent = durationSeconds > 0 ? Math.min(progressSeconds / durationSeconds, 1) : 0;
  const completed = media.type !== MEDIA_TYPE.LIVE && percent >= 0.9;

  return prisma.watchHistory.upsert({
    where: { userId_mediaItemId: { userId, mediaItemId: input.mediaItemId } },
    update: {
      progressSeconds,
      durationSeconds,
      percent,
      completed,
      lastWatchedAt: new Date()
    },
    create: {
      userId,
      mediaItemId: input.mediaItemId,
      progressSeconds,
      durationSeconds,
      percent,
      completed,
      lastWatchedAt: new Date()
    },
    include: { mediaItem: true }
  });
}

export async function getHistory(userId: string) {
  return prisma.watchHistory.findMany({
    where: { userId },
    include: { mediaItem: { include: { category: true } } },
    orderBy: { lastWatchedAt: "desc" },
    take: 100
  });
}

export async function getContinueWatching(userId: string) {
  return prisma.watchHistory.findMany({
    where: {
      userId,
      completed: false,
      mediaItem: { type: { in: [MEDIA_TYPE.MOVIE, MEDIA_TYPE.SERIES_EPISODE] } },
      progressSeconds: { gt: 0 }
    },
    include: { mediaItem: { include: { category: true } } },
    orderBy: { lastWatchedAt: "desc" },
    take: 30
  });
}

export async function getNextEpisode(userId: string, mediaItemId: string) {
  const current = await prisma.mediaItem.findFirst({ where: { id: mediaItemId, userId } });
  if (!current || current.type !== MEDIA_TYPE.SERIES_EPISODE || !current.seriesName) return null;

  const next = await prisma.mediaItem.findFirst({
    where: {
      userId,
      type: MEDIA_TYPE.SERIES_EPISODE,
      seriesName: current.seriesName,
      OR: [
        {
          seasonNumber: current.seasonNumber,
          episodeNumber: { gt: current.episodeNumber ?? 0 }
        },
        {
          seasonNumber: { gt: current.seasonNumber ?? 0 }
        }
      ]
    },
    orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }]
  });

  return next;
}
