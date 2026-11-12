"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe, Search, X } from "lucide-react";
import { SUPPORTED_LANGUAGES, t } from "@/config/i18n";
import { scrollToTarget } from "@/components/providers/smooth-scroll-provider";
import { cn } from "@/lib/utils";
import { getTotalFavoritesCount } from "@/services/storage-service";
import { usePotterStore } from "@/stores/use-potter-store";
import type { NavSection, PotterEndpoint } from "@/types/potter";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectEndpoint: (endpoint: PotterEndpoint) => void;
}

const NAV_ITEMS: { key: NavSection; labelKey: string }[] = [
  { key: "home", labelKey: "navHome" },
  { key: "books", labelKey: "navBooks" },
  { key: "characters", labelKey: "navCharacters" },
  { key: "houses", labelKey: "navHouses" },
  { key: "spells", labelKey: "navSpells" },
];

/**
 * Scroll-morphing glassmorphism navbar with Framer Motion layoutId indicators,
 * expandable API search pill, 7-language switcher, and Wizard Profile trigger.
 */
export function Navbar({
  searchQuery,
  onSearchChange,
  onSelectEndpoint,
}: NavbarProps) {
  const {
    profile,
    activeNav,
    setActiveNav,
    setLanguage,
    openMyListModal,
  } = usePotterStore();

  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<NavSection | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const langWrapperRef = useRef<HTMLDivElement>(null);

  const totalFavorites = getTotalFavoritesCount(profile.favorites);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onOutsideClick = (e: MouseEvent) => {
      if (
        langWrapperRef.current &&
        !langWrapperRef.current.contains(e.target as Node)
      ) {
        setLangOpen(false);
      }
    };
    document.addEventListener("click", onOutsideClick);
    return () => document.removeEventListener("click", onOutsideClick);
  }, []);

  const handleNavClick = (key: NavSection) => {
    if (key === "mylist") {
      openMyListModal();
      return;
    }
    if (key === "home") {
      setActiveNav("home");
      scrollToTarget(0);
      return;
    }
    onSelectEndpoint(key);
    scrollToTarget("#catalogSection");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-nav-scrolled" : "glass-nav-top"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1520px] items-center justify-between px-4 transition-all duration-300 sm:px-8",
          scrolled ? "py-2.5" : "py-4"
        )}
      >
        {/* Brand + Desktop Sliding Nav */}
        <div className="flex items-center space-x-6 lg:space-x-10">
          <button
            type="button"
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-1.5 font-display text-2xl font-black tracking-tight text-brand-red transition hover:brightness-110 sm:text-3xl"
          >
            <span>POTTERFLIX</span>
          </button>

          <nav
            onMouseLeave={() => setHoveredNav(null)}
            className="relative hidden select-none items-center space-x-1 text-xs font-semibold tracking-wide lg:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setHoveredNav(item.key)}
                  onClick={() => handleNavClick(item.key)}
                  className={cn(
                    "relative z-10 px-3.5 py-2 transition-colors duration-200",
                    isActive ? "text-white" : "text-neutral-400 hover:text-white"
                  )}
                >
                  {hoveredNav === item.key && (
                    <motion.span
                      layoutId="navHoverPill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-full bg-white/[0.08]"
                    />
                  )}
                  <span>{t(profile.lang, item.labelKey)}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navActiveBar"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute right-3 -bottom-1 left-3 h-[2.5px] rounded-full bg-brand-red shadow-[0_2px_12px_rgba(229,9,20,0.85)]"
                    />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onMouseEnter={() => setHoveredNav("mylist")}
              onClick={() => handleNavClick("mylist")}
              className="relative z-10 flex items-center gap-2 px-3.5 py-2 text-neutral-400 transition-colors duration-200 hover:text-white"
            >
              {hoveredNav === "mylist" && (
                <motion.span
                  layoutId="navHoverPill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full bg-white/[0.08]"
                />
              )}
              <span>{t(profile.lang, "navMyList")}</span>
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(229,9,20,0.75)]">
                {totalFavorites}
              </span>
            </button>
          </nav>
        </div>

        {/* Right Controls: Search Pill, 7-Lang Switcher, Wizard Profile */}
        <div className="flex items-center space-x-2.5 text-xs sm:space-x-4">
          {/* Expandable Search Pill */}
          <div
            className={cn(
              "relative flex items-center rounded-full border transition-all duration-300",
              searchOpen
                ? "border-white/15 bg-neutral-900/95 pl-1"
                : "border-transparent bg-transparent"
            )}
          >
            <button
              type="button"
              onClick={() => {
                const next = !searchOpen;
                setSearchOpen(next);
                if (next) {
                  setTimeout(() => searchInputRef.current?.focus(), 60);
                }
              }}
              aria-label="Toggle API search"
              className="z-10 p-2 text-neutral-300 transition hover:text-white"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t(profile.lang, "searchPlaceholder")}
              className={cn(
                "bg-transparent py-1.5 text-xs text-white outline-none transition-all duration-300 placeholder:text-neutral-500",
                searchOpen
                  ? "w-36 pr-2 opacity-100 sm:w-48"
                  : "pointer-events-none w-0 opacity-0"
              )}
            />
            {searchQuery && searchOpen && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="pr-2.5 text-neutral-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* 7-Language Switcher */}
          <div ref={langWrapperRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLangOpen((prev) => !prev);
              }}
              aria-label="Change language"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1.5 font-semibold text-neutral-200 transition hover:bg-white/[0.12]"
            >
              <Globe className="h-3.5 w-3.5 text-brand-red" aria-hidden="true" />
              <span className="text-[11px] uppercase">{profile.lang}</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-neutral-400 transition-transform",
                  langOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="glass-popover absolute right-0 z-50 mt-2.5 w-48 rounded-2xl p-2"
                >
                  <div className="mb-1 border-b border-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {t(profile.lang, "selectLanguage")}
                  </div>
                  <div className="space-y-0.5">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs transition",
                          l.code === profile.lang
                            ? "bg-brand-red font-bold text-white"
                            : "text-neutral-300 hover:bg-white/10"
                        )}
                      >
                        <span>{l.native}</span>
                        <span className="text-[10px] uppercase opacity-75">
                          {l.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wizard Profile Modal Trigger */}
          <button
            type="button"
            onClick={openMyListModal}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pr-3 pl-1.5 transition hover:bg-white/[0.12]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold/60 bg-gradient-to-br from-brand-red to-amber-700 font-display text-[11px] font-bold text-white">
              {(Array.from(profile.wizardName.trim())[0] || "W").toUpperCase()}
            </div>
            <span className="hidden max-w-[96px] truncate text-xs font-semibold text-neutral-200 group-hover:text-white sm:inline">
              {profile.wizardName}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="hide-scrollbar flex items-center justify-between gap-1.5 overflow-x-auto border-t border-white/5 bg-[#121212]/95 px-3 py-2 text-[11px] font-semibold backdrop-blur-md lg:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavClick(item.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 transition",
                isActive
                  ? "border border-brand-red/40 bg-brand-red/20 text-white"
                  : "text-neutral-400"
              )}
            >
              {t(profile.lang, item.labelKey)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => handleNavClick("mylist")}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-neutral-400"
        >
          <span>{t(profile.lang, "navMyList")}</span>
          <span className="rounded-full bg-brand-red px-1.5 text-[9px] text-white">
            {totalFavorites}
          </span>
        </button>
      </div>
    </header>
  );
}
