/**
 * Helpers for the two-way chat thread system.
 *
 * Threads are keyed by the customer's email (lowercased + trimmed). This is
 * a stable identifier that lets us group ContactMessage rows into a single
 * conversation regardless of whether the visitor is logged in or anonymous.
 */

export const ADMIN_SENDER = "admin";
export const CUSTOMER_SENDER = "customer";

/**
 * Compute a stable per-conversation key for a given email (or already-known
 * thread identifier). Returns the email lowercased + trimmed.
 */
export function threadKeyFor(emailOrCustomerId: string): string {
  return (emailOrCustomerId ?? "").toLowerCase().trim();
}
