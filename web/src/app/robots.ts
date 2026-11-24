import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// AI-training and bulk-scraping crawlers. They walk every URL in the sitemap
// and each uncached page costs Vercel function CPU; none of them sends
// visitors. Search engines (Googlebot, Bingbot, etc.) are still allowed.
// robots.txt is advisory - the Vercel Firewall bot rules are the hard block.
const BLOCKED_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "FacebookBot",
  "PerplexityBot",
  "cohere-ai",
  "Diffbot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        // BFF proxy routes are for our own clients, not crawlers. /search and
        // /compare render per query string (an unbounded URL space that can't
        // be cached), so keep crawlers off them; the crawlable content is the
        // area/town/rent/rankings pages listed in the sitemap.
        disallow: ["/api/", "/search", "/compare"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
