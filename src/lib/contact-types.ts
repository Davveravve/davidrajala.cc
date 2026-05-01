import {
  Mail,
  Phone,
  Instagram,
  AtSign,
  Linkedin,
  Twitter,
  MessageCircle,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ContactTypeKey =
  | "mail"
  | "phone"
  | "instagram"
  | "snapchat"
  | "linkedin"
  | "x"
  | "discord"
  | "other";

export type ContactTypeMeta = {
  key: ContactTypeKey;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  prefix?: string;
  href?: (value: string) => string;
};

export const CONTACT_TYPES: Record<ContactTypeKey, ContactTypeMeta> = {
  mail: {
    key: "mail",
    label: "Email",
    icon: Mail,
    placeholder: "you@example.com",
    href: (v) => `mailto:${v}`,
  },
  phone: {
    key: "phone",
    label: "Phone",
    icon: Phone,
    placeholder: "+46 70 000 00 00",
    href: (v) => `tel:${v.replace(/\s/g, "")}`,
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "username",
    prefix: "@",
    href: (v) => `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  snapchat: {
    key: "snapchat",
    label: "Snapchat",
    icon: AtSign,
    placeholder: "username",
    prefix: "@",
    href: (v) => `https://snapchat.com/add/${v.replace(/^@/, "")}`,
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "linkedin.com/in/...",
    href: (v) =>
      v.startsWith("http") ? v : `https://linkedin.com/in/${v}`,
  },
  x: {
    key: "x",
    label: "X / Twitter",
    icon: Twitter,
    placeholder: "username",
    prefix: "@",
    href: (v) => `https://x.com/${v.replace(/^@/, "")}`,
  },
  discord: {
    key: "discord",
    label: "Discord",
    icon: MessageCircle,
    placeholder: "username#1234",
  },
  other: {
    key: "other",
    label: "Other",
    icon: Globe,
    placeholder: "how to reach you",
  },
};

export function getContactMeta(key: string): ContactTypeMeta {
  if (key in CONTACT_TYPES) return CONTACT_TYPES[key as ContactTypeKey];
  return CONTACT_TYPES.other;
}
