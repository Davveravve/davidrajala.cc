"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, AlertCircle, Upload, X, Video, Film } from "lucide-react";
import { updateAbout } from "@/app/_actions/about";
import { TwoFactorPrompt } from "./two-factor-prompt";

type AboutInput = {
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  yearsExp: number;
  projectsDone: number;
  clients: number;
  skills: string;
  available: boolean;
  busyMessage: string;
  heroBgUrl: string;
  heroBgType: string;
};

export function AboutForm({ about }: { about: AboutInput }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(about.avatarUrl);
  const [heroBgPreview, setHeroBgPreview] = useState<string>(about.heroBgUrl);
  const [heroBgType, setHeroBgType] = useState<string>(about.heroBgType);
  const [heroRemove, setHeroRemove] = useState(false);
  const [available, setAvailable] = useState(about.available);
  const [showPrompt, setShowPrompt] = useState(false);
  const [, startTransition] = useTransition();

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarPreview(URL.createObjectURL(f));
  }

  function onHeroBgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setHeroRemove(false);
    setHeroBgPreview(URL.createObjectURL(f));
    setHeroBgType(f.type.startsWith("video/") ? "video" : "image");
  }

  function clearHeroBg() {
    setHeroRemove(true);
    setHeroBgPreview("");
    setHeroBgType("");
    const input = formRef.current?.elements.namedItem("heroBgFile") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setShowPrompt(true);
  }

  async function submitWithCode(code: string) {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    fd.set("totpCode", code);
    fd.set("available", available ? "true" : "");
    if (heroRemove) fd.set("heroBgRemove", "true");
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await updateAbout(fd);
          setSavedAt(Date.now());
          setShowPrompt(false);
          setHeroRemove(false);
          resolve();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Something went wrong";
          if (msg.includes("kod") || msg.includes("Kod")) {
            // 2FA-related — bubble up to prompt
            reject(new Error(msg));
          } else {
            setError(msg);
            setShowPrompt(false);
            resolve();
          }
        }
      });
    });
  }

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <Card title="Profile">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized={avatarPreview.startsWith("blob:")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--color-fg-dim)]">
                    Ingen bild
                  </div>
                )}
              </div>
              <label className="block">
                <div className="relative flex items-center justify-center px-3 py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-xs text-[var(--color-fg-muted)] cursor-pointer">
                  <Upload size={12} className="mr-2" />
                  Change image
                  <input
                    type="file"
                    name="avatarFile"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={onAvatarChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </label>
              <input type="hidden" name="avatarUrl" defaultValue={about.avatarUrl} />
            </div>

            <div className="space-y-4">
              <Field label="Name" name="name" defaultValue={about.name} required />
              <Field label="Role" name="role" defaultValue={about.role} required />
              <Field
                label="Bio"
                name="bio"
                defaultValue={about.bio}
                as="textarea"
                rows={6}
                placeholder="Tell people about yourself..."
              />
            </div>
          </div>
        </Card>

        <Card title="Availability">
          <div className="flex items-start gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={available}
              onClick={() => setAvailable((v) => !v)}
              className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full transition-colors px-0.5 ${
                available
                  ? "bg-[var(--color-accent)]"
                  : "bg-orange-500"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  available ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    available ? "bg-[var(--color-accent)]" : "bg-orange-500"
                  }`}
                  style={{
                    boxShadow: available
                      ? "0 0 8px var(--color-accent)"
                      : "0 0 8px rgb(249 115 22 / 0.6)",
                  }}
                />
                <span className="font-medium text-sm">
                  {available
                    ? "Available for new projects"
                    : "Busy — current projects"}
                </span>
              </div>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                Shows as an indicator on the home page. Turn off when busy.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <Field
              label="Busy message"
              name="busyMessage"
              defaultValue={about.busyMessage}
              placeholder="Currently working on projects — there might be a wait"
              help="Shows on the home page when availability is off."
            />
          </div>
        </Card>

        <Card title="Hero background">
          <p className="text-sm text-[var(--color-fg-muted)] mb-5">
            Add an image or video that loops behind the home page hero. Leave empty to use just the grid pattern.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-5">
            <div className="space-y-3">
              <label className="block">
                <div className="relative flex items-center justify-center px-4 py-6 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer text-sm text-[var(--color-fg-muted)]">
                  <Upload size={16} className="mr-2" />
                  Click or drop an image or video
                  <input
                    type="file"
                    name="heroBgFile"
                    accept="image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                    onChange={onHeroBgChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </label>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Images up to 10 MB · Video up to 100 MB. Video loops silently.
              </p>
              {(heroBgPreview || heroBgType) && !heroRemove && (
                <button
                  type="button"
                  onClick={clearHeroBg}
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={12} /> Remove background
                </button>
              )}
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]">
              {heroBgPreview && !heroRemove ? (
                heroBgType === "video" ? (
                  <video
                    src={heroBgPreview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={heroBgPreview}
                    alt="Hero background"
                    fill
                    sizes="240px"
                    className="object-cover"
                    unoptimized={heroBgPreview.startsWith("blob:")}
                  />
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-[var(--color-fg-dim)] gap-2">
                  {heroBgType === "video" ? <Video size={20} /> : <Film size={20} />}
                  <span className="text-xs">Preview</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Contact & location">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" name="email" defaultValue={about.email} type="email" />
            <Field label="Phone" name="phone" defaultValue={about.phone} />
            <Field label="Location" name="location" defaultValue={about.location} />
          </div>
        </Card>

        <Card title="Stats">
          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Years of experience"
              name="yearsExp"
              type="number"
              defaultValue={String(about.yearsExp)}
            />
            <Field
              label="Projects delivered"
              name="projectsDone"
              type="number"
              defaultValue={String(about.projectsDone)}
            />
            <Field
              label="Happy clients"
              name="clients"
              type="number"
              defaultValue={String(about.clients)}
            />
          </div>
        </Card>

        <Card title="Skills">
          <Field
            label="Skills (comma-separated)"
            name="skills"
            defaultValue={about.skills}
            as="textarea"
            rows={3}
            placeholder="React, Node.js, PostgreSQL, ..."
            help="Separated by commas. Shown as chips."
          />
        </Card>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 sticky bottom-6 bg-[var(--color-bg)]/80 backdrop-blur-sm py-4 px-2 rounded-2xl border border-[var(--color-border)]">
          {savedAt && (
            <span
              key={savedAt}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent)] mr-auto"
            >
              <Check size={12} />
              Saved
            </span>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow"
          >
            Save changes
          </button>
        </div>
      </form>

      <TwoFactorPrompt
        open={showPrompt}
        title="Save profile"
        description="Profile changes are confirmed with verification."
        confirmLabel="Confirm & save"
        onCancel={() => setShowPrompt(false)}
        onSubmit={submitWithCode}
      />
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="px-6 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-display text-base font-medium">{title}</h3>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  help,
  as = "input",
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
  as?: "input" | "textarea";
  rows?: number;
}) {
  const cls =
    "w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all";
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={rows ?? 4}
          required={required}
          placeholder={placeholder}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
      {help && <span className="block text-xs text-[var(--color-fg-muted)] mt-1.5">{help}</span>}
    </label>
  );
}
