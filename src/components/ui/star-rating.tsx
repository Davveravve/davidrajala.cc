"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/// Interactive star picker for review forms. value is 1..5 (or 0 for unset).
export function StarPicker({
  value,
  onChange,
  size = 22,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  name?: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= display;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className={`p-1 rounded-md transition-colors ${
              active
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-border-strong)] hover:text-[var(--color-fg-muted)]"
            }`}
          >
            <Star size={size} fill={active ? "currentColor" : "transparent"} />
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

/// Read-only display of a star rating. Accepts decimals like 4.3 → 4 full
/// stars + slight visual hint via opacity.
export function StarRating({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(5, value));
  return (
    <div
      className={`inline-flex items-center gap-0.5 text-[var(--color-accent)] ${className ?? ""}`}
      title={`${safe.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fillAmount = Math.max(0, Math.min(1, safe - (n - 1)));
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              size={size}
              className="absolute inset-0 text-[var(--color-border-strong)]"
            />
            <span
              className="absolute inset-0 overflow-hidden text-[var(--color-accent)]"
              style={{ width: `${fillAmount * 100}%` }}
            >
              <Star size={size} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </div>
  );
}
