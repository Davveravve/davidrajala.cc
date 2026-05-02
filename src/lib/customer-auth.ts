import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "store_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const ALG = "HS256";
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function key(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return new TextEncoder().encode(secret);
}

async function signSession(customerId: string): Promise<string> {
  return new SignJWT({ sub: customerId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: [ALG] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function createCustomerSession(customerId: string) {
  const token = await signSession(customerId);
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearCustomerSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getCurrentCustomer() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const id = await verifySession(token);
  if (!id) return null;
  const customer = await prisma.customer.findUnique({ where: { id } });
  return customer;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Unauthorized");
  return customer;
}

function normaliseSocial(value: string | undefined | null): string {
  if (!value) return "";
  return value.trim();
}

export async function signupCustomer(input: {
  email: string;
  password: string;
  name: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Invalid email");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const name = (input.name ?? "").trim();
  if (name.length < 1) {
    throw new Error("Name is required");
  }
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const customer = await prisma.customer.create({
    data: {
      email,
      passwordHash,
      name,
      twitter: normaliseSocial(input.twitter),
      github: normaliseSocial(input.github),
      linkedin: normaliseSocial(input.linkedin),
      website: normaliseSocial(input.website),
    },
  });
  await createCustomerSession(customer.id);
  return customer;
}

export async function loginCustomer(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    // Constant-time-ish: pretend to compare anyway.
    await bcrypt.compare("dummy", "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsalti");
    throw new Error("Invalid email or password");
  }
  const ok = await bcrypt.compare(input.password, customer.passwordHash);
  if (!ok) throw new Error("Invalid email or password");
  await createCustomerSession(customer.id);
  return customer;
}

export async function updateCustomer(
  id: string,
  input: {
    name?: string;
    email?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  },
) {
  const current = await prisma.customer.findUnique({ where: { id } });
  if (!current) throw new Error("Customer not found");

  const data: {
    name?: string;
    email?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 1) throw new Error("Name is required");
    data.name = name;
  }

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("Invalid email");
    }
    if (email !== current.email) {
      const clash = await prisma.customer.findUnique({ where: { email } });
      if (clash) throw new Error("An account with that email already exists");
      data.email = email;
    }
  }

  if (input.twitter !== undefined) data.twitter = normaliseSocial(input.twitter);
  if (input.github !== undefined) data.github = normaliseSocial(input.github);
  if (input.linkedin !== undefined) data.linkedin = normaliseSocial(input.linkedin);
  if (input.website !== undefined) data.website = normaliseSocial(input.website);

  const updated = await prisma.customer.update({ where: { id }, data });
  return updated;
}

export async function changeCustomerPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new Error("Customer not found");

  const ok = await bcrypt.compare(currentPassword, customer.passwordHash);
  if (!ok) throw new Error("Current password is incorrect");

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.customer.update({
    where: { id },
    data: { passwordHash },
  });
  return true;
}

/**
 * Generate a password-reset token for the given email.
 *
 * Returns `{ token, email }` so the caller can email the reset link.
 * Currently no email is actually sent — the action layer logs the link
 * to the server console with a `[reset link]` prefix so the operator can
 * copy-paste it manually. Wire up Resend (or similar) here later.
 */
export async function requestPasswordReset(email: string) {
  const normalised = email.trim().toLowerCase();
  const customer = await prisma.customer.findUnique({ where: { email: normalised } });
  if (!customer) return null;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { resetToken: token, resetExpiresAt: expiresAt },
  });

  return { token, email: normalised, expiresAt };
}

/**
 * Consume a password-reset token: verify it, set the new password,
 * clear the token, and create a fresh session.
 */
export async function consumePasswordReset(token: string, newPassword: string) {
  if (!token || token.length < 32) throw new Error("Invalid reset link");
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const customer = await prisma.customer.findFirst({ where: { resetToken: token } });
  if (!customer) throw new Error("Invalid or expired reset link");
  if (!customer.resetExpiresAt || customer.resetExpiresAt.getTime() < Date.now()) {
    throw new Error("Invalid or expired reset link");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpiresAt: null,
    },
  });

  await createCustomerSession(updated.id);
  return updated;
}
