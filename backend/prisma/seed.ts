import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const MEDIA_TYPE = {
  LIVE: "LIVE",
  MOVIE: "MOVIE",
  SERIES_EPISODE: "SERIES_EPISODE"
} as const;

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo123456!", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@streampilot.local" },
    update: {},
    create: {
      email: "demo@streampilot.local",
      name: "StreamPilot Demo",
      passwordHash
    }
  });

  const playlist = await prisma.playlist.upsert({
    where: { id: "demo-playlist" },
    update: {},
    create: {
      id: "demo-playlist",
      userId: user.id,
      name: "Playlist fictícia demo",
      url: "https://example.invalid/authorized-demo.m3u"
    }
  });

  const liveCategory = await prisma.category.upsert({
    where: { userId_name_type: { userId: user.id, name: "Canais Demo", type: MEDIA_TYPE.LIVE } },
    update: {},
    create: { userId: user.id, name: "Canais Demo", type: MEDIA_TYPE.LIVE }
  });

  const movieCategory = await prisma.category.upsert({
    where: { userId_name_type: { userId: user.id, name: "Filmes Demo", type: MEDIA_TYPE.MOVIE } },
    update: {},
    create: { userId: user.id, name: "Filmes Demo", type: MEDIA_TYPE.MOVIE }
  });

  await prisma.mediaItem.upsert({
    where: { playlistId_streamUrl: { playlistId: playlist.id, streamUrl: "https://example.invalid/live/demo-channel.m3u8" } },
    update: {},
    create: {
      userId: user.id,
      playlistId: playlist.id,
      categoryId: liveCategory.id,
      title: "Canal Demo Legal",
      normalizedTitle: "canal demo legal",
      type: MEDIA_TYPE.LIVE,
      streamUrl: "https://example.invalid/live/demo-channel.m3u8",
      tvgId: "demo.channel",
      tvgName: "Canal Demo Legal",
      groupTitle: "Canais Demo"
    }
  });

  await prisma.mediaItem.upsert({
    where: { playlistId_streamUrl: { playlistId: playlist.id, streamUrl: "https://example.invalid/movies/demo-movie.m3u8" } },
    update: {},
    create: {
      userId: user.id,
      playlistId: playlist.id,
      categoryId: movieCategory.id,
      title: "Filme Demo Legal",
      normalizedTitle: "filme demo legal",
      type: MEDIA_TYPE.MOVIE,
      streamUrl: "https://example.invalid/movies/demo-movie.m3u8",
      groupTitle: "Filmes Demo"
    }
  });

  console.log("Seed concluído. Login demo: demo@streampilot.local / Demo123456!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
