import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState, EmptyState } from "../components/Status";
import { api } from "../services/api";
import type { EpgProgram } from "../types";
import { programTime } from "../utils/format";

export function GuidePage() {
  const [programs, setPrograms] = useState<EpgProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.epg
      .guide()
      .then(setPrograms)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar guia."))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return programs.reduce<Record<string, EpgProgram[]>>((acc, program) => {
      const key = program.mediaItem?.title || program.channelId;
      acc[key] = [...(acc[key] || []), program];
      return acc;
    }, {});
  }, [programs]);

  return (
    <div>
      <PageHeader title="Guia de programação" subtitle="Base inicial para XMLTV: programa atual, próximos programas e associação com canais pelo tvg-id." />
      {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : !programs.length ? (
        <EmptyState title="Nenhuma programação encontrada" description="Cadastre uma fonte XMLTV autorizada no painel e sincronize o EPG." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([channel, items]) => (
            <section key={channel} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">{channel}</h2>
                {items[0].mediaItem?.id ? <Link className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-bold text-white" to={`/player/${items[0].mediaItem.id}`}>Assistir</Link> : null}
              </div>
              <div className="space-y-2">
                {items.map((program) => (
                  <div key={program.id} className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-xs font-bold text-blue-200">{programTime(program.start, program.end)}</p>
                    <p className="mt-1 font-semibold text-white">{program.title}</p>
                    {program.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-400">{program.description}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
