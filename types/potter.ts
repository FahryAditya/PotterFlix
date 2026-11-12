export type PotterEndpoint = "books" | "characters" | "houses" | "spells";

export type LanguageCode = "en" | "es" | "fr" | "it" | "pt" | "uk" | "de";

export type ApiLanguageCode = "en" | "es" | "fr" | "it" | "pt" | "uk";

export type SortOption = "default" | "az" | "za" | "metricDesc";

export type NavSection = "home" | PotterEndpoint | "mylist";

export interface RawBook {
  number?: number;
  title?: string;
  originalTitle?: string;
  releaseDate?: string;
  description?: string;
  pages?: number;
  cover?: string;
  index?: number;
}

export interface RawCharacter {
  fullName?: string;
  nickname?: string;
  hogwartsHouse?: string;
  interpretedBy?: string;
  children?: string[];
  image?: string;
  birthdate?: string;
  index?: number;
}

export interface RawHouse {
  house?: string;
  emoji?: string;
  founder?: string;
  colors?: string[];
  animal?: string;
  index?: number;
}

export interface RawSpell {
  spell?: string;
  use?: string;
  index?: number;
}

export type RawPotterRecord = RawBook | RawCharacter | RawHouse | RawSpell;

export interface NormalizedPotterItem {
  id: string;
  endpoint: PotterEndpoint;
  index: number;
  title: string;
  subtitle: string;
  badge: string;
  metric: string;
  image: string;
  raw: RawPotterRecord;
}

export type FavoritesMap = Record<PotterEndpoint, NormalizedPotterItem[]>;

export interface WizardProfileState {
  wizardName: string;
  lang: LanguageCode;
  favorites: FavoritesMap;
}
