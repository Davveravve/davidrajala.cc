import { prisma } from "./prisma";

/**
 * Append an entry to the activity log. Wrapped in try/catch so a failed log
 * write never aborts the surrounding admin action — auditing is best-effort.
 */
export async function logActivity(
  action: string,
  opts?: { entityType?: string; entityId?: string; label?: string },
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType: opts?.entityType ?? null,
        entityId: opts?.entityId ?? null,
        label: opts?.label ?? "",
      },
    });
  } catch {
    // swallow — logging must never break the user-facing action
  }
}
