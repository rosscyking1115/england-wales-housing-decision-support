// The single definition of the canonical origin.
//
// This existed as the same copy-pasted expression in four files
// (layout.tsx, robots.ts, sitemap.ts, structured-data.ts), each stripping only a
// trailing slash. When NEXT_PUBLIC_SITE_URL was set with a leading TAB in the
// deploy environment, that tab flowed straight into every string-concatenated
// URL: 7,134 sitemap <loc> entries, the robots.txt Host and Sitemap lines, and
// the JSON-LD url fields. Canonicals and og:url escaped only by accident,
// because Next passes those through `new URL()`, whose parser discards leading
// whitespace.
//
// So the fix is not to delete one character from one config value and hope. It
// is to make the value impossible to hold whitespace by the time anything
// concatenates it, in one place, with tests that fail if that stops being true.

const FALLBACK_ORIGIN = "http://localhost:3000";

/**
 * Normalise a configured site origin.
 *
 * A URL cannot legally contain raw whitespace, so any space, tab, newline or
 * carriage return reaching us came from a mis-set environment variable — a
 * trailing newline from a copy-paste, or a tab from a mis-escaped deploy
 * script. Strip it rather than trust it, then reject anything that still is not
 * a parseable URL so a malformed value degrades to the fallback instead of
 * silently shipping a broken origin into the sitemap.
 */
export function normaliseSiteUrl(raw: string | undefined | null): string {
  const cleaned = (raw ?? "").replace(/\s+/g, "").replace(/\/+$/, "");
  if (!cleaned) return FALLBACK_ORIGIN;
  try {
    new URL(cleaned);
  } catch {
    return FALLBACK_ORIGIN;
  }
  return cleaned;
}

// Referenced as a literal so Next inlines the value at build time.
export const SITE_URL = normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
