import { SUPPORTED_LANGUAGES } from "@/config/i18n";
import type {
  ApiLanguageCode,
  LanguageCode,
  PotterEndpoint,
  RawPotterRecord,
} from "@/types/potter";

const BASE_URL = "https://potterapi-fedeperin.vercel.app";
const VALID_ENDPOINTS: readonly PotterEndpoint[] = [
  "books",
  "characters",
  "houses",
  "spells",
];

const memoryCache = new Map<string, RawPotterRecord | RawPotterRecord[]>();
const channelControllers = new Map<string, AbortController>();

export function resolveApiLang(lang: LanguageCode): ApiLanguageCode {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  return found ? found.apiCode : "en";
}

export interface FetchPotterParams {
  lang?: LanguageCode;
  endpoint: PotterEndpoint;
  search?: string;
  max?: number;
  page?: number;
  index?: number | string | null;
  channel?: string;
}

export interface FetchPotterResult<T = RawPotterRecord | RawPotterRecord[]> {
  data: T;
  endpointUrl: string;
}

/**
 * Fetches resources from PotterAPI with parameter support (?search, ?max, ?page, ?index),
 * payload validation, per-channel AbortController cancellation, and in-memory caching.
 */
export async function fetchPotterResource<
  T extends RawPotterRecord | RawPotterRecord[] = RawPotterRecord | RawPotterRecord[],
>({
  lang = "en",
  endpoint = "books",
  search = "",
  max = 0,
  page = 1,
  index = null,
  channel,
}: FetchPotterParams): Promise<FetchPotterResult<T>> {
  if (!VALID_ENDPOINTS.includes(endpoint)) {
    throw new Error(`Invalid PotterAPI endpoint: ${String(endpoint)}`);
  }

  const apiLang = resolveApiLang(lang);
  const url = new URL(`${BASE_URL}/${apiLang}/${endpoint}`);

  if (index !== null && index !== undefined && String(index).trim() !== "") {
    const parsedIndex = Number(index);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      throw new Error(`Invalid ?index parameter: ${String(index)}`);
    }
    url.searchParams.set("index", String(parsedIndex));
  } else {
    if (search && search.trim().length > 0) {
      url.searchParams.set("search", search.trim());
    }
    if (Number(max) > 0) {
      url.searchParams.set("max", String(Math.floor(Number(max))));
      url.searchParams.set("page", String(Math.max(1, Math.floor(Number(page) || 1))));
    }
  }

  const cacheKey = url.toString();
  const endpointUrl = `/${apiLang}/${endpoint}${url.search}`;

  if (memoryCache.has(cacheKey)) {
    return {
      data: memoryCache.get(cacheKey) as T,
      endpointUrl,
    };
  }

  let controller: AbortController | undefined;
  if (channel) {
    channelControllers.get(channel)?.abort();
    controller = new AbortController();
    channelControllers.set(channel, controller);
  }

  try {
    const response = await fetch(cacheKey, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(
        `PotterAPI responded with HTTP ${response.status} (${response.statusText || "Request failed"})`
      );
    }

    const payload: unknown = await response.json();
    if (payload === null || typeof payload !== "object") {
      throw new Error("Malformed JSON structure received from PotterAPI.");
    }

    memoryCache.set(cacheKey, payload as RawPotterRecord | RawPotterRecord[]);
    return {
      data: payload as T,
      endpointUrl,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new Error(
      err instanceof Error ? err.message : "Network failure while querying PotterAPI."
    );
  }
}

/**
 * Fetches a single random spell directly from PotterAPI's /[lang]/spells/random endpoint.
 */
export async function fetchRandomSpellFromApi(
  lang: LanguageCode = "en"
): Promise<FetchPotterResult<RawPotterRecord>> {
  const apiLang = resolveApiLang(lang);
  const url = `${BASE_URL}/${apiLang}/spells/random`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`PotterAPI /random responded with HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Invalid random spell payload from PotterAPI.");
    }

    return {
      data: payload as RawPotterRecord,
      endpointUrl: `/${apiLang}/spells/random`,
    };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to summon a random spell."
    );
  }
}
