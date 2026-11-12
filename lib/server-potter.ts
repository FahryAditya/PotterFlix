import { cacheLife } from "next/cache";
import { normalizeItem } from "@/lib/normalize";
import type { NormalizedPotterItem, RawBook } from "@/types/potter";

/**
 * Fetches initial English books on the server with Next.js Cache Components
 * so the Hero LCP image and initial catalog render immediately in SSR HTML.
 */
export async function getInitialBooks(): Promise<NormalizedPotterItem[]> {
  "use cache";
  cacheLife("hours");

  try {
    const response = await fetch(
      "https://potterapi-fedeperin.vercel.app/en/books",
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }

    return (payload as RawBook[]).map((raw, i) =>
      normalizeItem("books", raw, i)
    );
  } catch {
    return [];
  }
}
