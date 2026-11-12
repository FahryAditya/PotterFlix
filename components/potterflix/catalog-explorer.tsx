"use client";

import { useMemo, useRef } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Search,
  Shield,
  Sparkles,
  TriangleAlert,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { TIER_CONFIGS, t } from "@/config/i18n";
import { ResourceCard } from "@/components/potterflix/resource-card";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type {
  NormalizedPotterItem,
  PotterEndpoint,
  RawBook,
  RawCharacter,
  RawHouse,
  RawSpell,
  SortOption,
} from "@/types/potter";

interface CatalogExplorerProps {
  endpoint: PotterEndpoint;
  rawRecords: NormalizedPotterItem[];
  loading: boolean;
  errorMessage: string | null;
  tier2Filter: string;
  tier3Filter: string;
  searchInput: string;
  sortBy: SortOption;
  max: number;
  page: number;
  onEndpointChange: (endpoint: PotterEndpoint) => void;
  onTier2Change: (val: string) => void;
  onTier3Change: (val: string) => void;
  onSearchChange: (val: string) => void;
  onSortChange: (val: SortOption) => void;
  onMaxChange: (val: number) => void;
  onPageChange: (nextPage: number) => void;
  onResetFilters: () => void;
  onRetry: () => void;
}

const RESOURCE_TABS: {
  id: PotterEndpoint;
  labelKey: string;
  Icon: typeof BookOpen;
}[] = [
  { id: "books", labelKey: "navBooks", Icon: BookOpen },
  { id: "characters", labelKey: "navCharacters", Icon: Users },
  { id: "houses", labelKey: "navHouses", Icon: Shield },
  { id: "spells", labelKey: "navSpells", Icon: WandSparkles },
];

/**
 * Multi-Tier Wizarding Encyclopedia supporting 3-tier filtering, sorting,
 * debounced API ?search=, official ?max= & ?page= pagination, and GSAP reveal.
 */
