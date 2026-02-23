export function formatPrice(amount: string | number | null, currency = "IQD"): string {
  if (!amount) return "";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US").format(num) + " " + currency;
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function getCountdown(endAt: string): string {
  const end = new Date(endAt).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function getCityName(
  city: { name_ku: string; name_ar: string; name_en: string } | undefined,
  locale: string
): string {
  if (!city) return "";
  const key = `name_${locale}` as keyof typeof city;
  return (city[key] as string) || city.name_en;
}

export function getCategoryName(
  cat: { name_ku: string; name_ar: string; name_en: string } | undefined,
  locale: string
): string {
  if (!cat) return "";
  const key = `name_${locale}` as keyof typeof cat;
  return (cat[key] as string) || cat.name_en;
}

export function conditionColor(condition: string): string {
  const colors: Record<string, string> = {
    new: "bg-green-500",
    like_new: "bg-emerald-400",
    good: "bg-blue-500",
    fair: "bg-yellow-500",
    poor: "bg-red-500",
  };
  return colors[condition] || "bg-gray-400";
}

export function isRtl(locale: string): boolean {
  return locale === "ku" || locale === "ar";
}
