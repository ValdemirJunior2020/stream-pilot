import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MediaGrid } from "../components/MediaGrid";
import { ErrorState, LoadingState } from "../components/Status";
import { api } from "../services/api";
import type { MediaItem } from "../types";

export function FavoritesPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const favorites = await api.favorites.list();
      setItems(favorites.map((favorite) => ({ ...favorite.mediaItem, isFavorite: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar favoritos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleFavorite(item: MediaItem) {
    await api.favorites.remove(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return (
    <div>
      <PageHeader title="Meus Favoritos" subtitle="Tudo que o usuário salvou em um só lugar." />
      {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : <MediaGrid items={items} onFavorite={toggleFavorite} />}
    </div>
  );
}
