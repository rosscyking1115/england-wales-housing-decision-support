// Server-side client for the public FastAPI v2 service (api/).
// The website is a pure HTTP client of the API — no direct DuckDB access.
// Client components never import this; they call the same-origin BFF routes
// under /api/* which proxy here (hides the API origin, sidesteps CORS).

import { cache } from "react";
import type {
  Area,
  AreaIndexResponse,
  ListingCheckRequest,
  ListingCheckResponse,
  Meta,
  ResolveResponse,
  SearchRequest,
  SearchResponse,
} from "./types";

const API_BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

// Cached GETs never revalidate on a timer: the dataset only changes when the
// API image is rebuilt, and a website redeploy clears the cache anyway.
const UNTIL_REDEPLOY = false as const;

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`API ${status}: ${detail}`);
    this.name = "ApiError";
  }
}

async function readDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : res.statusText;
  } catch {
    return res.statusText;
  }
}

async function getJson<T>(path: string, revalidate: number | false = UNTIL_REDEPLOY): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new ApiError(res.status, await readDetail(res));
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    // POST is not cached by Next; results vary by weights/filters.
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await readDetail(res));
  return res.json() as Promise<T>;
}

export const getMeta = cache((): Promise<Meta> => getJson<Meta>("/v2/meta"));

// Deduped per-request so a page + its generateMetadata share one fetch.
export const getArea = cache(
  (msoa: string): Promise<Area> =>
    getJson<Area>(`/v2/areas/${encodeURIComponent(msoa)}`),
);

/** getArea, but a clean null for unknown codes instead of throwing. */
export async function getAreaOrNull(msoa: string): Promise<Area | null> {
  try {
    return await getArea(msoa);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// The whole dataset in one GET, for the hubs / sitemap / link mesh.
// (Was 37 POSTs against /v1/search before the index endpoint.)
//
// The index is ~13.8 MB, over Next's 2 MB data-cache item limit, so the
// fetch-level revalidate never actually cached it: every town/rent/rankings
// render re-downloaded and re-parsed the full payload. That was the bulk of
// the Vercel Fluid Active CPU burn (Nov 2026). Hold it in module scope instead,
// so each server instance (and each build worker) fetches it once. A failed
// fetch clears the memo so the next request retries.
let allAreasPromise: Promise<Area[]> | null = null;

export function getAllAreas(): Promise<Area[]> {
  if (!allAreasPromise) {
    allAreasPromise = (async () => {
      // force-cache (not no-store): no-store would opt every caller out of
      // static rendering. Next will still decline to store an item this big
      // in its data cache - the module-scope memo is what does the work.
      const res = await fetch(`${API_BASE_URL}/v2/areas/index`, {
        cache: "force-cache",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new ApiError(res.status, await readDetail(res));
      return ((await res.json()) as AreaIndexResponse).areas;
    })().catch((err) => {
      allAreasPromise = null;
      throw err;
    });
  }
  return allAreasPromise;
}

export function resolvePostcode(postcode: string): Promise<ResolveResponse> {
  return getJson<ResolveResponse>(
    `/v2/areas/resolve?postcode=${encodeURIComponent(postcode)}`,
    0, // resolve is user-driven; don't cache stale postcode lookups
  );
}

export function search(req: SearchRequest): Promise<SearchResponse> {
  return postJson<SearchResponse>("/v2/search", req);
}

export function listingCheck(
  req: ListingCheckRequest,
): Promise<ListingCheckResponse> {
  return postJson<ListingCheckResponse>("/v2/listing-check", req);
}

export { ApiError };
