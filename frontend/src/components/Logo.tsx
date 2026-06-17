export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/streampilot-logo.svg"
        alt="StreamPilot"
        className="h-12 w-12 rounded-2xl object-contain shadow-lg shadow-blue-500/10"
      />
      <div>
        <p className="text-xl font-black leading-none text-white">StreamPilot</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">M3U / XMLTV autorizado</p>
      </div>
    </div>
  );
}
