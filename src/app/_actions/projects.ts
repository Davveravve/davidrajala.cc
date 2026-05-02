"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { saveUploadedFile, deleteUpload, isLocalUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const projectSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().max(100).optional(),
  summary: z.string().min(1).max(500),
  body: z.string().max(20000).default(""),
  liveUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  techStack: z.string().max(500).default(""),
  categoryId: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  status: z.enum(["live", "wip", "archived", "oss"]).default("live"),
  hasCaseStudy: z.boolean().default(false),
  caseChallenge: z.string().max(20000).default(""),
  caseProcess: z.string().max(20000).default(""),
  caseOutcome: z.string().max(20000).default(""),
  caseLessons: z.string().max(20000).default(""),
  beforeUrl: z.string().url().optional().or(z.literal("")),
  afterUrl: z.string().url().optional().or(z.literal("")),
});

function fdToBool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || "project";
  let n = 0;
  while (true) {
    const existing = await prisma.project.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n++;
    candidate = `${base}-${n}`;
  }
}

export async function createProject(formData: FormData) {
  await ensureAdmin();


  const data = projectSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    summary: formData.get("summary"),
    body: formData.get("body") ?? "",
    liveUrl: formData.get("liveUrl") ?? "",
    repoUrl: formData.get("repoUrl") ?? "",
    techStack: formData.get("techStack") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    featured: fdToBool(formData.get("featured")),
    published: fdToBool(formData.get("published")),
    status: formData.get("status") ?? "live",
    hasCaseStudy: fdToBool(formData.get("hasCaseStudy")),
    caseChallenge: formData.get("caseChallenge") ?? "",
    caseProcess: formData.get("caseProcess") ?? "",
    caseOutcome: formData.get("caseOutcome") ?? "",
    caseLessons: formData.get("caseLessons") ?? "",
    beforeUrl: formData.get("beforeUrl") ?? "",
    afterUrl: formData.get("afterUrl") ?? "",
  });

  const slugBase = slugify(data.slug || data.title);
  const slug = await uniqueSlug(slugBase);

  const cover = formData.get("coverFile") as File | null;
  const coverUrlInput = String(formData.get("coverUrl") ?? "").trim();
  let coverUrl = coverUrlInput;
  if (cover && cover.size > 0) {
    coverUrl = await saveUploadedFile(cover, "covers");
  }
  if (!coverUrl) {
    throw new Error("Cover image is required");
  }

  const lastOrder = await prisma.project.aggregate({ _max: { order: true } });
  const order = (lastOrder._max.order ?? -1) + 1;

  const project = await prisma.project.create({
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      body: data.body,
      liveUrl: data.liveUrl || null,
      repoUrl: data.repoUrl || null,
      techStack: data.techStack,
      categoryId: data.categoryId || null,
      featured: data.featured,
      published: data.published,
      status: data.status,
      hasCaseStudy: data.hasCaseStudy,
      caseChallenge: data.caseChallenge,
      caseProcess: data.caseProcess,
      caseOutcome: data.caseOutcome,
      caseLessons: data.caseLessons,
      beforeUrl: data.beforeUrl || null,
      afterUrl: data.afterUrl || null,
      coverUrl,
      order,
    },
  });

  // optional gallery files
  const galleryFiles = formData.getAll("galleryFiles") as File[];
  for (let i = 0; i < galleryFiles.length; i++) {
    const f = galleryFiles[i];
    if (!f || f.size === 0) continue;
    const url = await saveUploadedFile(f, "gallery");
    await prisma.projectImage.create({
      data: { projectId: project.id, url, order: i },
    });
  }

  await logActivity("project.create", {
    entityType: "project",
    entityId: project.id,
    label: data.title,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  await ensureAdmin();


  const data = projectSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    summary: formData.get("summary"),
    body: formData.get("body") ?? "",
    liveUrl: formData.get("liveUrl") ?? "",
    repoUrl: formData.get("repoUrl") ?? "",
    techStack: formData.get("techStack") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    featured: fdToBool(formData.get("featured")),
    published: fdToBool(formData.get("published")),
    status: formData.get("status") ?? "live",
    hasCaseStudy: fdToBool(formData.get("hasCaseStudy")),
    caseChallenge: formData.get("caseChallenge") ?? "",
    caseProcess: formData.get("caseProcess") ?? "",
    caseOutcome: formData.get("caseOutcome") ?? "",
    caseLessons: formData.get("caseLessons") ?? "",
    beforeUrl: formData.get("beforeUrl") ?? "",
    afterUrl: formData.get("afterUrl") ?? "",
  });

  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) throw new Error("Project not found");

  const slugBase = slugify(data.slug || data.title);
  const slug = await uniqueSlug(slugBase, projectId);

  let coverUrl = existing.coverUrl;
  const cover = formData.get("coverFile") as File | null;
  const coverUrlInput = String(formData.get("coverUrl") ?? "").trim();
  if (cover && cover.size > 0) {
    coverUrl = await saveUploadedFile(cover, "covers");
    if (existing.coverUrl && isLocalUpload(existing.coverUrl)) {
      await deleteUpload(existing.coverUrl);
    }
  } else if (coverUrlInput && coverUrlInput !== existing.coverUrl) {
    coverUrl = coverUrlInput;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      body: data.body,
      liveUrl: data.liveUrl || null,
      repoUrl: data.repoUrl || null,
      techStack: data.techStack,
      categoryId: data.categoryId || null,
      // featured is managed separately via setFeaturedProject() — never touched on edit.
      published: data.published,
      status: data.status,
      hasCaseStudy: data.hasCaseStudy,
      caseChallenge: data.caseChallenge,
      caseProcess: data.caseProcess,
      caseOutcome: data.caseOutcome,
      caseLessons: data.caseLessons,
      beforeUrl: data.beforeUrl || null,
      afterUrl: data.afterUrl || null,
      coverUrl,
    },
  });

  // append new gallery files
  const galleryFiles = formData.getAll("galleryFiles") as File[];
  if (galleryFiles.length > 0) {
    const last = await prisma.projectImage.aggregate({
      where: { projectId },
      _max: { order: true },
    });
    let nextOrder = (last._max.order ?? -1) + 1;
    for (const f of galleryFiles) {
      if (!f || f.size === 0) continue;
      const url = await saveUploadedFile(f, "gallery");
      await prisma.projectImage.create({
        data: { projectId, url, order: nextOrder++ },
      });
    }
  }

  await logActivity("project.update", {
    entityType: "project",
    entityId: projectId,
    label: data.title,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${existing.slug}`);
  if (slug !== existing.slug) revalidatePath(`/projects/${slug}`);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await ensureAdmin();
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    include: { images: true },
  });
  if (!existing) return;

  if (existing.coverUrl && isLocalUpload(existing.coverUrl)) {
    await deleteUpload(existing.coverUrl);
  }
  for (const img of existing.images) {
    if (isLocalUpload(img.url)) await deleteUpload(img.url);
  }

  await prisma.project.delete({ where: { id: projectId } });

  await logActivity("project.delete", {
    entityType: "project",
    entityId: projectId,
    label: existing.title,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${existing.slug}`);
  revalidatePath("/admin/projects");
}

export async function deleteProjectImage(imageId: string) {
  await ensureAdmin();
  const img = await prisma.projectImage.findUnique({
    where: { id: imageId },
    include: { project: true },
  });
  if (!img) return;
  if (isLocalUpload(img.url)) await deleteUpload(img.url);
  await prisma.projectImage.delete({ where: { id: imageId } });
  revalidatePath(`/projects/${img.project.slug}`);
  revalidatePath(`/admin/projects/${img.projectId}`);
}

export async function reorderProjects(orderedIds: string[]) {
  await ensureAdmin();

  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.project.update({ where: { id }, data: { order: idx } }),
    ),
  );
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

/**
 * Sets one project as the featured spotlight. Only one project may be featured
 * at any time — picking another auto-clears the previous one. Pass null to
 * clear the spotlight entirely.
 */
export async function setFeaturedProject(projectId: string | null) {
  await ensureAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.project.updateMany({
      where: { featured: true },
      data: { featured: false },
    });
    if (projectId) {
      await tx.project.update({
        where: { id: projectId },
        data: { featured: true },
      });
    }
  });
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}
