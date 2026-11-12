"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CatalogExplorer } from "@/components/potterflix/catalog-explorer";
import { Footer } from "@/components/potterflix/footer";
import { HeroBanner } from "@/components/potterflix/hero-banner";
import { Navbar } from "@/components/potterflix/navbar";
import { SpellSandbox } from "@/components/potterflix/spell-sandbox";
import { ToastNotification } from "@/components/potterflix/toast";
import { TrendsCarousel } from "@/components/potterflix/trends-carousel";
import { normalizeItem } from "@/lib/normalize";
import { fetchPotterResource } from "@/services/potter-api";
import { usePotterStore } from "@/stores/use-potter-store";
import type {
  NormalizedPotterItem,
  PotterEndpoint,
  RawPotterRecord,
  SortOption,
} from "@/types/potter";

const DetailModal = dynamic(
  () =>
    import("@/components/potterflix/detail-modal").then((m) => m.DetailModal),
  { ssr: false }
);

const MyListModal = dynamic(
  () =>
    import("@/components/potterflix/my-list-modal").then((m) => m.MyListModal),
  { ssr: false }
);

interface PotterFlixExplorerProps {
  initialBooks?: NormalizedPotterItem[];
}

/**
 * Main PotterFlix client orchestrator combining SSR-seeded initial books for
 * fast LCP with 7-language PotterAPI fetching, filtering, and localStorage state.
 */
