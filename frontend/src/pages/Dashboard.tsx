import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/Status";
import { api } from "../services/api";
import type { Playlist } from "../types";
import { formatDate } from "../utils/format";

export function Dashboard() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [epgName, setEpgName] = useState("");
  const [epgUrl, setEpgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    return playlists.reduce(
      (acc, playlist) => ({
        live: acc.live + (playlist.totals?.live ?? 0),
        movies: acc.movies + (playlist.totals?.movies ?? 0),
        series: acc.series + (playlist.totals?.seriesEpisodes ?? 0)
      }),
      { live: 0, movies: 0, series: 0 }
    );
  }, [playlists]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPlaylists(await api.playlists.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addPlaylist(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.playlists.create({ name, url });
      setName("");
      setUrl("");
      setMessage("Playlist cadastrada. Agora clique em sincronizar.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar playlist.");
    }
  }

  async function syncPlaylist(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const result = await api.playlists.sync(id);
      setMessage(`Sincronização concluída. Itens importados: ${result.imported}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar.");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function removePlaylist(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.playlists.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover playlist.");
    } finally {
      setBusyId(null);
    }
  }

  async function addEpg(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.epg.createSource({ name: epgName, url: epgUrl });
      const result = await api.epg.sync();
      setEpgName("");
      setEpgUrl("");
      setMessage(`EPG cadastrado e sincronizado. Programas importados: ${result.imported}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no EPG.");
    }
  }

  return (
    <div>
      <PageHeader title="Painel do usuário" subtitle="Gerencie suas playlists M3U autorizadas, fontes XMLTV próprias e acompanhe os totais sincronizados." />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label="Canais" value={totals.live} />
        <Stat label="Filmes" value={totals.movies} />
        <Stat label="Episódios" value={totals.series} />
      </div>

      {error ? <div className="mb-5"><ErrorState message={error} /></div> : null}
      {message ? <div className="mb-5 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section>
          {loading ? <LoadingState /> : playlists.length ? (
            <div className="space-y-4">
              {playlists.map((playlist) => (
                <article key={playlist.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white">{playlist.name}</h3>
                      <p className="mt-1 truncate text-sm text-slate-400">{playlist.url}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">Status: {playlist.syncStatus}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">Última sync: {formatDate(playlist.lastSyncAt)}</span>
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-100">Total: {playlist.totals?.all ?? 0}</span>
                      </div>
                      {playlist.syncError ? <p className="mt-3 text-sm text-red-200">{playlist.syncError}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => syncPlaylist(playlist.id)}
                        disabled={busyId === playlist.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-60"
                      >
                        <RefreshCcw size={17} />
                        Sincronizar
                      </button>
                      <button
                        onClick={() => removePlaylist(playlist.id)}
                        disabled={busyId === playlist.id}
                        className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100 hover:bg-red-500/20 disabled:opacity-60"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma playlist cadastrada" description="Cadastre uma URL M3U autorizada para começar." />
          )}
        </section>

        <aside className="space-y-5">
          <form onSubmit={addPlaylist} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Adicionar M3U</h2>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da playlist" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" required />
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://sua-url-autorizada/lista.m3u" className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" required />
            <button className="mt-4 w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-400">Cadastrar playlist</button>
          </form>

          <form onSubmit={addEpg} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Adicionar XMLTV</h2>
            <input value={epgName} onChange={(event) => setEpgName(event.target.value)} placeholder="Nome do EPG" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" required />
            <input value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} placeholder="https://sua-url-autorizada/epg.xml" className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" required />
            <button className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15">Cadastrar e sincronizar EPG</button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-black text-white">{value}</p>
    </div>
  );
}
