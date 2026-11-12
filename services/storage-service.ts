import type {
  FavoritesMap,
  LanguageCode,
  NormalizedPotterItem,
  PotterEndpoint,
  WizardProfileState,
} from "@/types/potter";

const STORAGE_KEY = "potterflix_wizard_profile_v1";
const VALID_LANGS: readonly LanguageCode[] = ["en", "es", "fr", "it", "pt", "uk", "de"];
const CATEGORIES: readonly PotterEndpoint[] = ["books", "characters", "houses", "spells"];

export function createDefaultProfileState(): WizardProfileState {
  return {
    wizardName: "Harry Potter",
    lang: "en",
    favorites: {
      books: [],
      characters: [],
      houses: [],
      spells: [],
    },
  };
}

function sanitizeFavoriteArray(value: unknown): NormalizedPotterItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is NormalizedPotterItem =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as NormalizedPotterItem).id === "string" &&
      typeof (item as NormalizedPotterItem).title === "string" &&
      typeof (item as NormalizedPotterItem).endpoint === "string"
  );
}

export function loadProfileState(): WizardProfileState {
  const fallback = createDefaultProfileState();
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;

    const record = parsed as Partial<WizardProfileState>;
    const lang = VALID_LANGS.includes(record.lang as LanguageCode)
      ? (record.lang as LanguageCode)
      : fallback.lang;

    const wizardName =
      typeof record.wizardName === "string" && record.wizardName.trim()
        ? record.wizardName.trim().slice(0, 32)
        : fallback.wizardName;

    const rawFavs = record.favorites as Partial<FavoritesMap> | undefined;

    return {
      wizardName,
      lang,
      favorites: {
        books: sanitizeFavoriteArray(rawFavs?.books),
        characters: sanitizeFavoriteArray(rawFavs?.characters),
        houses: sanitizeFavoriteArray(rawFavs?.houses),
        spells: sanitizeFavoriteArray(rawFavs?.spells),
      },
    };
  } catch (err) {
    console.warn("LocalStorage read failed, using default state:", err);
    return fallback;
  }
}

export function saveProfileState(state: WizardProfileState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error("LocalStorage write failed:", err);
    return false;
  }
}

export function getTotalFavoritesCount(favorites: FavoritesMap): number {
  return CATEGORIES.reduce(
    (sum, cat) => sum + (Array.isArray(favorites[cat]) ? favorites[cat].length : 0),
    0
  );
}