export function CatalogExplorer({
  endpoint,
  rawRecords,
  loading,
  errorMessage,
  tier2Filter,
  tier3Filter,
  searchInput,
  sortBy,
  max,
  page,
  onEndpointChange,
  onTier2Change,
  onTier3Change,
  onSearchChange,
  onSortChange,
  onMaxChange,
  onPageChange,
  onResetFilters,
  onRetry,
}: CatalogExplorerProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { profile, openDetailModal, toggleFavorite } = usePotterStore();

  const tierConfig = TIER_CONFIGS[endpoint];

  const filteredItems = useMemo(() => {
    let items = [...rawRecords];

    if (endpoint === "books") {
      if (tier2Filter === "early") {
        items = items.filter((i) => ((i.raw as RawBook).number || 1) <= 4);
      } else if (tier2Filter === "dark") {
        items = items.filter((i) => ((i.raw as RawBook).number || 1) >= 5);
      }
      if (tier3Filter === "short") {
        items = items.filter((i) => ((i.raw as RawBook).pages || 0) < 400);
      } else if (tier3Filter === "epic") {
        items = items.filter((i) => ((i.raw as RawBook).pages || 0) >= 400);
      }
    } else if (endpoint === "characters") {
      if (tier2Filter !== "all") {
        items = items.filter(
          (i) =>
            ((i.raw as RawCharacter).hogwartsHouse || "").toLowerCase() ===
            tier2Filter.toLowerCase()
        );
      }
      if (tier3Filter === "hasChildren") {
        items = items.filter((i) => {
          const kids = (i.raw as RawCharacter).children;
          return Array.isArray(kids) && kids.length > 0;
        });
      } else if (tier3Filter === "hasNickname") {
        items = items.filter((i) =>
          Boolean((i.raw as RawCharacter).nickname)
        );
      }
    } else if (endpoint === "houses") {
      if (tier2Filter !== "all") {
        items = items.filter(
          (i) =>
            ((i.raw as RawHouse).house || "").toLowerCase() ===
            tier2Filter.toLowerCase()
        );
      }
      if (tier3Filter === "singleColor") {
        items = items.filter((i) =>
          Array.isArray((i.raw as RawHouse).colors)
        );
      }
    } else if (endpoint === "spells") {
      if (tier2Filter !== "all") {
        items = items.filter((i) => {
          const use = ((i.raw as RawSpell).use || "").toLowerCase();
          if (tier2Filter === "curse") {
            return (
              use.includes("curse") ||
              use.includes("jinx") ||
              use.includes("hex") ||
              use.includes("disarm") ||
              use.includes("stun")
            );
          }
          if (tier2Filter === "defense") {
            return (
              use.includes("protect") ||
              use.includes("shield") ||
              use.includes("heal") ||
              use.includes("dementor") ||
              use.includes("patronus")
            );
          }
          return !use.includes("curse") && !use.includes("jinx");
        });
      }
      if (tier3Filter === "singleWord") {
        items = items.filter((i) => !i.title.trim().includes(" "));
      } else if (tier3Filter === "multiWord") {
        items = items.filter((i) => i.title.trim().includes(" "));
      }
    }

    if (sortBy === "az") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "za") {
      items.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "metricDesc") {
      items.sort(
        (a, b) =>
          ((b.raw as RawBook).pages || b.index || 0) -
          ((a.raw as RawBook).pages || a.index || 0)
      );
    }

    return items;
  }, [rawRecords, endpoint, tier2Filter, tier3Filter, sortBy]);

  // GSAP staggered entrance whenever filtered cards change
  useGSAP(
    () => {
      if (loading || filteredItems.length === 0) return;
      gsap.fromTo(
        ".gsap-reveal-card",
        { opacity: 0, y: 18, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          stagger: 0.03,
          ease: "power3.out",
          clearProps: "transform",
        }
      );
    },
    {
      scope: gridRef,
      dependencies: [
        loading,
        endpoint,
        tier2Filter,
        tier3Filter,
        sortBy,
        page,
        max,
        filteredItems.length,
      ],
    }
  );

  const canPrev = page > 1 && max > 0;
  const canNext = max > 0 && rawRecords.length >= max;

  return (
    <section id="catalogSection" className="scroll-mt-24 space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-brand-red" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">
            {t(profile.lang, "catalogHeading")}
          </h2>
          <span className="ml-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-neutral-400">
            {filteredItems.length} {t(profile.lang, "itemsSuffix")}
          </span>
        </div>
      </div>

      {/* Tier 1: Resource Endpoint Pills */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {t(profile.lang, "tier1Label")}
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex min-h-[24px] items-center gap-1 px-1 text-[11px] font-semibold text-[#FF4D58] hover:underline"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>{t(profile.lang, "resetFilters")}</span>
          </button>
        </div>

        <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-1">
          {RESOURCE_TABS.map(({ id, labelKey, Icon }) => {
            const active = endpoint === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onEndpointChange(id)}
                className={cn(
                  "flex min-h-[30px] shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-[#C80812] text-white shadow-[0_2px_12px_rgba(229,9,20,0.5)]"
                    : "bg-[#202020] text-neutral-200 hover:bg-[#2c2c2c]"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t(profile.lang, labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier 2 & Tier 3 Dynamic Contextual Sub-filters */}
      <div className="space-y-3.5 rounded-2xl border border-white/5 bg-[#181818] p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <span className="min-w-[150px] text-[11px] font-bold uppercase tracking-wider text-neutral-300">
            {tierConfig.tier2Label}
          </span>
          <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto">
            {tierConfig.tier2Options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onTier2Change(opt.id)}
                className={cn(
                  "min-h-[28px] shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  tier2Filter === opt.id
                    ? "bg-[#C80812] text-white shadow-[0_2px_10px_rgba(229,9,20,0.45)]"
                    : "bg-[#222226] text-neutral-200 hover:bg-[#2d2d33]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/5 pt-2.5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="min-w-[150px] text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              {tierConfig.tier3Label}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {tierConfig.tier3Options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onTier3Change(opt.id)}
                  className={cn(
                    "min-h-[28px] rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                    tier3Filter === opt.id
                      ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                      : "border-white/15 bg-[#121212] text-neutral-300 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search (?search=) */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t(profile.lang, "filterSearchPlaceholder")}
              placeholder={t(profile.lang, "filterSearchPlaceholder")}
              className="w-full rounded-full border border-white/15 bg-[#121212] py-1.5 pr-8 pl-8 text-xs text-white outline-none transition placeholder:text-neutral-400 focus:border-brand-red"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear filter search"
                className="absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-300 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Sort & Official API Pagination (?max & ?page) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#181818] p-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label
            htmlFor="catalogSortSelect"
            className="font-medium text-neutral-300"
          >
            {t(profile.lang, "sortBy")}
          </label>
          <select
            id="catalogSortSelect"
            aria-label={t(profile.lang, "sortBy")}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="min-h-[30px] cursor-pointer rounded-full border border-white/15 bg-neutral-800 px-3.5 py-1.5 text-neutral-100 outline-none hover:text-white"
          >
            <option value="default">{t(profile.lang, "sortDefault")}</option>
            <option value="az">{t(profile.lang, "sortAZ")}</option>
            <option value="za">{t(profile.lang, "sortZA")}</option>
            <option value="metricDesc">{t(profile.lang, "sortMetric")}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="catalogMaxSelect"
              className="text-[11px] text-neutral-300"
            >
              {t(profile.lang, "apiLimitLabel")}
            </label>
            <select
              id="catalogMaxSelect"
              aria-label={t(profile.lang, "apiLimitLabel")}
              value={max}
              onChange={(e) => onMaxChange(Number(e.target.value))}
              className="min-h-[28px] cursor-pointer rounded-full border border-white/15 bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-100 outline-none"
            >
              <option value={0}>{t(profile.lang, "allOption")}</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
              className="flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full bg-neutral-800 px-2.5 py-1 text-white transition hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="px-2 font-mono text-[11px] text-neutral-200">
              {t(profile.lang, "pageLabel")} {page}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
              className="flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full bg-neutral-800 px-2.5 py-1 text-white transition hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {errorMessage && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-red/50 bg-red-950/50 p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <TriangleAlert
              className="h-5 w-5 shrink-0 text-brand-red"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                {t(profile.lang, "errorTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-neutral-200">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-full bg-[#C80812] px-5 py-2 font-display text-xs font-bold uppercase text-white transition hover:bg-[#A8060E]"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(profile.lang, "retryBtn")}</span>
          </button>
        </div>
      )}

      {/* 6-Column Responsive Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6"
      >
        {loading ? (
          Array.from({ length: max > 0 ? Math.min(max, 12) : 12 }).map((_, i) => (
            <div key={`grid-skel-${i}`} className="space-y-2.5">
              <div className="skeleton-shimmer aspect-[2/3] rounded-xl border border-white/5" />
              <div className="skeleton-shimmer h-3.5 w-3/4 rounded" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded" />
            </div>
          ))
        ) : filteredItems.length === 0 && !errorMessage ? (
          <div className="col-span-full space-y-2 py-14 text-center">
            <Sparkles
              className="mx-auto h-7 w-7 text-neutral-600"
              aria-hidden="true"
            />
            <p className="text-xs text-neutral-400">
              {t(profile.lang, "emptyCatalogMsg")}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSaved = profile.favorites[item.endpoint].some(
              (f) => f.id === item.id
            );
            return (
              <ResourceCard
                key={item.id}
                item={item}
                isSaved={isSaved}
                onInspect={(target) =>
                  openDetailModal(target.endpoint, target.index)
                }
                onToggleFavorite={toggleFavorite}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
