export function formatDate(value?: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatTime(seconds = 0) {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function programTime(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}
