import { FormEvent, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MediaGrid } from "../components/MediaGrid";
import { ErrorState, LoadingState, EmptyState } from "../components/Status";
import { api } from "../services/api";
import type { MediaItem } from "../types";

export function SearchPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setItems(await api.media.search(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Busca" subtitle="Encontre canais, filmes, séries, categorias ou nomes de episódios." />
      <form onSubmit={submit} className="mb-6 flex gap-3">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar..." className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-white" />
        <button className="rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white hover:bg-blue-400">Buscar</button>
      </form>
      {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : searched ? <MediaGrid items={items} /> : <EmptyState title="Digite algo para buscar" />}
    </div>
  );
}
