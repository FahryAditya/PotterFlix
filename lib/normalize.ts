import type {
  NormalizedPotterItem,
  PotterEndpoint,
  RawBook,
  RawCharacter,
  RawHouse,
  RawPotterRecord,
  RawSpell,
} from "@/types/potter";

export interface HouseTheme {
  c1: string;
  c2: string;
  accent: string;
  icon: string;
}

const HOUSE_THEMES: Record<string, HouseTheme> = {
  Gryffindor: { c1: "#7f1d1d", c2: "#b45309", accent: "#F5B50A", icon: "🦁" },
  Slytherin: { c1: "#064e3b", c2: "#1e293b", accent: "#34d399", icon: "🐍" },
  Ravenclaw: { c1: "#1e3a8a", c2: "#312e81", accent: "#60a5fa", icon: "🦅" },
  Hufflepuff: { c1: "#78350f", c2: "#1c1917", accent: "#fbbf24", icon: "🦡" },
};

export function getHouseTheme(houseName = ""): HouseTheme {
  const key = Object.keys(HOUSE_THEMES).find((k) =>
    houseName.toLowerCase().includes(k.toLowerCase())
  );
  return (
    (key ? HOUSE_THEMES[key] : undefined) ?? {
      c1: "#3f3f46",
      c2: "#18181b",
      accent: "#E50914",
      icon: "⚡",
    }
  );
}

function firstCodePoint(text: string): string {
  return Array.from(text)[0] ?? "";
}

function sliceCodePoints(text: string, max: number): string {
  return Array.from(text).slice(0, max).join("");
}

function sanitizeLoneSurrogates(text: string): string {
  return text.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
    (match) => (match.length === 2 ? match[0] : "")
  );
}

export function buildFallbackPosterSVG(
  title: string,
  subtitle = "",
  c1 = "#450a0a",
  c2 = "#121212",
  badge = "WIZARD"
): string {
  const safeTitle = sanitizeLoneSurrogates(
    String(title || "PotterFlix").replace(/[<>&'"]/g, "")
  );
  const safeSub = sanitizeLoneSurrogates(
    String(subtitle || "").replace(/[<>&'"]/g, "")
  );
  const safeBadge = sanitizeLoneSurrogates(
    String(badge || "WIZARD").replace(/[<>&'"]/g, "")
  );
  const initials = safeTitle
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => firstCodePoint(w))
    .join("")
    .toUpperCase();

  const svg = sanitizeLoneSurrogates(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="450" fill="url(#bg)"/>
    <circle cx="240" cy="85" r="95" fill="#ffffff" fill-opacity="0.06"/>
    <circle cx="65" cy="365" r="115" fill="#E50914" fill-opacity="0.14"/>
    <text x="22" y="46" fill="#E50914" font-family="Montserrat, sans-serif" font-weight="900" font-size="18">${safeBadge}</text>
    <text x="150" y="238" text-anchor="middle" fill="#ffffff" fill-opacity="0.14" font-family="Montserrat, sans-serif" font-weight="900" font-size="94">${initials}</text>
    <text x="22" y="392" fill="#ffffff" font-family="Montserrat, sans-serif" font-weight="700" font-size="17">${sliceCodePoints(safeTitle, 24)}</text>
    <text x="22" y="418" fill="#a3a3a3" font-family="sans-serif" font-size="12">${sliceCodePoints(safeSub, 32)}</text>
  </svg>`);

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function normalizeItem(
  endpoint: PotterEndpoint,
  raw: RawPotterRecord,
  fallbackIdx = 0
): NormalizedPotterItem {
  const idx = raw.index !== undefined ? raw.index : fallbackIdx;

  if (endpoint === "books") {
    const b = raw as RawBook;
    const title = b.title || "Untitled Book";
    const subtitle = b.releaseDate || "Wizarding Edition";
    return {
      id: `books-${idx}`,
      endpoint: "books",
      index: idx,
      title,
      subtitle,
      badge: `BOOK #${b.number || idx + 1}`,
      metric: b.pages ? `${b.pages}p` : "Book",
      image: b.cover || buildFallbackPosterSVG(title, subtitle, "#7f1d1d", "#141414", "BOOK"),
      raw,
    };
  }

  if (endpoint === "characters") {
    const c = raw as RawCharacter;
    const title = c.fullName || c.nickname || "Unknown Wizard";
    const subtitle = c.hogwartsHouse || c.interpretedBy || "Wizarding World";
    const theme = getHouseTheme(c.hogwartsHouse);
    return {
      id: `characters-${idx}`,
      endpoint: "characters",
      index: idx,
      title,
      subtitle,
      badge: c.hogwartsHouse ? c.hogwartsHouse.toUpperCase() : "WIZARD",
      metric: c.birthdate || "Character",
      image: c.image || buildFallbackPosterSVG(title, subtitle, theme.c1, theme.c2, "WIZARD"),
      raw,
    };
  }

  if (endpoint === "houses") {
    const h = raw as RawHouse;
    const title = h.house || "Hogwarts House";
    const subtitle = h.founder || "Hogwarts Founder";
    const theme = getHouseTheme(h.house);
    return {
      id: `houses-${idx}`,
      endpoint: "houses",
      index: idx,
      title,
      subtitle,
      badge: `${h.emoji || theme.icon} HOUSE`,
      metric: h.animal || "Crest",
      image: buildFallbackPosterSVG(
        `${h.emoji || ""} ${title}`.trim(),
        subtitle,
        theme.c1,
        theme.c2,
        "HOGWARTS"
      ),
      raw,
    };
  }

  const s = raw as RawSpell;
  const title = s.spell || "Unknown Incantation";
  const subtitle = s.use || "Magical Effect";
  return {
    id: `spells-${idx}`,
    endpoint: "spells",
    index: idx,
    title,
    subtitle,
    badge: `SPELL #${idx + 1}`,
    metric: "Incantation",
    image: buildFallbackPosterSVG(title, subtitle, "#3b0764", "#09090b", "CHARM"),
    raw,
  };
}
