"use client";

import { useRef, useState } from "react";
import { Star, Zap } from "lucide-react";
import { scrollToTarget } from "@/components/providers/smooth-scroll-provider";
import { t } from "@/config/i18n";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { usePotterStore } from "@/stores/use-potter-store";
import type { LanguageCode } from "@/types/potter";

const FOOTER_FLAGS: { code: LanguageCode; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "uk", flag: "🇺🇦", label: "Українська" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

/**
 * PotterFlix Wizarding Landscape Footer with GSAP ScrollTrigger parallax,
 * Owl Post newsletter form, and 7-language switcher synced with Zustand.
 */
export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const { profile, setLanguage, showToast } = usePotterStore();

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        ".pf-layer-sky",
        { y: 24 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        ".pf-layer-mid",
        { y: 14 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );
    },
    { scope: footerRef }
  );

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!isValid) {
      emailRef.current?.focus();
      showToast(t(profile.lang, "owlToastError"));
      return;
    }

    setEmail("");
    showToast(t(profile.lang, "owlToastSuccess"));
  };

  return (
    <footer
      ref={footerRef}
      id="potterflix-footer"
      className="relative w-full overflow-hidden bg-[#121212] font-sans text-white"
    >
      {/* Illustrated Wizarding Horizon (SVG Landscape) */}
      <div
        className="pointer-events-none relative h-[130px] w-full overflow-hidden leading-none sm:h-[195px]"
        aria-hidden="true"
      >
        <svg
          className="block h-full w-full"
          viewBox="0 0 1440 230"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="pfHillBackGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#191922" />
              <stop offset="50%" stopColor="#221824" />
              <stop offset="100%" stopColor="#191922" />
            </linearGradient>
            <linearGradient
              id="pfHillFrontGrad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#1B1B22" />
              <stop offset="100%" stopColor="#141418" />
            </linearGradient>
            <linearGradient id="pfRimGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E50914" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#F5B50A" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E50914" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Layer 1: Starry Sky & Floating Golden Snitch */}
          <g className="pf-layer-sky">
            <circle cx="210" cy="48" r="1.5" fill="#F5B50A" opacity="0.6" />
            <circle cx="480" cy="32" r="2" fill="#FFFFFF" opacity="0.35" />
            <circle cx="960" cy="42" r="1.8" fill="#F5B50A" opacity="0.7" />
            <circle cx="1220" cy="28" r="1.5" fill="#FFFFFF" opacity="0.4" />

            <g className="pf-snitch" transform="translate(935, 58)">
              <path
                className="pf-snitch__wing-left"
                d="M-6,0 C-22,-14 -38,-8 -42,-2 C-30,2 -18,4 -6,2 Z"
                fill="#F5B50A"
                opacity="0.85"
              />
              <path
                className="pf-snitch__wing-right"
                d="M6,0 C22,-14 38,-8 42,-2 C30,2 18,4 6,2 Z"
                fill="#F5B50A"
                opacity="0.85"
              />
              <circle cx="0" cy="1" r="5.5" fill="#F5B50A" />
              <circle cx="-1.5" cy="-0.5" r="1.8" fill="#FFF6CC" />
            </g>
          </g>

          {/* Layer 2: Back Rolling Hill + Hogwarts Towers + Spinning Astrolabe */}
          <g className="pf-layer-mid">
            <g transform="translate(655, 52)" fill="#1E1E28">
              <rect x="18" y="45" width="16" height="55" />
              <polygon points="16,45 26,18 36,45" />
              <rect x="42" y="32" width="22" height="68" />
              <polygon points="39,32 53,2 67,32" />
              <rect x="72" y="48" width="18" height="52" />
              <polygon points="70,48 81,22 92,48" />
              <rect
                x="24"
                y="55"
                width="3"
                height="6"
                fill="#F5B50A"
                opacity="0.75"
              />
              <rect
                x="51"
                y="46"
                width="4"
                height="7"
                fill="#F5B50A"
                opacity="0.85"
              />
              <rect
                x="51"
                y="60"
                width="4"
                height="7"
                fill="#F5B50A"
                opacity="0.55"
              />
              <rect
                x="79"
                y="58"
                width="3"
                height="6"
                fill="#F5B50A"
                opacity="0.75"
              />
            </g>

            {/* Spinning Magical Astrolabe */}
            <g transform="translate(788, 92)">
              <circle
                cx="0"
                cy="0"
                r="24"
                fill="none"
                stroke="#2C2C3A"
                strokeWidth="2.5"
              />
              <circle
                cx="0"
                cy="0"
                r="17"
                fill="none"
                stroke="#F5B50A"
                strokeWidth="1"
                opacity="0.45"
              />
              <g
                className="pf-astrolabe-spokes"
                stroke="#363646"
                strokeWidth="1.5"
              >
                <line x1="0" y1="-24" x2="0" y2="24" />
                <line x1="-24" y1="0" x2="24" y2="0" />
                <line x1="-17" y1="-17" x2="17" y2="17" />
                <line x1="-17" y1="17" x2="17" y2="-17" />
              </g>
              <circle cx="0" cy="0" r="3" fill="#E50914" />
            </g>

            {/* Forbidden Forest Trees */}
            <g fill="#1D1D26">
              <circle cx="310" cy="112" r="11" />
              <rect x="308.5" y="120" width="3" height="16" />
              <circle cx="332" cy="118" r="8" />
              <rect x="330.8" y="124" width="2.4" height="14" />
              <circle cx="1075" cy="108" r="12" />
              <rect x="1073.5" y="118" width="3" height="18" />
              <circle cx="1102" cy="115" r="8.5" />
              <rect x="1100.8" y="122" width="2.4" height="14" />
            </g>

            {/* Back Hill Curve */}
            <path
              d="M0,145 C240,95 430,165 720,122 C990,82 1210,148 1440,115 L1440,230 L0,230 Z"
              fill="url(#pfHillBackGrad)"
            />
          </g>

          {/* Layer 3: Foreground Hill + Nimbus 2000 & Sorting Hat */}
          <g className="pf-layer-front">
            {/* Nimbus 2000 Broomstick (Left Hill) */}
            <g transform="translate(148, 128) rotate(-11)">
              <path
                d="M0,0 C35,-3 72,-2 105,1"
                stroke="#E50914"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="96" y="-2.5" width="4" height="7" rx="1" fill="#F5B50A" />
              <path
                d="M100,1 L136,-8 C140,-2 140,5 136,11 L100,2 Z"
                fill="#2A2A36"
                stroke="#E50914"
                strokeWidth="1.2"
              />
            </g>

            {/* Sorting Hat (Right Hill) */}
            <g transform="translate(1255, 114) rotate(7)">
              <ellipse cx="0" cy="18" rx="34" ry="6.5" fill="#E50914" />
              <path
                d="M-21,17 L-9,-12 C-5,-22 8,-24 16,-14 L9,-5 L21,17 Z"
                fill="#E50914"
              />
              <path
                d="M-11,5 Q0,9 11,4"
                stroke="#141418"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* Foreground Hill Curve + Luminous Rim Highlight */}
            <path
              d="M0,158 C210,115 470,185 760,145 C1030,108 1240,162 1440,132 L1440,230 L0,230 Z"
              fill="url(#pfHillFrontGrad)"
            />
            <path
              d="M0,158 C210,115 470,185 760,145 C1030,108 1240,162 1440,132"
              fill="none"
              stroke="url(#pfRimGlow)"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>

      {/* Main Footer Body */}
      <div className="bg-[#141418] px-6 pt-9 pb-11">
        <div className="mx-auto max-w-[1220px]">
          {/* 4-Column Top Grid */}
          <div className="grid grid-cols-1 gap-8 pb-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1.1fr] lg:gap-10">
            {/* Column 1: Newsletter (Owl Post) */}
            <div>
              <h4 className="mb-4 font-display text-sm font-bold tracking-tight text-white">
                {t(profile.lang, "newsletterTitle")}
              </h4>
              <form
                onSubmit={handleSubscribe}
                noValidate
                className="flex max-w-[310px] flex-col items-start gap-3"
              >
                <label htmlFor="pfEmailInput" className="sr-only">
                  Your owl post email
                </label>
                <input
                  ref={emailRef}
                  id="pfEmailInput"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(profile.lang, "emailPlaceholder")}
                  required
                  className="w-full rounded-md border border-white/[0.08] bg-[#1E1E26] px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-[#767680] focus:border-brand-red focus:bg-[#252530] focus:shadow-[0_0_0_3px_rgba(229,9,20,0.22)]"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-[5px] bg-gradient-to-r from-[#B20710] to-[#E50914] px-6 py-2.5 font-display text-[11px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(229,9,20,0.32)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_20px_rgba(229,9,20,0.5)] active:translate-y-0"
                >
                  {t(profile.lang, "subscribeBtn")}
                </button>
              </form>
            </div>

            {/* Column 2: Ministry & Terms */}
            <div>
              <h4 className="mb-4 font-display text-sm font-bold tracking-tight text-white">
                {t(profile.lang, "termsTitle")}
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToTarget("#top")}
                    className="inline-block text-left text-xs text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    {t(profile.lang, "linkDecree")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToTarget("#catalogSection")}
                    className="inline-block text-left text-xs text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    {t(profile.lang, "linkAccess")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        "Gringotts Privacy Vault: All favorites are stored locally in your browser."
                      )
                    }
                    className="inline-block text-left text-xs text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    {t(profile.lang, "linkGringotts")}
                  </button>
                </li>
              </ul>

              <div className="mt-5 flex items-center gap-3">
                <span className="font-display text-xs font-bold text-white">
                  {t(profile.lang, "followLabel")}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="#potterflix-footer"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast("PotterFlix Owl Network connected.");
                    }}
                    aria-label="Facebook"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-white transition hover:scale-110 hover:bg-brand-red"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                    </svg>
                  </a>
                  <a
                    href="#potterflix-footer"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast("Daily Prophet Visual Feed active.");
                    }}
                    aria-label="Instagram"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-white transition hover:scale-110 hover:bg-brand-red"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle
                        cx="17.5"
                        cy="6.5"
                        r="1"
                        fill="currentColor"
                        stroke="none"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 3: Wizarding Archive */}
            <div>
              <h4 className="mb-4 font-display text-sm font-bold tracking-tight text-white">
                {t(profile.lang, "infoTitle")}
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToTarget("#catalogSection")}
                    className="inline-block text-left text-xs text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    {t(profile.lang, "linkFaqs")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToTarget("#top")}
                    className="inline-block text-left text-xs text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    {t(profile.lang, "linkAbout")}
                  </button>
                </li>
                <li>
                  <a
                    href="https://github.com/fedeperin/potterapi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    {t(profile.lang, "linkApi")}
                  </a>
                </li>
              </ul>
              <div className="mt-4 space-y-0.5 text-[11.5px] leading-relaxed text-[#B3B3B3]">
                <p>Owl-Line: 0800 934 934</p>
                <p>
                  <a
                    href="mailto:owlpost@potterflix.io"
                    className="inline-block text-[#B3B3B3] transition hover:translate-x-0.5 hover:text-white"
                  >
                    owlpost@potterflix.io
                  </a>
                </p>
              </div>
            </div>

            {/* Column 4: Headquarters */}
            <div>
              <h4 className="mb-4 font-display text-sm font-bold tracking-tight text-white">
                {t(profile.lang, "contactTitle")}
              </h4>
              <div className="text-[11.5px] leading-relaxed text-[#B3B3B3]">
                <p className="font-semibold text-white">PotterFlix Streaming</p>
                <p>{t(profile.lang, "registryNo")}</p>
                <p className="mt-3 font-semibold text-white">
                  {t(profile.lang, "hqLabel")}
                </p>
                <p>{t(profile.lang, "hqAddress")}</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Badges, Legal + 7 Flags, House Marks */}
          <div className="grid grid-cols-1 items-center gap-6 border-t border-white/[0.07] pt-7 text-center lg:grid-cols-[1fr_auto_1fr] lg:text-left">
            {/* Left Trust Badges */}
            <div className="flex items-center justify-center gap-4 lg:justify-start">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5">
                <Star
                  className="h-3.5 w-3.5 fill-brand-gold text-brand-gold"
                  aria-hidden="true"
                />
                <div>
                  <strong className="block font-display text-[10px] tracking-wider text-white">
                    MINISTRY
                  </strong>
                  <small className="block text-[9px] text-[#767680]">
                    VERIFIED
                  </small>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5">
                <Zap
                  className="h-3.5 w-3.5 fill-brand-gold text-brand-gold"
                  aria-hidden="true"
                />
                <div>
                  <strong className="block font-display text-[10px] tracking-wider text-white">
                    POTTERAPI
                  </strong>
                  <small className="block text-[9px] text-[#767680]">
                    v1 LIVE
                  </small>
                </div>
              </div>
            </div>

            {/* Center Legal + 7 Language Flags + Copyright */}
            <div className="text-center">
              <p className="mb-3 text-[10.5px] leading-relaxed text-[#B3B3B3]">
                {t(profile.lang, "legalLine1")}
                <br />
                owlpost@potterflix.io, 0800 934 934
              </p>

              <div
                className="mb-2.5 inline-flex items-center justify-center gap-1.5"
                role="group"
                aria-label="Select Footer Language"
              >
                {FOOTER_FLAGS.map((item) => {
                  const active = profile.lang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLanguage(item.code)}
                      title={item.label}
                      aria-label={item.label}
                      aria-pressed={active}
                      className={cn(
                        "cursor-pointer rounded border px-1.5 py-1 text-sm leading-none transition duration-150 hover:scale-115 hover:opacity-100",
                        active
                          ? "border-brand-red bg-brand-red/15 opacity-100 shadow-[0_0_10px_rgba(229,9,20,0.45)]"
                          : "border-transparent bg-white/5 opacity-65"
                      )}
                    >
                      {item.flag}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-[#767680]">
                {t(profile.lang, "copyright")}
              </p>
            </div>

            {/* Right Partner / House Marks */}
            <div className="flex items-center justify-center gap-3.5 lg:justify-end">
              <span className="font-display text-xs font-extrabold tracking-wider text-white">
                GRINGOTTS
              </span>
              <div
                className="inline-flex items-center"
                title="Four Hogwarts Houses"
              >
                <span className="h-3.5 w-3.5 rounded-full border border-[#141418] bg-[#E50914]" />
                <span className="-ml-1 h-3.5 w-3.5 rounded-full border border-[#141418] bg-[#1F8E55]" />
                <span className="-ml-1 h-3.5 w-3.5 rounded-full border border-[#141418] bg-[#2563EB]" />
                <span className="-ml-1 h-3.5 w-3.5 rounded-full border border-[#141418] bg-[#F5B50A]" />
              </div>
              <span className="font-display text-xs font-extrabold tracking-wider text-brand-gold">
                HOGWARTS
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
