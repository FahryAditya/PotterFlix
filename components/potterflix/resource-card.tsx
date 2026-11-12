"use client";

import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { PosterImage } from "@/components/potterflix/poster-image";
import { cn } from "@/lib/utils";
import type { NormalizedPotterItem } from "@/types/potter";

interface ResourceCardProps {
  item: NormalizedPotterItem;
  isSaved: boolean;
  isCarousel?: boolean;
  onInspect: (item: NormalizedPotterItem) => void;
  onToggleFavorite: (item: NormalizedPotterItem) => void;
}

/**
 * Cinematic 2:3 PotterFlix poster card with spring hover, favorite toggle, and GSAP reveal hook.
 */
export function ResourceCard({
  item,
  isSaved,
  isCarousel = false,
  onInspect,
  onToggleFavorite,
}: ResourceCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      onClick={() => onInspect(item)}
      className={cn(
        "group cursor-pointer",
        isCarousel ? "w-[160px] flex-none sm:w-[195px]" : "gsap-reveal-card"
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#1E1E1E] transition-all duration-300 group-hover:scale-[1.03] group-hover:border-brand-red/70 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.85)]">
        <PosterImage
          src={item.image}
          alt={item.title}
          fallbackTitle={item.title}
          fallbackSubtitle={item.subtitle}
          className="object-cover"
        />

        <span className="absolute top-2.5 left-2.5 z-10 rounded border border-white/15 bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          {item.badge}
        </span>

        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-10 w-10 scale-75 transform items-center justify-center rounded-full bg-[#C80812] text-white shadow-lg transition-transform group-hover:scale-100">
            <Eye className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <h3 className="truncate text-xs font-semibold text-white transition group-hover:text-brand-red">
          {item.title}
        </h3>
        <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-300">
          <span className="truncate">{item.subtitle}</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item);
              }}
              aria-label={`Toggle favorite for ${item.title}`}
              className={cn(
                "inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full transition-transform active:scale-90",
                isSaved ? "text-brand-red" : "text-neutral-300 hover:text-brand-red"
              )}
            >
              <Heart
                className={cn("h-3.5 w-3.5", isSaved && "fill-brand-red")}
                aria-hidden="true"
              />
            </button>
            <span className="text-[10px] font-medium text-brand-gold">
              {item.metric}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
