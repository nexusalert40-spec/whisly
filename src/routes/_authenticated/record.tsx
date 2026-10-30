import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleHelp, Clock, FileText, Loader2, Mic, Play, Pause, RotateCw, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/whisly/Logo";
import { fmt } from "@/components/whisly/AudioPlayer";
import { useProfile } from "@/hooks/use-profile";
import { MAX_RECORDING_SECONDS } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/record")({
  head: () => ({
    meta: [
      { title: "Create your voice — Whisly" },
      { name: "description", content: "Record a voice story up to five minutes long." },
      { property: "og:title", content: "Create your voice — Whisly" },
      { property: "og:description", content: "Record a voice story up to five minutes long." },
    ],
  }),
  component: RecordPage,
});

type Phase = "idle" | "recording" | "recorded";
const CATS = ["love", "life", "other"] as const;
const LEFT = [0.25, 0.45, 0.7, 1, 0.7, 0.45];

function pickMime() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

function RecordPage() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATS)[number]>("life");
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => () => cleanup(), []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function cleanup() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    rec.current?.stream.getTracks().forEach((t) => t.stop());
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return toast.error("Recording isn't supported in this browser");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        const b = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        setPhase("recorded");
        cleanup();
      };
      rec.current = r;
      r.start(250);
      setSeconds(0);
      setPhase("recording");
      timer.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORDING_SECONDS) {
            rec.current?.state === "recording" && rec.current.stop();
            toast("Reached the 5:00 limit");
          }
          return Math.min(s + 1, MAX_RECORDING_SECONDS);
        });
      }, 1000);
    } catch {
      toast.error("Microphone access was denied");
    }
  }

  function stop() {
    if (rec.current?.state === "recording") rec.current.stop();
  }

  function reset() {
    audio.current?.pause();
    setPlaying(false);
    setBlob(null);
    setUrl(undefined);
    setSeconds(0);
    setPhase("idle");
  }

  function togglePlay() {
    const a = audio.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().then(() => setPlaying(true)).catch(() => toast.error("Can't play this recording"));
  }

  async function publish() {
    if (!profile || !blob) return toast.error("Record your story first");
    const t = title.trim();
    if (t.length < 2 || t.length > 120) return toast.error("Give your story a title (2–120 characters)");
    if (seconds < 2) return toast.error("Recording is too short");
    setPublishing(true);
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("audio").upload(path, blob, { contentType: blob.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("stories").insert({
        user_id: profile.id,
        title: t,
        audio_url: path,
        category,
        duration_seconds: Math.min(seconds, MAX_RECORDING_SECONDS),
      });
      if (error) {
        await supabase.storage.from("audio").remove([path]);
        throw error;
      }
      toast.success("Your story is live!");
      qc.invalidateQueries({ queryKey: ["feed"] });
      navigate({ to: "/feed" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publishing failed");
      setPublishing(false);
    }
  }

  const recording = phase === "recording";
  const pct = (seconds / MAX_RECORDING_SECONDS) * 100;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/feed" aria-label="Back" className="text-primary">
            <ArrowLeft className="size-7" />
          </Link>
          <Logo />
        </div>
        <CircleHelp className="size-7 text-foreground" />
      </header>

      <h1 className="mt-6 text-center text-4xl font-bold">Create your voice</h1>
      <p className="mt-1 text-center text-lg text-muted-foreground">Share your story, your voice.</p>

      <label className="mt-6 flex items-center gap-3 rounded-3xl bg-card px-4 py-4 shadow-soft">
        <FileText className="size-6 text-secondary-foreground" />
        <input
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a title"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-4 flex justify-center gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium capitalize",
              category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Bars values={LEFT} active={recording} className="bg-brand-pink/60" />
        <button
          onClick={phase === "idle" ? start : recording ? stop : undefined}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className="relative flex size-36 items-center justify-center rounded-full bg-accent/60"
        >
          <span className={cn("absolute inset-3 rounded-full bg-gradient-orb shadow-glow", recording && "animate-pulse")} />
          <Mic className="relative size-14 text-primary-foreground" />
        </button>
        <Bars values={[...LEFT].reverse()} active={recording} className="bg-brand-blue/60" />
      </div>
      <p className="mt-3 text-center font-medium text-muted-foreground">
        {phase === "idle" ? "Tap to record" : recording ? "Recording…" : "Recording ready"}
      </p>

      <div className="mt-5 flex items-center justify-center gap-3 text-xl font-semibold">
        <Clock className="size-6" /> {fmt(seconds).padStart(5, "0")} / 05:00
      </div>
      <div className="relative mx-2 mt-4 h-2 rounded-full bg-accent">
        <div className="h-2 rounded-full bg-gradient-cta" style={{ width: `${pct}%` }} />
        <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${pct}%` }} />
      </div>

      <audio ref={audio} src={url} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} />

      <div className="mx-auto mt-6 max-w-xs space-y-3">
        <button
          onClick={recording ? stop : start}
          disabled={phase === "recorded"}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-cta text-xl font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {recording ? <><Square className="size-6" fill="currentColor" /> Stop</> : <><Mic className="size-6" /> Record</>}
        </button>
        <button
          onClick={togglePlay}
          disabled={!url}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-secondary text-xl font-semibold text-secondary-foreground disabled:opacity-50"
        >
          {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6" fill="currentColor" />}
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button onClick={reset} disabled={phase !== "recorded"} className="flex h-14 items-center justify-center gap-3 rounded-full bg-secondary text-lg font-semibold text-secondary-foreground disabled:opacity-50">
          <Trash2 className="size-6" /> Delete
        </button>
        <button
          onClick={() => { reset(); setTimeout(start, 50); }}
          disabled={phase !== "recorded"}
          className="flex h-14 items-center justify-center gap-3 rounded-full bg-secondary text-lg font-semibold text-secondary-foreground disabled:opacity-50"
        >
          <RotateCw className="size-6" /> Re-record
        </button>
      </div>
      <button
        onClick={publish}
        disabled={phase !== "recorded" || publishing}
        className="mt-4 flex h-15 w-full items-center justify-center gap-3 rounded-full bg-gradient-brand text-xl font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
      >
        {publishing ? <Loader2 className="size-6 animate-spin" /> : <Send className="size-6" />} Publish
      </button>
    </main>
  );
}

function Bars({ values, active, className }: { values: number[]; active: boolean; className: string }) {
  return (
    <div className="flex h-20 items-center gap-1.5">
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("w-1.5 rounded-full", className, active && "animate-bar")}
          style={{ height: `${v * 100}%`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
