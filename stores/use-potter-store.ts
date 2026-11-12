import { create } from "zustand";
import {
  createDefaultProfileState,
  loadProfileState,
  saveProfileState,
} from "@/services/storage-service";
import type {
  LanguageCode,
  NavSection,
  NormalizedPotterItem,
  PotterEndpoint,
  WizardProfileState,
} from "@/types/potter";

export interface DetailTarget {
  endpoint: PotterEndpoint;
  index: number;
}

interface PotterStoreState {
  hydrated: boolean;
  profile: WizardProfileState;
  activeNav: NavSection;
  activeEndpoint: PotterEndpoint;
  detailTarget: DetailTarget | null;
  isMyListOpen: boolean;
  toastMessage: string | null;
  toastKey: number;

  hydrateFromStorage: () => void;
  setActiveNav: (nav: NavSection) => void;
  setActiveEndpoint: (endpoint: PotterEndpoint) => void;
  setLanguage: (lang: LanguageCode) => void;
  setWizardName: (name: string) => void;
  toggleFavorite: (item: NormalizedPotterItem) => void;
  removeFavorite: (endpoint: PotterEndpoint, id: string) => void;
  clearFavorites: () => void;
  openDetailModal: (endpoint: PotterEndpoint, index: number) => void;
  closeDetailModal: () => void;
  openMyListModal: () => void;
  closeMyListModal: () => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const usePotterStore = create<PotterStoreState>((set, get) => ({
  hydrated: false,
  profile: createDefaultProfileState(),
  activeNav: "home",
  activeEndpoint: "books",
  detailTarget: null,
  isMyListOpen: false,
  toastMessage: null,
  toastKey: 0,

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const loaded = loadProfileState();
    set({ profile: loaded, hydrated: true });
  },

  setActiveNav: (nav) => set({ activeNav: nav }),

  setActiveEndpoint: (endpoint) =>
    set({ activeEndpoint: endpoint, activeNav: endpoint }),

  setLanguage: (lang) => {
    const nextProfile: WizardProfileState = {
      ...get().profile,
      lang,
    };
    saveProfileState(nextProfile);
    set((state) => ({
      profile: nextProfile,
      toastMessage: `Language switched to ${lang.toUpperCase()}`,
      toastKey: state.toastKey + 1,
    }));
  },

  setWizardName: (rawName) => {
    const cleaned = rawName.trim().slice(0, 32);
    if (!cleaned) return;
    const nextProfile: WizardProfileState = {
      ...get().profile,
      wizardName: cleaned,
    };
    saveProfileState(nextProfile);
    set((state) => ({
      profile: nextProfile,
      toastMessage: `Welcome, ${cleaned}!`,
      toastKey: state.toastKey + 1,
    }));
  },

  toggleFavorite: (item) => {
    const current = get().profile;
    const list = current.favorites[item.endpoint] ?? [];
    const exists = list.some((f) => f.id === item.id);
    const nextList = exists
      ? list.filter((f) => f.id !== item.id)
      : [item, ...list];

    const nextProfile: WizardProfileState = {
      ...current,
      favorites: {
        ...current.favorites,
        [item.endpoint]: nextList,
      },
    };
    saveProfileState(nextProfile);
    set((state) => ({
      profile: nextProfile,
      toastMessage: exists
        ? `Removed "${item.title}" from ${item.endpoint}`
        : `Saved "${item.title}" to ${item.endpoint}!`,
      toastKey: state.toastKey + 1,
    }));
  },

  removeFavorite: (endpoint, id) => {
    const current = get().profile;
    const nextProfile: WizardProfileState = {
      ...current,
      favorites: {
        ...current.favorites,
        [endpoint]: current.favorites[endpoint].filter((f) => f.id !== id),
      },
    };
    saveProfileState(nextProfile);
    set({ profile: nextProfile });
  },

  clearFavorites: () => {
    const current = get().profile;
    const nextProfile: WizardProfileState = {
      ...current,
      favorites: {
        books: [],
        characters: [],
        houses: [],
        spells: [],
      },
    };
    saveProfileState(nextProfile);
    set((state) => ({
      profile: nextProfile,
      toastMessage: "All saved favorites cleared",
      toastKey: state.toastKey + 1,
    }));
  },

  openDetailModal: (endpoint, index) => set({ detailTarget: { endpoint, index } }),
  closeDetailModal: () => set({ detailTarget: null }),
  openMyListModal: () => set({ isMyListOpen: true }),
  closeMyListModal: () => set({ isMyListOpen: false }),

  showToast: (message) =>
    set((state) => ({
      toastMessage: message,
      toastKey: state.toastKey + 1,
    })),

  hideToast: () => set({ toastMessage: null }),
}));
