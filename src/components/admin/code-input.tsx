"use client";

import { useEffect, useRef } from "react";

export function CodeInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  disabled = false,
  hasError = false,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function setDigit(idx: number, ch: string) {
    const arr = value.split("");
    while (arr.length < length) arr.push("");
    arr[idx] = ch;
    onChange(arr.join("").slice(0, length));
  }

  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    if (digits.length > 1) {
      // pasted
      const arr = value.split("");
      for (let i = 0; i < digits.length && idx + i < length; i++) {
        arr[idx + i] = digits[i];
      }
      onChange(arr.join("").slice(0, length));
      const focusTo = Math.min(idx + digits.length, length - 1);
      refs.current[focusTo]?.focus();
      return;
    }
    setDigit(idx, digits);
    if (idx < length - 1) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const cur = value[idx] ?? "";
      if (cur) {
        setDigit(idx, "");
      } else if (idx > 0) {
        setDigit(idx - 1, "");
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    const focusTo = Math.min(pasted.length, length - 1);
    refs.current[focusTo]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => {
        const ch = value[i] ?? "";
        const filled = ch !== "";
        return (
          <div key={i} className="relative">
            <input
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={length}
              disabled={disabled}
              value={ch}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.currentTarget.select()}
              className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-mono rounded-xl bg-[var(--color-bg)] text-[var(--color-fg)] focus:outline-none transition-all ${
                hasError
                  ? "border border-red-500/60 focus:ring-2 focus:ring-red-500/30"
                  : filled
                    ? "border border-[var(--color-accent)]/60 focus:ring-2 focus:ring-[var(--color-accent)]/30"
                    : "border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              }`}
            />
            {i === Math.floor(length / 2) - 1 && (
              <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[var(--color-fg-dim)] pointer-events-none select-none">
                ·
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
