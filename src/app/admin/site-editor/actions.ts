"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { logActivity } from "@/lib/activity";

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
  await logActivity("section.update", {
    entityType: "section",
    entityId: id,
    label: id,
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function toggleHomeSectionVisible(id: string, visible: boolean) {
  await ensureAdmin();
  await prisma.homeSection.update({ where: { id }, data: { visible } });
  await logActivity("section.toggle", {
    entityType: "section",
    entityId: id,
    label: visible ? "shown" : "hidden",
  });
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
  await logActivity("section.reorder", {
    entityType: "section",
    label: `${orderedIds.length} sections`,
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function addHomeSection(type: string) {
  await ensureAdmin();
  const valid = ["hero", "featured", "latest", "store-featured", "about", "contact"];
  if (!valid.includes(type)) throw new Error("Invalid section type");
  const last = await prisma.homeSection.aggregate({ _max: { order: true } });
  const created = await prisma.homeSection.create({
    data: { type, order: (last._max.order ?? -1) + 1 },
  });
  await logActivity("section.create", {
    entityType: "section",
    entityId: created.id,
    label: type,
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
  return created.id;
}

export async function duplicateHomeSection(id: string) {
  await ensureAdmin();
  const original = await prisma.homeSection.findUnique({ where: { id } });
  if (!original) throw new Error("Section not found");

  // Insert directly after the original by shifting everything below it +1.
  await prisma.$transaction([
    prisma.homeSection.updateMany({
      where: { order: { gt: original.order } },
      data: { order: { increment: 1 } },
    }),
    prisma.homeSection.create({
      data: {
        type: original.type,
        order: original.order + 1,
        visible: original.visible,
        eyebrow: original.eyebrow,
        title: original.title,
        titleMuted: original.titleMuted,
        body: original.body,
        ctaLabel: original.ctaLabel,
        ctaHref: original.ctaHref,
        projectId: original.projectId,
      },
    }),
  ]);
  await logActivity("section.duplicate", {
    entityType: "section",
    entityId: id,
    label: original.type,
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function deleteHomeSection(id: string) {
  await ensureAdmin();
  const existing = await prisma.homeSection.findUnique({ where: { id } });
  await prisma.homeSection.delete({ where: { id } });
  await logActivity("section.delete", {
    entityType: "section",
    entityId: id,
    label: existing?.type ?? "",
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function setHomeSectionProject(id: string, projectId: string | null) {
  await ensureAdmin();
  await prisma.homeSection.update({
    where: { id },
    data: { projectId },
  });
  await logActivity("section.update", {
    entityType: "section",
    entityId: id,
    label: projectId ? "project bound" : "project unbound",
  });
  revalidatePath("/");
  revalidatePath("/admin/site-editor");
}

export async function setHomeSectionStoreProduct(
  id: string,
  storeProductId: string | null,
) {
  await ensureAdmin();
  await prisma.homeSection.update({
    where: { id },
    data: { storeProductId },
  });
  await logActivity("section.update", {
    entityType: "section",
    entityId: id,
    label: storeProductId ? "store product bound" : "store product unbound",
  });
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
  await logActivity("settings.update", {
    entityType: "settings",
    label: "site settings",
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-editor");
}
