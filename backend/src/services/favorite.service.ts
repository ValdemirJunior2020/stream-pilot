import { prisma } from "../prisma/client.js";
import { HttpError } from "../utils/http.js";

export async function addFavorite(userId: string, mediaId: string) {
  const media = await prisma.mediaItem.findFirst({ where: { id: mediaId, userId } });
  if (!media) throw new HttpError(404, "Mídia não encontrada.");

  return prisma.favorite.upsert({
    where: { userId_mediaItemId: { userId, mediaItemId: mediaId } },
    update: {},
    create: { userId, mediaItemId: mediaId }
  });
}

export async function removeFavorite(userId: string, mediaId: string) {
  await prisma.favorite.deleteMany({ where: { userId, mediaItemId: mediaId } });
  return { ok: true };
}

export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { mediaItem: { include: { category: true } } },
    orderBy: { createdAt: "desc" }
  });
}
