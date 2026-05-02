"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import {
  updateProfileAction,
  changePasswordAction,
  customerLogoutAction,
} from "@/app/store/_actions";

type Initial = {
  id: string;
  email: string;
  name: string;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
};

export function CustomerProfileForm({ initial }: { initial: Initial }) {
  return (
    <div className="space-y-6">
      <ProfileCard initial={initial} />
      <PasswordCard />
      <AccountCard />
    </div>
  );
}

function ProfileCard({ initial }: { initial: Initial }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(undefined, fd);
      if (!result.ok) {
        setError(result.error ?? "Update failed");
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <Card title="Profile" subtitle="Name, email and contact links">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Name" name="name" type="text" defaultValue={initial.name} required />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={initial.email}
          required
        />
        <div className="pt-1">
          <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
            Socials (optional)
          </div>
          <div className="space-y-4">
            <Field
              label="Twitter / X"
              name="twitter"
              type="text"
              defaultValue={initial.twitter}
              placeholder="@handle or full URL"
            />
            <Field
              label="GitHub"
              name="github"
              type="text"
              defaultValue={initial.github}
              placeholder="username or full URL"
            />
            <Field
              label="LinkedIn"
              name="linkedin"
              type="text"
              defaultValue={initial.linkedin}
              placeholder="profile URL"
            />
            <Field
              label="Website"
              name="website"
              type="url"
              defaultValue={initial.website}
              placeholder="https://..."
            />
          </div>
        </div>

        <Feedback error={error} saved={saved} savedLabel="Profile saved" />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setSaved(false);
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await changePasswordAction(undefined, fd);
      if (!result.ok) {
        setError(result.error ?? "Password change failed");
      } else {
        setSaved(true);
        form.reset();
      }
    });
  }

  return (
    <Card title="Change password" subtitle="Use at least 8 characters">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          help="At least 8 characters."
        />

        <Feedback error={error} saved={saved} savedLabel="Password updated" />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function AccountCard() {
  return (
    <Card title="Account" subtitle="Sign out of this device">
      <form action={customerLogoutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </form>
    </Card>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
      <div className="mb-5">
        <h2 className="font-display text-lg font-medium">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Feedback({
  error,
  saved,
  savedLabel,
}: {
  error: string | null;
  saved: boolean;
  savedLabel: string;
}) {
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
        <AlertCircle size={14} />
        {error}
      </div>
    );
  }
  if (saved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-[var(--color-accent)] text-sm">
        <CheckCircle2 size={14} />
        {savedLabel}
      </div>
    );
  }
  return null;
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  help,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  help?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--color-fg-muted)] mb-2">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
      />
      {help && (
        <span className="block text-[11px] text-[var(--color-fg-muted)] mt-1.5">{help}</span>
      )}
    </label>
  );
}
