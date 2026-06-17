import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MediaGrid } from "../components/MediaGrid";
import { ErrorState, LoadingState } from "../components/Status";
import { api } from "../services/api";
import type { Category, MediaItem, MediaType } from "../types";

type Props = {
  title: string;
  type: MediaType;
};

export function MediaListPage({ title, type }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [media, cats] = await Promise.all([
        api.media.list({ type, category, limit: 80 }),
        api.media.categories(type)
      ]);
      setItems(media.items);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mídia.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type, category]);

  async function toggleFavorite(item: MediaItem) {
    try {
      if (item.isFavorite) await api.favorites.remove(item.id);
      else await api.favorites.add(item.id);
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, isFavorite: !entry.isFavorite } : entry)));
    } catch {
      // UI optimistic failure intentionally silent for TV flow.
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle="Cards grandes, filtros por categoria e navegação simples para controle remoto."
        action={
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white">
            <option value="">Todas categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name} ({cat._count?.mediaItems ?? 0})</option>
            ))}
          </select>
        }
      />
      {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : <MediaGrid items={items} onFavorite={toggleFavorite} />}
    </div>
  );
}
