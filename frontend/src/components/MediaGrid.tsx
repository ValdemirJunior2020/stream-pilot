import type { MediaItem } from "../types";
import { MediaCard } from "./MediaCard";
import { EmptyState } from "./Status";

export function MediaGrid({ items, onFavorite }: { items: MediaItem[]; onFavorite?: (item: MediaItem) => void }) {
  if (!items.length) {
    return <EmptyState title="Nada encontrado" description="Cadastre e sincronize uma playlist autorizada para ver conteúdo aqui." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} onFavorite={onFavorite} />
      ))}
    </div>
  );
}
