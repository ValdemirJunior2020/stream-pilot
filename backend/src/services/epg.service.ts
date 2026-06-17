import { SYNC_STATUS } from "../constants/enums.js";
import { prisma } from "../prisma/client.js";
import { HttpError } from "../utils/http.js";
import { parseXmltv } from "../utils/epgParser.js";

export async function createEpgSource(userId: string, input: { name: string; url: string }) {
  return prisma.epgSource.create({
    data: { userId, name: input.name, url: input.url }
  });
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new HttpError(400, `Não foi possível baixar o XMLTV. Status ${response.status}.`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncEpg(userId: string, sourceId?: string) {
  const sources = await prisma.epgSource.findMany({
    where: { userId, ...(sourceId ? { id: sourceId } : {}) }
  });

  if (sources.length === 0) {
    throw new HttpError(404, "Nenhuma fonte EPG encontrada.");
  }

  let imported = 0;

  for (const source of sources) {
    await prisma.epgSource.update({ where: { id: source.id }, data: { syncStatus: SYNC_STATUS.SYNCING, syncError: null } });

    try {
      const xml = await fetchText(source.url);
      const programs = parseXmltv(xml);

      if (sourceId) {
        await prisma.epgProgram.deleteMany({ where: { userId } });
      }

      for (const program of programs) {
        const media = await prisma.mediaItem.findFirst({
          where: {
            userId,
            OR: [{ tvgId: program.channelId }, { tvgName: program.channelId }, { title: { contains: program.channelId } }]
          },
          select: { id: true }
        });

        await prisma.epgProgram.create({
          data: {
            userId,
            mediaItemId: media?.id,
            channelId: program.channelId,
            title: program.title,
            description: program.description,
            category: program.category,
            start: program.start,
            end: program.end
          }
        });
        imported += 1;
      }

      await prisma.epgSource.update({
        where: { id: source.id },
        data: { syncStatus: SYNC_STATUS.SUCCESS, syncError: null, lastSyncAt: new Date() }
      });
    } catch (error) {
      await prisma.epgSource.update({
        where: { id: source.id },
        data: {
          syncStatus: SYNC_STATUS.FAILED,
          syncError: error instanceof Error ? error.message : "Erro desconhecido ao sincronizar EPG."
        }
      });
      throw error;
    }
  }

  return { imported };
}

export async function getChannelEpg(userId: string, channelId: string) {
  const now = new Date();
  const later = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  return prisma.epgProgram.findMany({
    where: {
      userId,
      OR: [{ mediaItemId: channelId }, { channelId }],
      end: { gte: now },
      start: { lte: later }
    },
    orderBy: { start: "asc" },
    take: 100
  });
}

export async function getGuide(userId: string) {
  const now = new Date();
  const later = new Date(now.getTime() + 1000 * 60 * 60 * 8);

  return prisma.epgProgram.findMany({
    where: { userId, end: { gte: now }, start: { lte: later } },
    include: { mediaItem: { select: { id: true, title: true, logo: true } } },
    orderBy: [{ channelId: "asc" }, { start: "asc" }],
    take: 500
  });
}
