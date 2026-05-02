import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_ANY_BYTES = 500 * 1024 * 1024; // 500 MB — for downloadable store files

const IMAGE_MIME = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
  ["image/bmp", "bmp"],
  ["image/tiff", "tiff"],
]);
const VIDEO_MIME = new Map<string, string>([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

type Kind = "image" | "video" | "auto" | "any";

function safeExtension(filename: string): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(filename);
  return m ? m[1].toLowerCase() : "bin";
}

export async function saveUploadedFile(
  file: File,
  subdir: string,
  kind: Kind = "auto",
): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (kind === "image" && !isImage) throw new Error("Endast bilder är tillåtna här");
  if (kind === "video" && !isVideo) throw new Error("Endast video är tillåten här");

  // For "any" mode (e.g. store product files), accept whatever the browser
  // sends and trust the original extension. Still bound by MAX_ANY_BYTES.
  let ext: string;
  let max: number;
  if (kind === "any") {
    ext = safeExtension(file.name);
    max = MAX_ANY_BYTES;
  } else {
    const map = isVideo ? VIDEO_MIME : IMAGE_MIME;
    const fromMime = map.get(file.type);
    if (!fromMime) {
      const hint = isVideo
        ? "Try MP4, WebM, or MOV."
        : file.type === "image/heic" || file.type === "image/heif"
          ? "HEIC/HEIF isn't supported — convert to JPEG or PNG first."
          : "Try PNG, JPEG, WebP, AVIF, GIF, or SVG.";
      throw new Error(
        `Image format ${file.type || "(unknown)"} not supported. ${hint}`,
      );
    }
    ext = fromMime;
    max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  }
  if (file.size > max) {
    throw new Error(`Filen är för stor (max ${Math.round(max / 1024 / 1024)} MB)`);
  }

  const safeSub = subdir.replace(/[^a-z0-9_-]/gi, "");
  const dir = path.join(ROOT, safeSub);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const dest = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return `/uploads/${safeSub}/${name}`;
}

export function isLocalUpload(url: string) {
  return url.startsWith("/uploads/");
}

export async function deleteUpload(publicUrl: string) {
  if (!isLocalUpload(publicUrl)) return;
  const cleaned = publicUrl.replace(/^\/uploads\//, "").replace(/\.\./g, "");
  const target = path.join(ROOT, cleaned);
  if (!target.startsWith(ROOT)) return;
  try {
    await fs.unlink(target);
  } catch {
    // ignore
  }
}
