const BASE = "http://localhost";

/** Only allow same-site paths as post-login destinations (no open redirects). */
export function safeNextPath(next: unknown, fallback = "/tabs"): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  // Browsers drop tabs and newlines and treat "\\" like "/", so "/\t/evil.com"
  // would otherwise end up as "//evil.com".
  if (/[\u0000-\u001f\\]/.test(next) || next.startsWith("//")) return fallback;
  try {
    return new URL(next, BASE).origin === BASE ? next : fallback;
  } catch {
    return fallback;
  }
}
