import { Heart, Play, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import type { MediaItem } from "../types";

export function MediaCard({ item, onFavorite }: { item: MediaItem; onFavorite?: (item: MediaItem) => void }) {
  const progress = item.watchProgress?.percent ? Math.round(item.watchProgress.percent * 100) : 0;

  return (
    <div className="tv-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] hover:border-blue-300/50 hover:bg-white/[0.07] focus-within:border-blue-300/50">
      <Link to={`/player/${item.id}`} className="focus-ring block" aria-label={`Assistir ${item.title}`}>
        <div className="aspect-video bg-slate-900">
          {item.logo ? (
            <img src={item.logo} alt="" className="h-full w-full object-cover opacity-85 transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-500">
              <Tv size={42} />
            </div>
          )}
        </div>
        {progress > 0 && progress < 100 ? (
          <div className="h-1 w-full bg-slate-800">
            <div className="h-1 bg-blue-400" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-200">
            <Play size={13} />
            {item.type === "LIVE" ? "Ao vivo" : item.type === "MOVIE" ? "Filme" : `S${item.seasonNumber ?? 1} E${item.episodeNumber ?? "?"}`}
          </div>
          <h3 className="line-clamp-2 min-h-12 text-base font-bold text-white">{item.title}</h3>
          <p className="mt-2 truncate text-xs text-slate-400">{item.category?.name || item.groupTitle || "Sem categoria"}</p>
        </div>
      </Link>
      {onFavorite ? (
        <button
          onClick={() => onFavorite(item)}
          className={`absolute right-3 top-3 rounded-full border border-white/10 p-2 backdrop-blur ${
            item.isFavorite ? "bg-rose-500 text-white" : "bg-slate-950/70 text-slate-200 hover:bg-white/20"
          }`}
          aria-label="Favoritar"
        >
          <Heart size={17} fill={item.isFavorite ? "currentColor" : "none"} />
        </button>
      ) : null}
    </div>
  );
}
