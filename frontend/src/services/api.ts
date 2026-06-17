import type {
  Category,
  EpgProgram,
  FavoriteItem,
  HistoryItem,
  MediaItem,
  MediaPage,
  MediaType,
  Playlist,
  SeriesGroup,
  User
} from "../types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("streampilot_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_URL}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      mode: "cors"
    });
  } catch {
    throw new ApiError(
      0,
      `Não consegui conectar na API usando ${url}. Verifique se o backend está rodando em http://localhost:4000.`
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.message || `Erro HTTP ${response.status}.`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body)
      }),

    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body)
      }),

    me: () => request<User>("/auth/me")
  },

  playlists: {
    list: () => request<Playlist[]>("/playlists"),

    create: (body: { name: string; url: string }) =>
      request<Playlist>("/playlists", {
        method: "POST",
        body: JSON.stringify(body)
      }),

    sync: (id: string) =>
      request<{ imported: number; playlistId: string }>(`/playlists/${id}/sync`, {
        method: "POST"
      }),

    remove: (id: string) =>
      request<{ ok: boolean }>(`/playlists/${id}`, {
        method: "DELETE"
      })
  },

  media: {
    list: (params: { type?: MediaType; category?: string; page?: number; limit?: number }) => {
      const search = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          search.set(key, String(value));
        }
      });

      return request<MediaPage>(`/media?${search.toString()}`);
    },

    get: (id: string) => request<MediaItem>(`/media/${id}`),

    categories: (type?: MediaType) =>
      request<Category[]>(`/media/categories${type ? `?type=${type}` : ""}`),

    search: (q: string) =>
      request<MediaItem[]>(`/media/search?q=${encodeURIComponent(q)}`),

    series: () => request<SeriesGroup[]>("/media/series")
  },

  history: {
    save: (body: { mediaItemId: string; progressSeconds: number; durationSeconds?: number }) =>
      request<HistoryItem>("/history", {
        method: "POST",
        body: JSON.stringify(body)
      }),

    list: () => request<HistoryItem[]>("/history"),

    continueWatching: () => request<HistoryItem[]>("/history/continue-watching")
  },

  favorites: {
    list: () => request<FavoriteItem[]>("/favorites"),

    add: (mediaId: string) =>
      request(`/favorites/${mediaId}`, {
        method: "POST"
      }),

    remove: (mediaId: string) =>
      request(`/favorites/${mediaId}`, {
        method: "DELETE"
      })
  },

  epg: {
    createSource: (body: { name: string; url: string }) =>
      request("/epg/source", {
        method: "POST",
        body: JSON.stringify(body)
      }),

    sync: (sourceId?: string) =>
      request<{ imported: number }>("/epg/sync", {
        method: "POST",
        body: JSON.stringify({ sourceId })
      }),

    channel: (channelId: string) =>
      request<EpgProgram[]>(`/epg/channel/${channelId}`),

    guide: () => request<EpgProgram[]>("/epg/guide")
  }
};