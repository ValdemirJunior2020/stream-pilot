import { MEDIA_TYPE, SYNC_STATUS, type MediaTypeValue } from "../constants/enums.js";
import { prisma } from "../prisma/client.js";
import { HttpError, normalizeText } from "../utils/http.js";
import { parseM3u } from "../utils/m3uParser.js";

export async function createPlaylist(userId: string, input: { name: string; url: string }) {
  return prisma.playlist.create({
    data: {
      userId,
      name: input.name,
      url: input.url
    }
  });
}

export async function listPlaylists(userId: string) {
  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { mediaItems: true } }
    }
  });

  const totals = await prisma.mediaItem.groupBy({
    by: ["type", "playlistId"],
    where: { userId },
    _count: true
  });

  return playlists.map((playlist) => {
    const summary = totals.filter((item) => item.playlistId === playlist.id);
    return {
      ...playlist,
      totals: {
        all: playlist._count.mediaItems,
        live: summary.find((item) => item.type === MEDIA_TYPE.LIVE)?._count ?? 0,
        movies: summary.find((item) => item.type === MEDIA_TYPE.MOVIE)?._count ?? 0,
        seriesEpisodes: summary.find((item) => item.type === MEDIA_TYPE.SERIES_EPISODE)?._count ?? 0
      }
    };
  });
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new HttpError(400, `Não foi possível baixar a playlist. Status ${response.status}.`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function getOrCreateCategory(userId: string, name: string, type: MediaTypeValue) {
  return prisma.category.upsert({
    where: { userId_name_type: { userId, name, type } },
    update: {},
    create: { userId, name, type }
  });
}

export async function syncPlaylist(userId: string, playlistId: string) {
  const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, userId } });
  if (!playlist) {
    throw new HttpError(404, "Playlist não encontrada.");
  }

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { syncStatus: SYNC_STATUS.SYNCING, syncError: null }
  });

  try {
    const content = await fetchText(playlist.url);
    const parsed = parseM3u(content);

    if (parsed.length === 0) {
      throw new HttpError(400, "Nenhum item válido foi encontrado na playlist M3U.");
    }

    const seenUrls = new Set<string>();

    for (const item of parsed) {
      seenUrls.add(item.streamUrl);
      const category = await getOrCreateCategory(userId, item.groupTitle || "Sem categoria", item.type);

      await prisma.mediaItem.upsert({
        where: { playlistId_streamUrl: { playlistId, streamUrl: item.streamUrl } },
        update: {
          title: item.title,
          normalizedTitle: normalizeText(item.title),
          type: item.type,
          tvgId: item.tvgId,
          tvgName: item.tvgName,
          logo: item.logo,
          groupTitle: item.groupTitle,
          seriesName: item.seriesName,
          seasonNumber: item.seasonNumber,
          episodeNumber: item.episodeNumber,
          categoryId: category.id
        },
        create: {
          userId,
          playlistId,
          categoryId: category.id,
          title: item.title,
          normalizedTitle: normalizeText(item.title),
          type: item.type,
          streamUrl: item.streamUrl,
          tvgId: item.tvgId,
          tvgName: item.tvgName,
          logo: item.logo,
          groupTitle: item.groupTitle,
          seriesName: item.seriesName,
          seasonNumber: item.seasonNumber,
          episodeNumber: item.episodeNumber
        }
      });
    }

    await prisma.mediaItem.deleteMany({
      where: {
        playlistId,
        userId,
        streamUrl: { notIn: Array.from(seenUrls) }
      }
    });

    const totals = await prisma.mediaItem.groupBy({
      by: ["type"],
      where: { playlistId, userId },
      _count: true
    });

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: { syncStatus: SYNC_STATUS.SUCCESS, syncError: null, lastSyncAt: new Date() }
    });

    return {
      playlist: updated,
      imported: parsed.length,
      totals: {
        live: totals.find((item) => item.type === MEDIA_TYPE.LIVE)?._count ?? 0,
        movies: totals.find((item) => item.type === MEDIA_TYPE.MOVIE)?._count ?? 0,
        seriesEpisodes: totals.find((item) => item.type === MEDIA_TYPE.SERIES_EPISODE)?._count ?? 0
      }
    };
  } catch (error) {
    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        syncStatus: SYNC_STATUS.FAILED,
        syncError: error instanceof Error ? error.message : "Erro desconhecido ao sincronizar."
      }
    });
    throw error;
  }
}

export async function deletePlaylist(userId: string, playlistId: string) {
  const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, userId } });
  if (!playlist) {
    throw new HttpError(404, "Playlist não encontrada.");
  }

  await prisma.playlist.delete({ where: { id: playlistId } });
  return { ok: true };
}
