"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { saveUploadedFile, deleteUpload, isLocalUpload } from "@/lib/uploads";

const schema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  bio: z.string().max(5000),
  location: z.string().max(120),
  email: z.string().email().or(z.literal("")),
  phone: z.string().max(40),
  yearsExp: z.coerce.number().int().min(0).max(99),
  projectsDone: z.coerce.number().int().min(0).max(9999),
  clients: z.coerce.number().int().min(0).max(9999),
  skills: z.string().max(2000),
  available: z.boolean().default(true),
  busyMessage: z.string().max(400).default(""),
});

function fdToBool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

export async function updateAbout(formData: FormData) {
  await ensureAdmin();

  const data = schema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    bio: formData.get("bio") ?? "",
    location: formData.get("location") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    yearsExp: formData.get("yearsExp"),
    projectsDone: formData.get("projectsDone"),
    clients: formData.get("clients"),
    skills: formData.get("skills") ?? "",
    available: fdToBool(formData.get("available")),
    busyMessage: formData.get("busyMessage") ?? "",
  });

  const existing = await prisma.aboutMe.findUnique({ where: { id: "singleton" } });

  let avatarUrl = existing?.avatarUrl ?? "";
  const avatarFile = formData.get("avatarFile") as File | null;
  const avatarUrlInput = String(formData.get("avatarUrl") ?? "").trim();
  if (avatarFile && avatarFile.size > 0) {
    avatarUrl = await saveUploadedFile(avatarFile, "avatars");
    if (existing?.avatarUrl && isLocalUpload(existing.avatarUrl)) {
      await deleteUpload(existing.avatarUrl);
    }
  } else if (avatarUrlInput && avatarUrlInput !== existing?.avatarUrl) {
    avatarUrl = avatarUrlInput;
  }

  let heroBgUrl = existing?.heroBgUrl ?? "";
  let heroBgType = existing?.heroBgType ?? "";
  const heroBgFile = formData.get("heroBgFile") as File | null;
  const removeHero = fdToBool(formData.get("heroBgRemove"));
  if (removeHero) {
    if (existing?.heroBgUrl && isLocalUpload(existing.heroBgUrl)) {
      await deleteUpload(existing.heroBgUrl);
    }
    heroBgUrl = "";
    heroBgType = "";
  } else if (heroBgFile && heroBgFile.size > 0) {
    const isVideo = heroBgFile.type.startsWith("video/");
    heroBgUrl = await saveUploadedFile(heroBgFile, "hero", isVideo ? "video" : "image");
    heroBgType = isVideo ? "video" : "image";
    if (existing?.heroBgUrl && isLocalUpload(existing.heroBgUrl) && existing.heroBgUrl !== heroBgUrl) {
      await deleteUpload(existing.heroBgUrl);
    }
  }

  await prisma.aboutMe.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data, avatarUrl, heroBgUrl, heroBgType },
    update: { ...data, avatarUrl, heroBgUrl, heroBgType },
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin/about");
}
