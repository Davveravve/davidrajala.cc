"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Send, AlertCircle } from "lucide-react";
import { sendContactMessage } from "@/app/_actions/contact";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await sendContactMessage(formData);
      if (res.ok) {
        setStatus("ok");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
        setError(res.error || "Något gick fel");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-7 md:p-10 space-y-6"
    >
      <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] flex items-center gap-3">
        <span className="h-px w-6 bg-[var(--color-fg-dim)]" />
        Skriv till mig
      </div>

      {/* honeypot — hidden from real users, irresistible to bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <Field label="Namn" name="name" placeholder="För & Efternamn" required />
      <Field
        label="Mail"
        name="email"
        type="email"
        placeholder="namn@example.com"
        required
      />
      <Field
        label="Meddelande"
        name="message"
        as="textarea"
        placeholder="Berätta om ditt projekt…"
        required
      />

      <button
        type="submit"
        disabled={isPending || status === "ok"}
        className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-[15px] hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <AnimatePresence mode="wait">
          {status === "ok" ? (
            <motion.span
              key="ok"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="inline-flex items-center gap-2"
            >
              <Check size={16} />
              Skickat
            </motion.span>
          ) : isPending ? (
            <motion.span
              key="sending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-2"
            >
              Skickar…
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-2"
            >
              <Send size={16} className="transition-transform group-hover:translate-x-0.5" />
              Skicka meddelande
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {status === "error" && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  as = "input",
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  as?: "input" | "textarea";
}) {
  const baseClass =
    "w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] text-[15px] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none transition-colors";

  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--color-fg-muted)] mb-2.5">
        {label}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          rows={5}
          className={`${baseClass} resize-y min-h-[120px] leading-relaxed`}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          className={baseClass}
        />
      )}
    </label>
  );
}
