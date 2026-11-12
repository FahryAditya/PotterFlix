"use client";

import { useRef, useState } from "react";
import { Bookmark, Check, WandSparkles, Zap } from "lucide-react";
import { t } from "@/config/i18n";
import { gsap, useGSAP } from "@/lib/gsap";
import { normalizeItem } from "@/lib/normalize";
import { fetchRandomSpellFromApi } from "@/services/potter-api";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type { NormalizedPotterItem } from "@/types/potter";

interface SpellSandboxProps {
  spellsPool: NormalizedPotterItem[];
}

/**
 * Interactive Arcane Spell Caster Sandbox with GSAP SVG rune choreography
 * and live /[lang]/spells/random API integration.
 */
export function SpellSandbox({ spellsPool }: SpellSandboxProps) {
  const sigilRef = useRef<HTMLDivElement>(null);
  const { profile, toggleFavorite, showToast } = usePotterStore();
  const [castSpell, setCastSpell] = useState<NormalizedPotterItem | null>(null);
  const [castCount, setCastCount] = useState(0);
  const [casting, setCasting] = useState(false);

  const activeSpell = castSpell ?? spellsPool[0] ?? null;

  const isSaved = activeSpell
    ? profile.favorites.spells.some((f) => f.id === activeSpell.id)
    : false;

  useGSAP(
    () => {
      if (castCount === 0) return;
      gsap.fromTo(
        ".arcane-ring-outer",
        { rotate: 0, scale: 0.88 },
        { rotate: 120, scale: 1, duration: 0.75, ease: "back.out(1.7)" }
      );
      gsap.fromTo(
        ".arcane-ring-inner",
        { rotate: 0, scale: 1.1 },
        { rotate: -90, scale: 1, duration: 0.65, ease: "power3.out" }
      );
      gsap.fromTo(
        sigilRef.current,
        { boxShadow: "0 0 0px rgba(229,9,20,0)" },
        {
          boxShadow: "0 0 36px rgba(229,9,20,0.45)",
          duration: 0.35,
          yoyo: true,
          repeat: 1,
        }
      );
    },
    { scope: sigilRef, dependencies: [castCount] }
  );

  const handleCastRandomSpell = async () => {
    setCasting(true);
    try {
      const { data } = await fetchRandomSpellFromApi(profile.lang);
      const normalized = normalizeItem("spells", data, data.index ?? 0);
      setCastSpell(normalized);
      setCastCount((c) => c + 1);
    } catch (err) {
      if (spellsPool.length > 0) {
        const pick =
          spellsPool[Math.floor(Math.random() * spellsPool.length)];
        setCastSpell(pick);
        setCastCount((c) => c + 1);
      } else {
        showToast(
          err instanceof Error ? err.message : "Failed to cast spell"
        );
      }
    } finally {
      setCasting(false);
    }
  };

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#161618] p-6 shadow-2xl sm:p-8">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left: Interactive Spell Caster Controls */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-gold">
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t(profile.lang, "spellSpotlightTag")}</span>
          </div>

          <h3 className="font-display text-2xl font-extrabold text-white sm:text-4xl">
            {activeSpell ? activeSpell.title : "Expecto Patronum"}
          </h3>

          <p className="max-w-xl text-sm leading-relaxed text-neutral-300">
            {activeSpell
              ? activeSpell.subtitle
              : "Conjures a spirit guardian of positive energy to ward off Dementors."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={casting}
              onClick={handleCastRandomSpell}
              className="flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(229,9,20,0.45)] transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t(profile.lang, "castSpellBtn")}</span>
            </button>

            <button
              type="button"
              disabled={!activeSpell}
              onClick={() => activeSpell && toggleFavorite(activeSpell)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition disabled:opacity-50",
                isSaved
                  ? "border-brand-red bg-brand-red/15 text-white"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              {isSaved ? (
                <Check
                  className="h-3.5 w-3.5 text-brand-red"
                  aria-hidden="true"
                />
              ) : (
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {isSaved
                  ? t(profile.lang, "savedInMyList")
                  : t(profile.lang, "saveSpellBtn")}
              </span>
            </button>
          </div>
        </div>

        {/* Right: GSAP-Animated Arcane Sigil */}
        <div className="flex items-center justify-center lg:col-span-5">
          <div
            ref={sigilRef}
            className="relative flex aspect-square w-full max-w-xs flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1f1215] via-[#121212] to-[#1d180c] p-6 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.22),transparent_70%)]" />
            <svg
              viewBox="0 0 200 200"
              className="relative z-10 h-36 w-36 text-brand-gold drop-shadow-[0_0_16px_rgba(245,181,10,0.5)]"
            >
              <circle
                cx="100"
                cy="100"
                r="84"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.7"
                className="arcane-ring-outer origin-center"
              />
              <circle
                cx="100"
                cy="100"
                r="62"
                fill="none"
                stroke="#E50914"
                strokeWidth="2"
                opacity="0.85"
                className="arcane-ring-inner origin-center"
              />
              <polygon
                points="100,24 166,138 34,138"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="arcane-ring-outer origin-center"
              />
              <circle
                cx="100"
                cy="100"
                r="24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity="0.8"
              />
            </svg>
            <span className="relative z-10 mt-3 font-mono text-[11px] uppercase tracking-widest text-neutral-400">
              INDEX #{activeSpell ? activeSpell.index : 0} • INCANTATION
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
