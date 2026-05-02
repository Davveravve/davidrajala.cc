import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewForm } from "@/components/store/review-form";
import Link from "next/link";

/// Server component — renders all reviews for a product, the rating
/// summary, and (when applicable) the customer's review form.
export async function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, customer] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    getCurrentCustomer(),
  ]);

  const owned = customer
    ? await prisma.orderItem.findFirst({
        where: {
          productId,
          order: { customerId: customer.id, status: "paid" },
        },
        select: { id: true },
      })
    : null;

  const own = customer ? reviews.find((r) => r.customerId === customer.id) ?? null : null;

  const count = reviews.length;
  const avg =
    count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

  return (
    <section className="container-page max-w-3xl pb-16">
      <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
        Reviews
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight mb-6">
        What buyers are saying
      </h2>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-8 flex items-center gap-6">
        <div className="text-center">
          <div className="font-display text-4xl font-medium tabular-nums leading-none">
            {count > 0 ? avg.toFixed(1) : "—"}
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mt-1">
            {count} {count === 1 ? "review" : "reviews"}
          </div>
        </div>
        <div className="flex-1">
          <StarRating value={avg} size={22} />
          <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
            {count === 0
              ? "Be the first to review this product after you buy it."
              : `Based on ${count} verified ${count === 1 ? "buyer" : "buyers"}.`}
          </p>
        </div>
      </div>

      {customer ? (
        owned ? (
          <ReviewForm productId={productId} existing={own ? {
            rating: own.rating,
            title: own.title,
            body: own.body,
            id: own.id,
          } : null} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center mb-8">
            <p className="text-sm text-[var(--color-fg-muted)]">
              Reviews are open to verified buyers only.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center mb-8">
          <p className="text-sm text-[var(--color-fg-muted)]">
            <Link href="/store/login" className="text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>{" "}
            and buy this product to leave a review.
          </p>
        </div>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const initial = (r.customer?.name || r.customer?.email || "?")[0].toUpperCase();
            const name = r.customer?.name || r.customer?.email?.split("@")[0] || "Buyer";
            const isOwn = customer?.id === r.customerId;
            return (
              <li
                key={r.id}
                className={`rounded-2xl border p-5 ${
                  isOwn
                    ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
              >
                <header className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{name}</span>
                      {isOwn && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--color-fg-dim)]">
                      <StarRating value={r.rating} size={11} />
                      <time>
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
                </header>
                {r.title && (
                  <h3 className="font-medium text-sm mb-1.5">{r.title}</h3>
                )}
                {r.body && (
                  <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed whitespace-pre-wrap">
                    {r.body}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
