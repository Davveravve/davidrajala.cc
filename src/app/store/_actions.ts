"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  signupCustomer,
  loginCustomer,
  clearCustomerSession,
} from "@/lib/customer-auth";

export async function customerSignupAction(_: unknown, formData: FormData) {
  try {
    await signupCustomer({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? ""),
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
