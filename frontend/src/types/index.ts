export type MediaType = "LIVE" | "MOVIE" | "SERIES_EPISODE";
export type SyncStatus = "NEVER" | "SYNCING" | "SUCCESS" | "FAILED";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  url: string;
  lastSyncAt?: string | null;
  syncStatus: SyncStatus;
  syncError?: string | null;
  totals?: {
    all: number;
    live: number;
    movies: number;
    seriesEpisodes: number;
  };
};

export type Category = {
  id: string;
  name: string;
  type: MediaType;
  _count?: { mediaItems: number };
};

export type WatchProgress = {
  progressSeconds: number;
  durationSeconds: number;
  percent: number;
  completed: boolean;
};

export type MediaItem = {
  id: string;
  title: string;
  normalizedTitle: string;
  type: MediaType;
  streamUrl: string;
  tvgId?: string | null;
  tvgName?: string | null;
  logo?: string | null;
  groupTitle?: string | null;
  seriesName?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  category?: Category | null;
  isFavorite?: boolean;
  watchProgress?: WatchProgress | null;
};

export type MediaPage = {
  items: MediaItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type HistoryItem = {
  id: string;
  progressSeconds: number;
  durationSeconds: number;
  percent: number;
  completed: boolean;
  lastWatchedAt: string;
  mediaItem: MediaItem;
};

export type FavoriteItem = {
  id: string;
  createdAt: string;
  mediaItem: MediaItem;
};

export type SeriesGroup = {
  seriesName: string;
  poster?: string | null;
  totalEpisodes: number;
  watchedEpisodes: number;
  seasons: {
    seasonNumber: number;
    episodes: MediaItem[];
  }[];
};

export type EpgProgram = {
  id: string;
  channelId: string;
  mediaItemId?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  start: string;
  end: string;
  mediaItem?: Pick<MediaItem, "id" | "title" | "logo"> | null;
};
