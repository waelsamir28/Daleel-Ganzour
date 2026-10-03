export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}
export function cleanPhone(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[\s()-]/g, "");
}
export function validPhone(value: string) { return /^(?:01[0125]\d{8}|\+?20\d{10}|0\d{8,10})$/.test(value); }
export function validId(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }

const attempts = new Map<string, { count: number; until: number }>();
export function rateLimit(request: Request, bucket: string, max: number, windowMs = 15 * 60 * 1000) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  if (attempts.size > 2000) for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const current = attempts.get(key);
  if (!current || current.until < now) { attempts.set(key, { count: 1, until: now + windowMs }); return false; }
  current.count += 1;
  return current.count > max;
}
