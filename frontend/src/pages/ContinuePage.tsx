import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MediaGrid } from "../components/MediaGrid";
import { ErrorState, LoadingState } from "../components/Status";
import { api } from "../services/api";
import type { MediaItem } from "../types";

export function ContinuePage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.history
      .continueWatching()
      .then((history) =>
        setItems(
          history.map((entry) => ({
            ...entry.mediaItem,
            watchProgress: {
              progressSeconds: entry.progressSeconds,
              durationSeconds: entry.durationSeconds,
              percent: entry.percent,
              completed: entry.completed
            }
          }))
        )
      )
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar histórico."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Continuar assistindo" subtitle="Filmes e episódios retomam exatamente onde o usuário parou." />
      {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : <MediaGrid items={items} />}
    </div>
  );
}
