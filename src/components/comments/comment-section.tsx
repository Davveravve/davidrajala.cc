import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

/// Server component — generic discussion thread for a project or gallery
/// item. Pulls comments newest-first; renders the post form for signed-in
/// customers and a sign-in nudge otherwise.
export async function CommentSection({
  parentType,
  parentId,
}: {
  parentType: "project" | "gallery";
  parentId: string;
}) {
  const [comments, customer] = await Promise.all([
    prisma.comment.findMany({
      where: { parentType, parentId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    getCurrentCustomer(),
  ]);

  return (
    <section className="container-page max-w-3xl pb-16">
      <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
        Comments
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight mb-6">
        {comments.length === 0
          ? "No comments yet"
          : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
      </h2>

      {customer ? (
        <CommentForm parentType={parentType} parentId={parentId} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center mb-6">
          <p className="text-sm text-[var(--color-fg-muted)]">
            <Link
              href="/store/login"
              className="text-[var(--color-accent)] hover:underline"
            >
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      {comments.length > 0 && (
        <ul className="mt-6 space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              id={c.id}
              authorId={c.customerId}
              authorName={c.customer?.name || c.customer?.email?.split("@")[0] || "Visitor"}
              body={c.body}
              createdAt={c.createdAt.toISOString()}
              currentCustomerId={customer?.id ?? null}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
