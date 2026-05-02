import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import {
  verifyDownloadToken,
  MAX_DOWNLOADS,
} from "@/lib/download-tokens";
import { isLocalUpload } from "@/lib/uploads";

// Streams the underlying file for a paid OrderItem if the signed token is
// valid. Each call increments downloadCount; abuse is bounded by MAX_DOWNLOADS.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const claim = await verifyDownloadToken(token);
  if (!claim) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: claim.orderItemId },
    include: {
      order: { select: { customerId: true, status: true } },
      product: { select: { fileUrl: true, fileName: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (item.order.customerId !== claim.customerId) {
    return NextResponse.json({ error: "Not yours" }, { status: 403 });
  }
  if (item.order.status !== "paid") {
    return NextResponse.json({ error: "Order not paid" }, { status: 402 });
  }
  if (item.downloadCount >= MAX_DOWNLOADS) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 429 },
    );
  }

  // Snapshot wins over current product URL (so the customer keeps access
  // even if the owner replaces the file).
  const fileUrl = item.fileUrlSnapshot || item.product?.fileUrl;
  const fileName =
    item.fileNameSnapshot || item.product?.fileName || "download.bin";
  if (!fileUrl) {
    return NextResponse.json({ error: "File missing" }, { status: 410 });
  }

  // Only locally-stored files supported in v1. Remote URLs would need a fetch+stream.
  if (!isLocalUpload(fileUrl)) {
    return NextResponse.json(
      { error: "Remote files not supported" },
      { status: 415 },
    );
  }

  // Map /uploads/... to absolute path under public/uploads. Disallow path traversal.
  const rel = fileUrl.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!rel.startsWith("uploads/") || rel.includes("..")) {
    return NextResponse.json({ error: "Bad file path" }, { status: 400 });
  }
  const absPath = path.join(process.cwd(), "public", rel);

  let stat;
  try {
    stat = await fs.stat(absPath);
    if (!stat.isFile()) throw new Error();
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 410 });
  }

  const buffer = await fs.readFile(absPath);

  // Bump download count last, after we know the file exists.
  await prisma.orderItem
    .update({
      where: { id: item.id },
      data: { downloadCount: { increment: 1 } },
    })
    .catch(() => {});

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
