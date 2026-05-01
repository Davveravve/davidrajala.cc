import type { ContactTypeKey } from "./contact-types";

const KEY_CONSENT = "dr.chat.consent";
const KEY_PROFILE = "dr.chat.profile";
const KEY_HISTORY = "dr.chat.history";

const HISTORY_LIMIT = 30;

export type StoredContact = {
  type: ContactTypeKey | string;
  value: string;
  label?: string;
};

export type StoredProfile = {
  name: string;
  contacts: StoredContact[];
};

export type StoredMessage = {
  id: string;
  message: string;
  contacts: StoredContact[];
  createdAt: string;
};

export type Consent = "yes" | "no" | null;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadConsent(): Consent {
  if (!isBrowser()) return null;
  try {
    const v = localStorage.getItem(KEY_CONSENT);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: "yes" | "no") {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY_CONSENT, value);
    if (value === "no") {
      localStorage.removeItem(KEY_PROFILE);
      localStorage.removeItem(KEY_HISTORY);
    }
  } catch {
    // ignore
  }
}

export function loadProfile(): StoredProfile | null {
  if (!isBrowser()) return null;
  if (loadConsent() !== "yes") return null;
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProfile;
    if (typeof parsed?.name !== "string") return null;
    if (!Array.isArray(parsed?.contacts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(p: StoredProfile) {
  if (!isBrowser()) return;
  if (loadConsent() !== "yes") return;
  try {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function loadHistory(): StoredMessage[] {
  if (!isBrowser()) return [];
  if (loadConsent() !== "yes") return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) => m && typeof m.id === "string" && typeof m.message === "string",
    );
  } catch {
    return [];
  }
}

export function appendHistory(msg: StoredMessage) {
  if (!isBrowser()) return;
  if (loadConsent() !== "yes") return;
  try {
    const list = loadHistory();
    list.push(msg);
    const trimmed = list.slice(-HISTORY_LIMIT);
    localStorage.setItem(KEY_HISTORY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function clearAll() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEY_CONSENT);
    localStorage.removeItem(KEY_PROFILE);
    localStorage.removeItem(KEY_HISTORY);
  } catch {
    // ignore
  }
}
