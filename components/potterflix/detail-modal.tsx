"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Loader2, X } from "lucide-react";
import { t } from "@/config/i18n";
import { PosterImage } from "@/components/potterflix/poster-image";
import { normalizeItem } from "@/lib/normalize";
import { fetchPotterResource } from "@/services/potter-api";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type {
  NormalizedPotterItem,
  RawBook,
  RawCharacter,
  RawHouse,
  RawPotterRecord,
  RawSpell,
} from "@/types/potter";

/**
 * Detail Inspector Modal fetching exact PotterAPI records via ?index=.
 */
export function DetailModal() {
  const { profile, detailTarget, closeDetailModal, toggleFavorite } =
    usePotterStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<NormalizedPotterItem | null>(null);

  useEffect(() => {
    if (!detailTarget) return;
    let active = true;

    const loadRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPotterResource<RawPotterRecord>({
          lang: profile.lang,
          endpoint: detailTarget.endpoint,
          index: detailTarget.index,
          channel: "detail-modal",
        });
        if (!active) return;
        setItem(normalizeItem(detailTarget.endpoint, res.data, detailTarget.index));
      } catch (err) {
        if (!active) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load detail.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecord();
    return () => {
      active = false;
    };
  }, [detailTarget, profile.lang]);

  const isSaved = item
    ? profile.favorites[item.endpoint].some((f) => f.id === item.id)
    : false;

  const renderAttributes = (target: NormalizedPotterItem) => {
    if (target.endpoint === "books") {
      const r = target.raw as RawBook;
      return (
        <>
          <p className="text-xs text-neutral-400">
            {t(profile.lang, "originalTitle")}:{" "}
            <span className="font-medium text-white">
              {r.originalTitle || r.title}
            </span>
          </p>
          <p className="text-xs text-neutral-400">
            {t(profile.lang, "releaseDate")}:{" "}
            <span className="font-medium text-white">{r.releaseDate}</span> •{" "}
            {t(profile.lang, "pages")}:{" "}
            <span className="font-bold text-brand-gold">{r.pages}</span>
          </p>
          <p className="pt-2 text-xs leading-relaxed text-neutral-300 sm:text-sm">
            {r.description || ""}
          </p>
        </>
      );
    }

    if (target.endpoint === "characters") {
      const r = target.raw as RawCharacter;
      const kids =
        Array.isArray(r.children) && r.children.length > 0
          ? r.children.join(", ")
          : t(profile.lang, "noneRecorded");

      return (
        <>
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-[10px] uppercase text-neutral-400">
                {t(profile.lang, "hogwartsHouse")}
              </span>
              <strong className="text-white">
                {r.hogwartsHouse || "Unknown"}
              </strong>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-[10px] uppercase text-neutral-400">
                {t(profile.lang, "portrayedBy")}
              </span>
              <strong className="text-white">
                {r.interpretedBy || "N/A"}
              </strong>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-[10px] uppercase text-neutral-400">
                {t(profile.lang, "birthdate")}
              </span>
              <strong className="text-white">{r.birthdate || "Unknown"}</strong>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-[10px] uppercase text-neutral-400">
                {t(profile.lang, "nickname")}
              </span>
              <strong className="text-white">{r.nickname || "None"}</strong>
            </div>
          </div>
          <p className="pt-2 text-xs text-neutral-400">
            {t(profile.lang, "children")}:{" "}
            <span className="text-neutral-200">{kids}</span>
          </p>
        </>
      );
    }

    if (target.endpoint === "houses") {
      const r = target.raw as RawHouse;
      const colors = Array.isArray(r.colors) ? r.colors.join(" & ") : "Classic";
      return (
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="rounded-xl bg-white/5 p-3">
            <span className="block text-[10px] uppercase text-neutral-400">
              {t(profile.lang, "founder")}
            </span>
            <strong className="text-white">{r.founder}</strong>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <span className="block text-[10px] uppercase text-neutral-400">
              {t(profile.lang, "houseAnimal")}
            </span>
            <strong className="text-white">{r.animal}</strong>
          </div>
          <div className="col-span-2 rounded-xl bg-white/5 p-3">
            <span className="block text-[10px] uppercase text-neutral-400">
              {t(profile.lang, "houseColors")}
            </span>
            <strong className="text-brand-gold">{colors}</strong>
          </div>
        </div>
      );
    }

    const r = target.raw as RawSpell;
    return (
      <p className="pt-2 text-sm leading-relaxed text-neutral-200">{r.use}</p>
    );
  };

  return (
    <AnimatePresence>
      {detailTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDetailModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-popover relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
          >
            <button
              type="button"
              onClick={closeDetailModal}
              aria-label="Close detail modal"
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-brand-red"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
              {loading ? (
                <div className="py-16 text-center text-xs text-neutral-400">
                  <Loader2
                    className="mx-auto mb-2 h-6 w-6 animate-spin text-brand-red"
                    aria-hidden="true"
                  />
                  <span>
                    {t(profile.lang, "fetchingRecord")}
                    {detailTarget.index}...
                  </span>
                </div>
              ) : error ? (
                <p className="py-8 text-center text-xs text-brand-red">
                  {error}
                </p>
              ) : item ? (
                <div className="flex flex-col items-start gap-6 sm:flex-row">
                  <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-white/15 shadow-xl sm:w-44">
                    <PosterImage
                      src={item.image}
                      alt={item.title}
                      fallbackTitle={item.title}
                      fallbackSubtitle={item.subtitle}
                      sizes="180px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-brand-red px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-extrabold text-white">
                      {item.title}
                    </h3>

                    {renderAttributes(item)}

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item)}
                        className={cn(
                          "flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-xs font-bold uppercase text-white transition",
                          isSaved
                            ? "border border-brand-red bg-neutral-800"
                            : "bg-brand-red hover:bg-red-700"
                        )}
                      >
                        {isSaved ? (
                          <Check
                            className="h-3.5 w-3.5 text-brand-red"
                            aria-hidden="true"
                          />
                        ) : (
                          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {isSaved
                            ? t(profile.lang, "savedInMyList")
                            : t(profile.lang, "addToMyList")}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
