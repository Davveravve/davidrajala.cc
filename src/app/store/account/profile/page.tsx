import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CustomerProfileForm } from "@/components/store/customer-profile-form";

export const metadata = { title: "Profile settings" };

export default async function StoreProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/store/login");

  return (
    <section className="relative pt-32 pb-32">
      <div className="container-page max-w-2xl">
        <Link
          href="/store/account"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors mb-6"
        >
          <ChevronLeft size={14} />
          Back to account
        </Link>
        <div className="mb-10">
          <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
            Store account
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            Profile settings
          </h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Update your details, socials and password.
          </p>
        </div>

        <CustomerProfileForm
          initial={{
            id: customer.id,
            email: customer.email,
            name: customer.name,
            twitter: customer.twitter,
            github: customer.github,
            linkedin: customer.linkedin,
            website: customer.website,
          }}
        />
      </div>
    </section>
  );
}
