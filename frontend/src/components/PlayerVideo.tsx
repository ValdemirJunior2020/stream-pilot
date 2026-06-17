import Hls from "hls.js";
import { Maximize, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { MediaItem } from "../types";
import { formatTime } from "../utils/format";

type Props = {
  item: MediaItem;
};

export function PlayerVideo({ item }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [current, setCurrent] = useState(item.watchProgress?.progressSeconds || 0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setError(null);

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: item.type === "LIVE" });
      hls.loadSource(item.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Não foi possível carregar este stream. Verifique a URL da sua playlist autorizada.");
          hls?.destroy();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = item.streamUrl;
    } else {
      setError("Este navegador não suporta reprodução HLS.");
    }

    return () => {
      hls?.destroy();
    };
  }, [item.id, item.streamUrl, item.type]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type === "LIVE") return;

    const saved = item.watchProgress?.progressSeconds || 0;
    const onLoaded = () => {
      if (saved > 10 && saved < (video.duration || Infinity) - 15) {
        video.currentTime = saved;
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [item.id, item.type, item.watchProgress?.progressSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = window.setInterval(() => {
      if (!video.paused && item.type !== "LIVE") {
        api.history
          .save({
            mediaItemId: item.id,
            progressSeconds: Math.floor(video.currentTime),
            durationSeconds: Number.isFinite(video.duration) ? Math.floor(video.duration) : 0
          })
          .catch(() => undefined);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [item.id, item.type]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrent(video.currentTime);
    if (Number.isFinite(video.duration)) setDuration(video.duration);
  }

  function handleFullscreen() {
    videoRef.current?.requestFullscreen?.();
  }

  function handlePause() {
    setIsPlaying(false);
    const video = videoRef.current;
    if (video && item.type !== "LIVE") {
      api.history
        .save({
          mediaItemId: item.id,
          progressSeconds: Math.floor(video.currentTime),
          durationSeconds: Number.isFinite(video.duration) ? Math.floor(video.duration) : 0
        })
        .catch(() => undefined);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="h-full w-full"
          playsInline
          controls={false}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onPlay={() => setIsPlaying(true)}
          onError={() => setError("Erro ao reproduzir. Confirme se a URL do stream está ativa e autorizada.")}
        />
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8 text-center text-red-100">
            <div>
              <p className="text-lg font-bold">Stream indisponível</p>
              <p className="mt-2 max-w-xl text-sm text-slate-300">{error}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 bg-slate-950 p-4">
        {item.type !== "LIVE" ? (
          <div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={current}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (videoRef.current) videoRef.current.currentTime = value;
                setCurrent(value);
              }}
              className="w-full accent-blue-400"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{formatTime(current)}</span>
              <span>{duration ? formatTime(duration) : "--:--"}</span>
            </div>
          </div>
        ) : (
          <div className="inline-flex rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-100">Ao vivo</div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={togglePlayback} className="rounded-2xl bg-blue-500 px-5 py-3 font-bold text-white hover:bg-blue-400">
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
            <Volume2 size={18} />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-28 accent-blue-400"
            />
          </label>

          <button onClick={handleFullscreen} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 hover:bg-white/10">
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
