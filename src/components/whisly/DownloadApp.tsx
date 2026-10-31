import { useEffect, useState } from "react";
import { Apple, Download, Play, Share } from "lucide-react";
import { toast } from "sonner";
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from "@/lib/pwa";

/**
 * Store links: fill these in once Whisly is live on the App Store / Google Play.
 * Until then the badges explain that the store app is coming and offer the web install.
 */
const APP_STORE_URL = "";
const PLAY_STORE_URL = "";

export function DownloadApp() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const sync = () => setCanInstall(canPromptInstall());
    sync();
    setInstalled(isStandalone());
    setIos(isIOS());
    return onInstallChange(sync);
  }, []);

  if (installed) return null;

  async function install() {
    if (canInstall) {
      await promptInstall();
    } else if (ios) {
      toast("Tap the Share button, then “Add to Home Screen”.");
    } else {
      toast("Open your browser menu and choose “Install app” or “Add to Home screen”.");
    }
  }

  const store = (url: string, name: string) => () =>
    url ? window.open(url, "_blank", "noopener") : toast(`Whisly on ${name} is coming soon — install the web app now.`);

  const badge =
    "flex h-14 flex-1 items-center gap-3 rounded-2xl bg-foreground px-4 text-start text-background transition active:scale-[0.97]";

  return (
    <section className="mt-10 rounded-4xl bg-gradient-brand p-[1.5px] shadow-glow">
      <div className="rounded-[calc(var(--radius)+15px)] bg-card p-5">
        <h2 className="text-lg font-bold">Get the Whisly app</h2>
        <p className="mt-1 text-sm text-muted-foreground">Listen and record faster, right from your home screen.</p>
        <div className="mt-4 flex gap-3">
          <button onClick={store(APP_STORE_URL, "the App Store")} className={badge}>
            <Apple className="size-7 shrink-0" />
            <span className="leading-tight"><span className="block text-[10px]">Download on the</span><span className="font-semibold">App Store</span></span>
          </button>
          <button onClick={store(PLAY_STORE_URL, "Google Play")} className={badge}>
            <Play className="size-6 shrink-0 fill-current" />
            <span className="leading-tight"><span className="block text-[10px] uppercase">Get it on</span><span className="font-semibold">Google Play</span></span>
          </button>
        </div>
        <button
          onClick={install}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-cta font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          {ios && !canInstall ? <Share className="size-5" /> : <Download className="size-5" />} Install app now
        </button>
      </div>
    </section>
  );
}
