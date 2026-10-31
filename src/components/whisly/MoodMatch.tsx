import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { StoryCard, type FeedStory } from "@/components/whisly/StoryCard";
import { useI18n } from "@/lib/i18n";
import { recommendStoriesForMood } from "@/lib/mood.functions";
import { loadStories, toggleLike, toggleSave } from "@/lib/stories";

/** "How are you feeling?" panel: AI picks stories from the listener's country. */
export function MoodMatch({ country, viewerId }: { country: string; viewerId: string }) {
  const { t } = useI18n();
  const recommend = useServerFn(recommendStoriesForMood);
  const [feeling, setFeeling] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FeedStory[] | null>(null);

  async function run() {
    if (feeling.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const r = await recommend({ data: { feeling } });
      if (r.error) return setError(r.error);
      const all = r.ids.length ? await loadStories({ country, category: "all", viewerId }) : [];
      const byId = new Map(all.map((s) => [s.id, s]));
      setResults(r.ids.map((id) => byId.get(id)).filter((s): s is FeedStory => !!s));
    } catch {
      setError("Couldn't get recommendations right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
        <Sparkles className="size-5" /> {t("moodTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("moodHint")}</p>
      <textarea
        value={feeling}
        onChange={(e) => setFeeling(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder={t("moodPlaceholder")}
        className="mt-3 w-full resize-none rounded-2xl border border-input bg-muted/60 px-4 py-3 text-[15px] outline-none focus:border-primary"
      />
      <button
        onClick={run}
        disabled={loading || feeling.trim().length < 3}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-cta py-3 font-semibold text-primary-foreground shadow-glow transition disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />} {t("moodFind")}
      </button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {results && results.length === 0 && !error && <p className="mt-3 text-sm text-muted-foreground">{t("moodNone")}</p>}
      {results && results.length > 0 && (
        <div className="mt-4 space-y-4">
          {results.map((s) => (
            <StoryCard key={s.id} story={s} isOwner={s.user_id === viewerId} viewerId={viewerId} onLike={() => {
                toggleLike(s, viewerId).catch(() => {});
                setResults((rs) => rs?.map((x) => (x.id === s.id ? { ...x, liked: !x.liked, likes_count: x.likes_count + (x.liked ? -1 : 1) } : x)) ?? null);
              }}
              onSave={() => {
                toggleSave(s, viewerId).catch(() => {});
                setResults((rs) => rs?.map((x) => (x.id === s.id ? { ...x, saved: !x.saved } : x)) ?? null);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
