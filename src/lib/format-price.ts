/// Format a price stored in minor units (öre/cents) for display.
export function formatPrice(amount: number, currency: string = "SEK"): string {
  const major = amount / 100;
  try {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

/// Format a file size in bytes for display.
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

/// Map a category string to a human label.
export function categoryLabel(category: string): string {
  switch (category) {
    case "game":
      return "Game";
    case "asset":
      return "Asset pack";
    case "program":
      return "Program";
    default:
      return "Other";
  }
}
