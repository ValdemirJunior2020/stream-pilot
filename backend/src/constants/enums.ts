export const MEDIA_TYPE = {
  LIVE: "LIVE",
  MOVIE: "MOVIE",
  SERIES_EPISODE: "SERIES_EPISODE"
} as const;

export type MediaTypeValue = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

export const MEDIA_TYPE_VALUES = [
  MEDIA_TYPE.LIVE,
  MEDIA_TYPE.MOVIE,
  MEDIA_TYPE.SERIES_EPISODE
] as const;

export const SYNC_STATUS = {
  NEVER: "NEVER",
  SYNCING: "SYNCING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
} as const;

export type SyncStatusValue = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];