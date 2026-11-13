/**
 * PotterFlix — Global Constants & Theme Configuration
 */

export const API_BASE_URL = 'https://potterapi-fedeperin.vercel.app';

export const VALID_ENDPOINTS = Object.freeze(['books', 'characters', 'houses', 'spells']);

export const DEFAULT_LANGUAGE = 'en';

export const HOUSE_THEMES = Object.freeze({
  Gryffindor: {
    primaryColor: '#7f1d1d',
    secondaryColor: '#b45309',
    accentColor: '#F5B50A',
    icon: '🦁',
    borderClass: 'border-amber-600/40'
  },
  Slytherin: {
    primaryColor: '#064e3b',
    secondaryColor: '#1e293b',
    accentColor: '#34d399',
    icon: '🐍',
    borderClass: 'border-emerald-600/40'
  },
  Ravenclaw: {
    primaryColor: '#1e3a8a',
    secondaryColor: '#312e81',
    accentColor: '#60a5fa',
    icon: '🦅',
    borderClass: 'border-blue-600/40'
  },
  Hufflepuff: {
    primaryColor: '#78350f',
    secondaryColor: '#1c1917',
    accentColor: '#fbbf24',
    icon: '🦡',
    borderClass: 'border-yellow-600/40'
  }
});

export const DEFAULT_FALLBACK_THEME = Object.freeze({
  primaryColor: '#3f3f46',
  secondaryColor: '#18181b',
  accentColor: '#E50914',
  icon: '⚡',
  borderClass: 'border-neutral-700/40'
});

export const STORAGE_KEYS = Object.freeze({
  PROFILE: 'potterflix_wizard_profile_v2'
});