export function PotterFlixExplorer({
  initialBooks = [],
}: PotterFlixExplorerProps) {
  const {
    hydrated,
    profile,
    activeEndpoint,
    hydrateFromStorage,
    setActiveEndpoint,
  } = usePotterStore();

  const hasInitialBooks = initialBooks.length > 0;
  const skippedInitialHero = useRef(false);
  const skippedInitialTrends = useRef(false);
  const skippedInitialCatalog = useRef(false);

  // Catalog State
  const [tier2Filter, setTier2Filter] = useState("all");
  const [tier3Filter, setTier3Filter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [max, setMax] = useState(12);
  const [page, setPage] = useState(1);

  const [catalogRecords, setCatalogRecords] = useState<NormalizedPotterItem[]>(
    () => (hasInitialBooks ? initialBooks.slice(0, 12) : [])
  );
  const [catalogLoading, setCatalogLoading] = useState(!hasInitialBooks);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Hero & Trends State
  const [heroSlides, setHeroSlides] = useState<NormalizedPotterItem[]>(() =>
    hasInitialBooks ? initialBooks.slice(0, 4) : []
  );
  const [trendSource, setTrendSource] = useState<"books" | "characters">(
    "books"
  );
  const [trendItems, setTrendItems] = useState<NormalizedPotterItem[]>(() =>
    hasInitialBooks ? initialBooks.slice(0, 10) : []
  );
  const [trendsLoading, setTrendsLoading] = useState(!hasInitialBooks);

  // Spells Sandbox Pool
  const [spellsPool, setSpellsPool] = useState<NormalizedPotterItem[]>([]);

  // Hydrate LocalStorage state once on mount
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // Debounce ?search= query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Hero Slides (books) whenever language changes
  useEffect(() => {
    if (!hydrated) return;
    if (
      !skippedInitialHero.current &&
      hasInitialBooks &&
      profile.lang === "en"
    ) {
      skippedInitialHero.current = true;
      return;
    }
    skippedInitialHero.current = true;

    let active = true;

    const loadHero = async () => {
      try {
        const { data } = await fetchPotterResource<RawPotterRecord[]>({
          lang: profile.lang,
          endpoint: "books",
          max: 4,
          page: 1,
          channel: "hero",
        });
        if (!active) return;
        const list = Array.isArray(data) ? data : [data];
        setHeroSlides(list.map((raw, i) => normalizeItem("books", raw, i)));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.warn("Hero load warning:", err);
      }
    };

    loadHero();
    return () => {
      active = false;
    };
  }, [hydrated, hasInitialBooks, profile.lang]);

  // Load Trends Carousel
  useEffect(() => {
    if (!hydrated) return;
    if (
      !skippedInitialTrends.current &&
      hasInitialBooks &&
      profile.lang === "en" &&
      trendSource === "books"
    ) {
      skippedInitialTrends.current = true;
      return;
    }
    skippedInitialTrends.current = true;

    let active = true;

    const loadTrends = async () => {
      setTrendsLoading(true);
      try {
        const { data } = await fetchPotterResource<RawPotterRecord[]>({
          lang: profile.lang,
          endpoint: trendSource,
          max: 10,
          page: 1,
          channel: "trends",
        });
        if (!active) return;
        const list = Array.isArray(data) ? data : [data];
        setTrendItems(list.map((raw, i) => normalizeItem(trendSource, raw, i)));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.warn("Trends load warning:", err);
      } finally {
        if (active) setTrendsLoading(false);
      }
    };

    loadTrends();
    return () => {
      active = false;
    };
  }, [hydrated, hasInitialBooks, profile.lang, trendSource]);

  // Load Spells Pool for Sandbox
  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    const loadSpells = async () => {
      try {
        const { data } = await fetchPotterResource<RawPotterRecord[]>({
          lang: profile.lang,
          endpoint: "spells",
          channel: "spells-pool",
        });
        if (!active) return;
        const list = Array.isArray(data) ? data : [data];
        setSpellsPool(list.map((raw, i) => normalizeItem("spells", raw, i)));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.warn("Spells pool warning:", err);
      }
    };

    loadSpells();
    return () => {
      active = false;
    };
  }, [hydrated, profile.lang]);

  // Load Main Catalog Data
  useEffect(() => {
    if (!hydrated) return;
    if (
      !skippedInitialCatalog.current &&
      hasInitialBooks &&
      profile.lang === "en" &&
      activeEndpoint === "books" &&
      !debouncedSearch &&
      max === 12 &&
      page === 1 &&
      retryToken === 0
    ) {
      skippedInitialCatalog.current = true;
      return;
    }
    skippedInitialCatalog.current = true;

    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const { data } = await fetchPotterResource({
          lang: profile.lang,
          endpoint: activeEndpoint,
          search: debouncedSearch,
          max,
          page,
          channel: "catalog",
        });
        if (!active) return;

        const list = Array.isArray(data) ? data : [data];
        const offset = max > 0 ? (page - 1) * max : 0;
        setCatalogRecords(
          list.map((raw, i) => normalizeItem(activeEndpoint, raw, offset + i))
        );
      } catch (err) {
        if (!active) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setCatalogRecords([]);
        setCatalogError(
          err instanceof Error
            ? err.message
            : "Network error while contacting PotterAPI."
        );
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    loadCatalog();
    return () => {
      active = false;
    };
  }, [
    hydrated,
    hasInitialBooks,
    profile.lang,
    activeEndpoint,
    debouncedSearch,
    max,
    page,
    retryToken,
  ]);

  const handleSelectEndpoint = useCallback(
    (endpoint: PotterEndpoint) => {
      setActiveEndpoint(endpoint);
      setTier2Filter("all");
      setTier3Filter("all");
      setPage(1);
    },
    [setActiveEndpoint]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setTier2Filter("all");
    setTier3Filter("all");
    setSearchInput("");
    setDebouncedSearch("");
    setSortBy("default");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar
        searchQuery={searchInput}
        onSearchChange={handleSearchChange}
        onSelectEndpoint={handleSelectEndpoint}
      />

      <main id="top" className="w-full overflow-x-hidden">
        <HeroBanner slides={heroSlides} />

        <div className="mx-auto max-w-[1520px] space-y-12 px-4 pb-24 sm:px-8">
          <TrendsCarousel
            items={trendItems}
            loading={trendsLoading}
            source={trendSource}
            onSourceChange={setTrendSource}
          />

          <CatalogExplorer
            endpoint={activeEndpoint}
            rawRecords={catalogRecords}
            loading={catalogLoading}
            errorMessage={catalogError}
            tier2Filter={tier2Filter}
            tier3Filter={tier3Filter}
            searchInput={searchInput}
            sortBy={sortBy}
            max={max}
            page={page}
            onEndpointChange={handleSelectEndpoint}
            onTier2Change={setTier2Filter}
            onTier3Change={setTier3Filter}
            onSearchChange={handleSearchChange}
            onSortChange={setSortBy}
            onMaxChange={(nextMax) => {
              setMax(nextMax);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
            onResetFilters={handleResetFilters}
            onRetry={() => setRetryToken((t) => t + 1)}
          />

          <SpellSandbox spellsPool={spellsPool} />
        </div>
      </main>

      <Footer />

      <DetailModal />
      <MyListModal />
      <ToastNotification />
    </div>
  );
}
