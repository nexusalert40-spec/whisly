import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Pencil, UserRound } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/hooks/use-profile";
import { uploadAvatar, useAvatarUrl } from "@/lib/avatar";
import { useI18n } from "@/lib/i18n";

const nameSchema = z.string().trim().max(50, "Max 50 characters");

type P = { id: string; first_name: string; last_name: string; name: string; avatar_url: string | null };

export function AvatarImage({ path, className }: { path: string | null | undefined; className: string }) {
  const url = useAvatarUrl(path);
  return url ? (
    <img src={url} alt="" className={`${className} rounded-full object-cover`} />
  ) : (
    <div className={`${className} flex items-center justify-center rounded-full bg-gradient-orb text-primary-foreground shadow-glow`}>
      <UserRound className="size-1/2" fill="currentColor" />
    </div>
  );
}

export function EditProfile({ profile }: { profile: P }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const qc = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const [first, setFirst] = useState(profile.first_name || profile.name.split(" ")[0] || "");
  const [last, setLast] = useState(profile.last_name || profile.name.split(" ").slice(1).join(" "));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setFirst(profile.first_name || profile.name.split(" ")[0] || "");
    setLast(profile.last_name || profile.name.split(" ").slice(1).join(" "));
  }, [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function update(patch: Partial<P>) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (error) throw error;
    qc.setQueryData(profileQuery.queryKey, (old: any) => (old ? { ...old, ...patch } : old));
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const old = profile.avatar_url;
      const path = await uploadAvatar(profile.id, f);
      await update({ avatar_url: path });
      if (old) void supabase.storage.from("avatars").remove([old]);
      toast.success(t("profileSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const f = nameSchema.safeParse(first);
    const l = nameSchema.safeParse(last);
    if (!f.success || !l.success || !f.data) {
      toast.error(!f.data ? "Enter your first name" : "Max 50 characters");
      return;
    }
    setBusy(true);
    try {
      await update({ first_name: f.data, last_name: l.data, name: `${f.data} ${l.data}`.trim() });
      toast.success(t("profileSaved"));
      setOpen(false);
    } catch {
      toast.error("Couldn't save profile");
    } finally {
      setBusy(false);
    }
  }

  const input = "h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("editProfile")} className="relative shrink-0 rounded-full transition active:scale-95">
        <AvatarImage path={profile.avatar_url} className="size-16" />
        <span className="absolute -bottom-0.5 -end-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow ring-2 ring-card">
          <Pencil className="size-3" />
        </span>
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-md rounded-t-4xl pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <DrawerHeader><DrawerTitle className="text-center text-lg">{t("editProfile")}</DrawerTitle></DrawerHeader>
          <form onSubmit={onSave} className="flex flex-col gap-4 px-5">
            <button type="button" onClick={() => file.current?.click()} disabled={busy} className="relative mx-auto" aria-label={t("changePhoto")}>
              <AvatarImage path={profile.avatar_url} className="size-24" />
              <span className="absolute bottom-0 end-0 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              </span>
            </button>
            <p className="-mt-2 text-center text-sm text-muted-foreground">{t("changePhoto")}</p>
            <input ref={file} type="file" accept="image/*" hidden onChange={onPhoto} />
            <label className="text-sm font-medium">{t("firstName")}
              <input className={`${input} mt-1`} value={first} maxLength={50} onChange={(e) => setFirst(e.target.value)} />
            </label>
            <label className="text-sm font-medium">{t("lastName")}
              <input className={`${input} mt-1`} value={last} maxLength={50} onChange={(e) => setLast(e.target.value)} />
            </label>
            <button disabled={busy} className="h-12 rounded-full bg-gradient-cta font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
              {t("saveChanges")}
            </button>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
