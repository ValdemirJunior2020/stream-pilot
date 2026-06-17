export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
      <span className="ml-3">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">{message}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}
