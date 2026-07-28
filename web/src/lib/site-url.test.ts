import { describe, expect, it } from "vitest";
import { normaliseSiteUrl } from "./site-url";

const ORIGIN = "https://uk-housing-decision-support.vercel.app";
const FALLBACK = "http://localhost:3000";

describe("normaliseSiteUrl", () => {
  // The defect this exists for: NEXT_PUBLIC_SITE_URL was set with a leading TAB
  // in the deploy environment. The previous expression stripped only a trailing
  // slash, so the tab reached every string-concatenated URL — 7,134 sitemap
  // <loc> entries, the robots.txt Host and Sitemap lines, and the JSON-LD url
  // fields.
  it("strips a leading tab", () => {
    expect(normaliseSiteUrl(`\t${ORIGIN}`)).toBe(ORIGIN);
  });

  it.each([
    ["leading space", ` ${ORIGIN}`],
    ["trailing space", `${ORIGIN} `],
    ["trailing newline", `${ORIGIN}\n`],
    ["trailing carriage return", `${ORIGIN}\r`],
    ["surrounding whitespace", `\t ${ORIGIN}\r\n`],
    ["internal whitespace", `${ORIGIN.slice(0, 8)} ${ORIGIN.slice(8)}`],
  ])("strips %s", (_label, raw) => {
    expect(normaliseSiteUrl(raw)).toBe(ORIGIN);
  });

  it("strips trailing slashes, including repeated ones", () => {
    expect(normaliseSiteUrl(`${ORIGIN}/`)).toBe(ORIGIN);
    expect(normaliseSiteUrl(`${ORIGIN}///`)).toBe(ORIGIN);
  });

  it("strips whitespace and a trailing slash together", () => {
    expect(normaliseSiteUrl(`\t${ORIGIN}/\n`)).toBe(ORIGIN);
  });

  it("leaves an already-clean origin untouched", () => {
    expect(normaliseSiteUrl(ORIGIN)).toBe(ORIGIN);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty", ""],
    ["whitespace only", " \t\n"],
  ])("falls back when the value is %s", (_label, raw) => {
    expect(normaliseSiteUrl(raw)).toBe(FALLBACK);
  });

  it("falls back rather than shipping an unparseable origin", () => {
    expect(normaliseSiteUrl("not-a-url")).toBe(FALLBACK);
  });

  // Guards the property the whole fix rests on: whatever comes out must be safe
  // to concatenate straight into XML, robots.txt or JSON-LD.
  it("never returns a value containing whitespace", () => {
    for (const raw of [`\t${ORIGIN}`, `${ORIGIN}\n`, " ", "not-a-url", undefined]) {
      expect(normaliseSiteUrl(raw)).not.toMatch(/\s/);
    }
  });
});
