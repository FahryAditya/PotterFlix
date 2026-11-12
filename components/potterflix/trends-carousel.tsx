"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { t } from "@/config/i18n";
import { ResourceCard } from "@/components/potterflix/resource-card";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type { NormalizedPotterItem } from "@/types/potter";

interface TrendsCarouselProps {
  items: NormalizedPotterItem[];
  loading: boolean;
  source: "books" | "characters";
  onSourceChange: (source: "books" | "characters") => void;
}

/**
 * Horizontal Trends Now carousel with Popular Books / Iconic Wizards switcher.
 */
export function TrendsCarousel({
  items,
  loading,
  source,
  onSourceChange,
}: TrendsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { profile, openDetailModal, toggleFavorite } = usePotterStore();

  const scrollTrack = (offset: number) => {
    trackRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-4 w-4 text-brand-red" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">
            {t(profile.lang, "trendsHeading")}
          </h2>
        </div>

        <div className="flex items-center gap-5 text-xs font-semibold text-neutral-400">
          <button
            type="button"
            onClick={() => onSourceChange("books")}
            className={cn(
              "flex items-center gap-1.5 transition hover:text-brand-red",
              source === "books" && "text-white"
            )}
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span>{t(profile.lang, "trendBooks")}</span>
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("characters")}
            className={cn(
              "flex items-center gap-1.5 transition hover:text-white",
              source === "characters" && "text-white"
            )}
          >
            <Sparkles
              className={cn(
                "h-3.5 w-3.5",
                source === "characters" ? "text-brand-gold" : "text-neutral-400"
              )}
              aria-hidden="true"
            />
            <span>{t(profile.lang, "trendCharacters")}</span>
          </button>
        </div>
      </div>

      <div className="group/carousel relative">
        <button
          type="button"
          onClick={() => scrollTrack(-420)}
          aria-label="Scroll trends left"
          className="glass-btn absolute top-1/2 -left-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 shadow-lg transition-all group-hover/carousel:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => scrollTrack(420)}
          aria-label="Scroll trends right"
          className="glass-btn absolute top-1/2 -right-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 shadow-lg transition-all group-hover/carousel:opacity-100"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <div
          ref={trackRef}
          className="hide-scrollbar flex gap-4 overflow-x-auto scroll-smooth py-2 sm:gap-5"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`trend-skel-${i}`}
                  className="w-[160px] flex-none space-y-2.5 sm:w-[195px]"
                >
                  <div className="skeleton-shimmer aspect-[2/3] rounded-xl border border-white/5" />
                  <div className="skeleton-shimmer h-3.5 w-3/4 rounded" />
                  <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                </div>
              ))
            : items.map((item) => {
                const isSaved = profile.favorites[item.endpoint].some(
                  (f) => f.id === item.id
                );
                return (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    isSaved={isSaved}
                    isCarousel
                    onInspect={(target) =>
                      openDetailModal(target.endpoint, target.index)
                    }
                    onToggleFavorite={toggleFavorite}
                  />
                );
              })}
        </div>
      </div>
    </section>
  );
}
