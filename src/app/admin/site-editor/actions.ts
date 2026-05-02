"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";

const sectionSchema = z.object({
  eyebrow: z.string().max(120).nullable(),
  title: z.string().max(200).nullable(),
  titleMuted: z.string().max(200).nullable(),
  body: z.string().max(2000).nullable(),
  ctaLabel: z.string().max(60).nullable(),
  ctaHref: z.string().max(200).nullable(),
});

function nullable(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length === 0 ? null : s;
}

export async function updateHomeSection(id: string, formData: FormData) {
  await ensureAdmin();
  const data = sectionSchema.parse({
    eyebrow: nullable(formData.get("eyebrow")),
    title: nullable(formData.get("title")),
    titleMuted: nullable(formData.get("titleMuted")),
    body: nullable(formData.get("body")),
    ctaLabel: nullable(formData.get("ctaLabel")),
    ctaHref: nullable(formData.get("ctaHref")),
  });
  await prisma.homeSection.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function toggleHomeSectionVisible(id: string, visible: boolean) {
  await ensureAdmin();
  await prisma.homeSection.update({ where: { id }, data: { visible } });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function reorderHomeSections(orderedIds: string[]) {
  await ensureAdmin();
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.homeSection.update({ where: { id }, data: { order: idx } }),
    ),
  );
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function resetHomeSection(id: string) {
  await ensureAdmin();
  await prisma.homeSection.update({
    where: { id },
    data: {
      eyebrow: null,
      title: null,
      titleMuted: null,
      body: null,
      ctaLabel: null,
      ctaHref: null,
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

const settingsSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use #rrggbb"),
  accentColor2: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use #rrggbb"),
  footerTagline: z.string().max(400),
  footerCopyright: z.string().max(200),
  footerStatusText: z.string().max(60),
  heroSubline: z.string().max(800),
});

export async function updateSiteSettings(formData: FormData) {
  await ensureAdmin();
  const data = settingsSchema.parse({
    accentColor: String(formData.get("accentColor") ?? "").trim(),
    accentColor2: String(formData.get("accentColor2") ?? "").trim(),
    footerTagline: String(formData.get("footerTagline") ?? ""),
    footerCopyright: String(formData.get("footerCopyright") ?? ""),
    footerStatusText: String(formData.get("footerStatusText") ?? ""),
    heroSubline: String(formData.get("heroSubline") ?? ""),
  });
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-editor");
}
