import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PlayerVideo } from "../components/PlayerVideo";
import { ErrorState, LoadingState } from "../components/Status";
import { api } from "../services/api";
import type { EpgProgram, MediaItem } from "../types";
import { programTime } from "../utils/format";

export function PlayerPage() {
  const { id } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [programs, setPrograms] = useState<EpgProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    api.media
      .get(id)
      .then(async (media) => {
        if (!mounted) return;
        setItem(media);
        if (media.type === "LIVE") {
          const epg = await api.epg.channel(media.id).catch(() => []);
          if (mounted) setPrograms(epg);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar player."))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  async function toggleFavorite() {
    if (!item) return;
    if (item.isFavorite) await api.favorites.remove(item.id);
    else await api.favorites.add(item.id);
    setItem({ ...item, isFavorite: !item.isFavorite });
  }

  if (loading) return <LoadingState label="Preparando player..." />;
  if (error) return <ErrorState message={error} />;
  if (!item) return <ErrorState message="Mídia não encontrada." />;

  const currentProgram = programs.find((program) => new Date(program.start) <= new Date() && new Date(program.end) >= new Date());
  const nextProgram = programs.find((program) => new Date(program.start) > new Date());

  return (
    <div>
      <PageHeader
        title={item.title}
        subtitle={[item.category?.name, item.seriesName, item.type === "LIVE" ? "Ao vivo" : null].filter(Boolean).join(" • ")}
        action={
          <button onClick={toggleFavorite} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/15">
            <Heart size={18} fill={item.isFavorite ? "currentColor" : "none"} />
            {item.isFavorite ? "Favorito" : "Favoritar"}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <PlayerVideo item={item} />

        <aside className="space-y-4">
          {item.watchProgress && item.type !== "LIVE" ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white">Continuar assistindo</h3>
              <p className="mt-2 text-sm text-slate-400">Progresso salvo: {Math.round(item.watchProgress.percent * 100)}%</p>
            </div>
          ) : null}

          {item.type === "LIVE" ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white">Programação</h3>
              {currentProgram ? (
                <div className="mt-4 rounded-2xl bg-blue-500/10 p-4">
                  <p className="text-xs font-bold text-blue-200">Agora • {programTime(currentProgram.start, currentProgram.end)}</p>
                  <p className="mt-1 font-semibold text-white">{currentProgram.title}</p>
                </div>
              ) : <p className="mt-3 text-sm text-slate-400">Programa atual não encontrado.</p>}
              {nextProgram ? (
                <div className="mt-3 rounded-2xl bg-slate-950/60 p-4">
                  <p className="text-xs font-bold text-slate-400">Próximo • {programTime(nextProgram.start, nextProgram.end)}</p>
                  <p className="mt-1 font-semibold text-white">{nextProgram.title}</p>
                </div>
              ) : null}
              <Link to="/guide" className="mt-4 inline-block text-sm font-bold text-blue-300">Ver guia completo</Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
