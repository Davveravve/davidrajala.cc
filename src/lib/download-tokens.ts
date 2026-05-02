import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const MAX_DOWNLOADS = 10;

function key(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return new TextEncoder().encode("download:" + secret);
}

/// Sign a token tying a download URL to a specific OrderItem + Customer.
export async function signDownloadToken(
  orderItemId: string,
  customerId: string,
): Promise<string> {
  return new SignJWT({ oi: orderItemId, c: customerId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifyDownloadToken(
  token: string,
): Promise<{ orderItemId: string; customerId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: [ALG] });
    if (typeof payload.oi !== "string" || typeof payload.c !== "string") return null;
    return { orderItemId: payload.oi, customerId: payload.c };
  } catch {
    return null;
  }
}
