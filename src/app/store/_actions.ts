"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  signupCustomer,
  loginCustomer,
  clearCustomerSession,
  requireCustomer,
  updateCustomer,
  changeCustomerPassword,
  requestPasswordReset,
  consumePasswordReset,
} from "@/lib/customer-auth";

export async function customerSignupAction(_: unknown, formData: FormData) {
  try {
    await signupCustomer({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? ""),
      twitter: String(formData.get("twitter") ?? ""),
      github: String(formData.get("github") ?? ""),
      linkedin: String(formData.get("linkedin") ?? ""),
      website: String(formData.get("website") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Signup failed" };
  }
  redirect("/store/account");
}

export async function customerLoginAction(_: unknown, formData: FormData) {
  try {
    await loginCustomer({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Login failed" };
  }
  redirect("/store/account");
}

export async function customerLogoutAction() {
  await clearCustomerSession();
  revalidatePath("/store");
  redirect("/store");
}

/**
 * Request a password reset link.
 *
 * Always returns `{ ok: true }` to avoid leaking which emails exist.
 * For now, the reset link is logged to the server console with a
 * `[reset link]` prefix — wire up Resend (or similar) here later to
 * actually email the customer.
 */
export async function requestResetAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  try {
    const result = await requestPasswordReset(email);
    if (result) {
      // TODO: integrate Resend (or similar) and email this link to the customer.
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
      const link = `${baseUrl}/store/reset-password?token=${result.token}`;
      console.log(
        `[reset link] for ${result.email} (expires ${result.expiresAt.toISOString()}): ${link}`,
      );
    }
  } catch (err) {
    // Swallow errors so we don't leak which emails exist.
    console.error("[reset link] error:", err);
  }
  return { ok: true };
}

export async function consumeResetAction(_: unknown, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await consumePasswordReset(token, password);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reset failed" };
  }
  redirect("/store/account");
}

export async function updateProfileAction(_: unknown, formData: FormData) {
  try {
    const customer = await requireCustomer();
    await updateCustomer(customer.id, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      twitter: String(formData.get("twitter") ?? ""),
      github: String(formData.get("github") ?? ""),
      linkedin: String(formData.get("linkedin") ?? ""),
      website: String(formData.get("website") ?? ""),
    });
    revalidatePath("/store/account");
    revalidatePath("/store/account/profile");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function changePasswordAction(_: unknown, formData: FormData) {
  try {
    const customer = await requireCustomer();
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    await changeCustomerPassword(customer.id, currentPassword, newPassword);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Password change failed",
    };
  }
}
