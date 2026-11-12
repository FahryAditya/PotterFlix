"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Sparkles, Trash2, X } from "lucide-react";
import { t } from "@/config/i18n";
import { PosterImage } from "@/components/potterflix/poster-image";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type { PotterEndpoint } from "@/types/potter";

const FAV_CATEGORIES: { id: PotterEndpoint; labelKey: string }[] = [
  { id: "books", labelKey: "navBooks" },
  { id: "characters", labelKey: "navCharacters" },
  { id: "houses", labelKey: "navHouses" },
  { id: "spells", labelKey: "navSpells" },
];

function MyListModalContent() {
  const {
    profile,
    closeMyListModal,
    setWizardName,
    removeFavorite,
    clearFavorites,
    openDetailModal,
  } = usePotterStore();

  const [nameInput, setNameInput] = useState(profile.wizardName);
  const [activeTab, setActiveTab] = useState<PotterEndpoint>("books");

  const items = profile.favorites[activeTab] ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setWizardName(nameInput);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      onClick={(e) => e.stopPropagation()}
      className="glass-popover relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-brand-gold" aria-hidden="true" />
          <h3 className="font-display text-base font-bold text-white sm:text-lg">
            {t(profile.lang, "profileModalTitle")}
          </h3>
        </div>
        <button
          type="button"
          onClick={closeMyListModal}
          aria-label="Close my list modal"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-red"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[82vh] space-y-6 overflow-y-auto p-6">
        {/* Wizard Name Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-stretch gap-3 rounded-xl border border-white/10 bg-[#141416] p-4 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <label
              htmlFor="wizardNameInput"
              className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-neutral-400"
            >
              {t(profile.lang, "wizardNameLabel")}
            </label>
            <input
              id="wizardNameInput"
              type="text"
              maxLength={32}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t(profile.lang, "wizardNamePlaceholder")}
              className="w-full rounded-lg border border-white/10 bg-[#1e1e22] px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-brand-red px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-700 sm:self-end"
          >
            {t(profile.lang, "saveNameBtn")}
          </button>
        </form>

        {/* 4-Category Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-neutral-300">
              {t(profile.lang, "saved4CategoriesTitle")}
            </h4>
            <button
              type="button"
              onClick={clearFavorites}
              className="flex items-center gap-1 text-[11px] text-neutral-400 transition hover:text-brand-red"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t(profile.lang, "clearAllFavs")}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FAV_CATEGORIES.map((cat) => {
              const active = activeTab === cat.id;
              const count = profile.favorites[cat.id]?.length ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition",
                    active
                      ? "bg-brand-red text-white"
                      : "bg-[#202024] text-neutral-300 hover:bg-[#2a2a30]"
                  )}
                >
                  <span>{t(profile.lang, cat.labelKey)}</span>
                  <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid min-h-[140px] grid-cols-1 gap-3 sm:grid-cols-2">
            {items.length === 0 ? (
              <p className="col-span-full py-8 text-center text-xs text-neutral-400">
                {t(profile.lang, "emptyCategoryMsg")}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg">
                      <PosterImage
                        src={item.image}
                        alt={item.title}
                        fallbackTitle={item.title}
                        fallbackSubtitle={item.subtitle}
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] text-neutral-400">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        closeMyListModal();
                        openDetailModal(item.endpoint, item.index);
                      }}
                      aria-label={`Inspect ${item.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-white transition hover:bg-brand-gold hover:text-black"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFavorite(item.endpoint, item.id)}
                      aria-label={`Remove ${item.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-white transition hover:bg-brand-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Wizard Profile & 4-Category Saved Favorites Modal persisted via LocalStorage.
 */
export function MyListModal() {
  const { isMyListOpen, closeMyListModal } = usePotterStore();

  return (
    <AnimatePresence>
      {isMyListOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeMyListModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <MyListModalContent />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
