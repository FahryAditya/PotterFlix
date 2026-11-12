"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Star, WandSparkles } from "lucide-react";
import { t } from "@/config/i18n";
import { PosterImage } from "@/components/potterflix/poster-image";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type { NormalizedPotterItem, RawBook } from "@/types/potter";

interface HeroBannerProps {
  slides: NormalizedPotterItem[];
}

/**
 * Hero Showcase Banner with immediate LCP image discovery, Framer Motion
 * slide transitions, vignette scrims, and accessible controls.
 */
export function HeroBanner({ slides }: HeroBannerProps) {
  const { profile, openDetailModal, toggleFavorite } = usePotterStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const safeIndex = slides.length > 0 ? slideIndex % slides.length : 0;
  const activeSlide = slides[safeIndex];
  const rawBook = (activeSlide?.raw ?? {}) as RawBook;

  const isSaved = activeSlide
    ? profile.favorites[activeSlide.endpoint].some((f) => f.id === activeSlide.id)
    : false;

  return (
    <section className="relative flex h-[78vh] max-h-[780px] min-h-[580px] w-full items-center overflow-hidden">
      {/* Backdrop Image */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0c0d10]">
        <AnimatePresence initial={false} mode="wait">
          {activeSlide && (
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 0.55, scale: 1.02 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative h-full w-full"
            >
              <PosterImage
                src={activeSlide.image}
                alt={activeSlide.title}
                fallbackTitle={activeSlide.title}
                fallbackSubtitle={activeSlide.subtitle}
                sizes="100vw"
                isLcp={safeIndex === 0}
                className="object-cover object-center"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="hero-vignette absolute inset-0" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1520px] px-4 pt-16 sm:px-8">
        <AnimatePresence initial={false} mode="wait">
          {activeSlide ? (
            <motion.div
              key={`hero-copy-${activeSlide.id}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2.5 text-xs tracking-wider text-neutral-300">
                <span className="rounded bg-[#C80812] px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-white shadow">
                  {activeSlide.badge}
                </span>
                <span className="rounded border border-white/15 bg-black/70 px-2.5 py-0.5 font-medium text-neutral-200 backdrop-blur-sm">
                  {rawBook.pages || 320} {t(profile.lang, "pages")} •{" "}
                  {rawBook.releaseDate || "Wizarding Classic"}
                </span>
                <span className="flex items-center gap-1 font-bold text-brand-gold">
                  <Star className="h-3 w-3 fill-brand-gold" aria-hidden="true" />
                  <span>9.4</span>
                </span>
              </div>

              <h1 className="font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                {activeSlide.title}
              </h1>

              <p className="line-clamp-3 max-w-xl text-xs leading-relaxed font-normal text-neutral-300 sm:text-sm">
                {rawBook.description || activeSlide.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    openDetailModal(activeSlide.endpoint, activeSlide.index)
                  }
                  className="flex items-center gap-2.5 rounded-full bg-[#C80812] px-7 py-3 font-display text-xs font-bold uppercase text-white shadow-[0_4px_20px_rgba(229,9,20,0.45)] transition hover:bg-[#A8060E] hover:shadow-[0_4px_25px_rgba(229,9,20,0.75)]"
                >
                  <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t(profile.lang, "heroExploreCta")}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleFavorite(activeSlide)}
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-neutral-900/80 px-6 py-3 font-display text-xs font-bold uppercase text-white backdrop-blur-md transition hover:border-white/40 hover:bg-neutral-800"
                >
                  {isSaved ? (
                    <Check
                      className="h-3.5 w-3.5 text-brand-red"
                      aria-hidden="true"
                    />
                  ) : (
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {isSaved
                      ? t(profile.lang, "heroSavedCta")
                      : t(profile.lang, "heroAddListCta")}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-2xl space-y-4">
              <div className="skeleton-shimmer h-6 w-48 rounded" />
              <div className="skeleton-shimmer h-14 w-3/4 rounded-lg" />
              <div className="skeleton-shimmer h-16 w-full rounded-lg" />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Dots (>= 24x24px accessible touch target) */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlideIndex(idx)}
              aria-label={`Hero slide ${idx + 1}`}
              aria-pressed={idx === safeIndex}
              className="flex min-h-[24px] min-w-[24px] cursor-pointer items-center justify-center px-1"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  idx === safeIndex
                    ? "w-8 bg-white"
                    : "w-3 bg-neutral-500 hover:bg-neutral-300"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
