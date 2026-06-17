import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState, EmptyState } from "../components/Status";
import { api } from "../services/api";
import type { SeriesGroup } from "../types";

export function SeriesPage() {
  const [series, setSeries] = useState<SeriesGroup[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.media
      .series()
      .then(setSeries)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar séries."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Séries" subtitle="Agrupamento por nome da série, temporadas e episódios com indicador de assistido." />
      {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : !series.length ? (
        <EmptyState title="Nenhuma série encontrada" description="Sincronize uma playlist autorizada com episódios identificados como S01E01 ou 1x01." />
      ) : (
        <div className="space-y-4">
          {series.map((group) => (
            <article key={group.seriesName} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <button onClick={() => setOpen(open === group.seriesName ? null : group.seriesName)} className="flex w-full items-center gap-4 text-left">
                <div className="h-20 w-32 flex-none overflow-hidden rounded-2xl bg-slate-900">
                  {group.poster ? <img src={group.poster} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black text-white">{group.seriesName}</h2>
                  <p className="mt-1 text-sm text-slate-400">{group.watchedEpisodes}/{group.totalEpisodes} episódios assistidos</p>
                </div>
              </button>

              {open === group.seriesName ? (
                <div className="mt-5 space-y-5">
                  {group.seasons.map((season) => (
                    <section key={season.seasonNumber}>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-200">Temporada {season.seasonNumber}</h3>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {season.episodes.map((episode) => (
                          <Link key={episode.id} to={`/player/${episode.id}`} className="tv-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 hover:border-blue-300/50">
                            <p className="text-xs font-bold text-blue-200">Episódio {episode.episodeNumber ?? "?"}</p>
                            <p className="mt-1 line-clamp-2 font-semibold text-white">{episode.title}</p>
                            <p className="mt-2 text-xs text-slate-400">{episode.watchProgress?.completed ? "Assistido" : episode.watchProgress ? "Em andamento" : "Não assistido"}</p>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
