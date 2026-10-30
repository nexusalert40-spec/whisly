import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function fmt(s: number) {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** Deterministic pseudo-waveform from a seed string. */
function bars(seed: string, n = 42) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return 0.2 + ((h >>> 16) % 100) / 125;
  });
}

export function AudioPlayer({ src, seed, duration, onFirstPlay }: { src?: string | undefined; seed: string; duration: number; onFirstPlay?: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(duration);
  const counted = useRef(false);
  const wave = useMemo(() => bars(seed), [seed]);
  const pct = dur ? Math.min(1, time / dur) : 0;

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => Number.isFinite(a.duration) && a.duration > 0 && setDur(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const a = ref.current;
    if (!a || !src) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      // Pause any other playing story.
      document.querySelectorAll("audio").forEach((el) => el !== a && el.pause());
      if (!counted.current) { counted.current = true; onFirstPlay?.(); }
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = ref.current;
    if (!a || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * dur;
  }

  return (
    <div className="flex items-center gap-3 rounded-3xl bg-soft px-3 py-3">
      <audio ref={ref} src={src} preload="metadata" onPause={() => setPlaying(false)} />
      <button
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? "Pause" : "Play"}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="ml-0.5 size-6" fill="currentColor" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex h-6 items-center gap-[2px]" onClick={seek}>
          {wave.map((v, i) => (
            <span
              key={i}
              style={{ height: `${v * 100}%` }}
              className={cn("w-[3px] rounded-full", i / wave.length < pct ? "bg-primary" : "bg-wave")}
            />
          ))}
        </div>
        <div className="relative mt-2 h-1 rounded-full bg-accent" onClick={seek}>
          <div className="h-1 rounded-full bg-primary" style={{ width: `${pct * 100}%` }} />
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${pct * 100}%` }}
          />
        </div>
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground">
        {fmt(playing || time ? time : dur)}
      </span>
    </div>
  );
}
