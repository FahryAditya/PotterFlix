/**
 * PotterFlix — LocalStorage Persistence Service
 * Manages wizard profile name and 4-category favorites (characters, spells, houses, books).
 */

import { STORAGE_KEYS } from '../config/constants.js';

const DEFAULT_PROFILE = Object.freeze({
  wizardName: 'Harry Potter',
  lang: 'en',
  favorites: {
    books: [],
    characters: [],
    houses: [],
    spells: []
  }
});

/**
 * Load profile from browser localStorage
 * @returns {object} Profile state
 */
export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return structuredClone(DEFAULT_PROFILE);

    const parsed = JSON.parse(raw);
    return {
      wizardName: typeof parsed.wizardName === 'string' && parsed.wizardName.trim() ? parsed.wizardName.trim() : DEFAULT_PROFILE.wizardName,
      lang: typeof parsed.lang === 'string' ? parsed.lang : DEFAULT_PROFILE.lang,
      favorites: {
        books: Array.isArray(parsed.favorites?.books) ? parsed.favorites.books : [],
        characters: Array.isArray(parsed.favorites?.characters) ? parsed.favorites.characters : [],
        houses: Array.isArray(parsed.favorites?.houses) ? parsed.favorites.houses : [],
        spells: Array.isArray(parsed.favorites?.spells) ? parsed.favorites.spells : []
      }
    };
  } catch (err) {
    console.warn('[StorageService] Failed to read localStorage, falling back to default:', err);
    return structuredClone(DEFAULT_PROFILE);
  }
}

/**
 * Save profile to browser localStorage
 * @param {object} profile
 */
export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('[StorageService] Failed to write localStorage:', err);
  }
}

/**
 * Add an item to a specific favorite category
 * @param {object} profile
 * @param {string} category 'books' | 'characters' | 'houses' | 'spells'
 * @param {object} item Normalized item
 * @returns {boolean} Whether item was added (false if already present)
 */
export function addFavorite(profile, category, item) {
  if (!profile.favorites[category]) {
    profile.favorites[category] = [];
  }
  const exists = profile.favorites[category].some(f => f.id === item.id);
  if (!exists) {
    profile.favorites[category].push({
      id: item.id,
      endpoint: item.endpoint,
      index: item.index,
      title: item.title,
      subtitle: item.subtitle,
      badge: item.badge,
      image: item.image,
      addedAt: new Date().toISOString()
    });
    saveProfile(profile);
    return true;
  }
  return false;
}

/**
 * Remove an item from a specific favorite category
 * @param {object} profile
 * @param {string} category 'books' | 'characters' | 'houses' | 'spells'
 * @param {string} itemId Item id (e.g. 'characters-0')
 * @returns {boolean} Whether item was removed
 */
export function removeFavorite(profile, category, itemId) {
  if (!profile.favorites[category]) return false;
  const initialLength = profile.favorites[category].length;
  profile.favorites[category] = profile.favorites[category].filter(f => f.id !== itemId);
  if (profile.favorites[category].length !== initialLength) {
    saveProfile(profile);
    return true;
  }
  return false;
}

/**
 * Check if an item is currently favorited
 * @param {object} profile
 * @param {string} category 'books' | 'characters' | 'houses' | 'spells'
 * @param {string} itemId Item id
 * @returns {boolean}
 */
export function isFavorite(profile, category, itemId) {
  if (!profile.favorites || !profile.favorites[category]) return false;
  return profile.favorites[category].some(f => f.id === itemId);
}

/**
 * Clear all saved favorites across all 4 categories
 * @param {object} profile
 */
export function clearAllFavorites(profile) {
  profile.favorites = {
    books: [],
    characters: [],
    houses: [],
    spells: []
  };
  saveProfile(profile);
}

/**
 * Calculate total count of favorites across all 4 categories
 * @param {object} profile
 * @returns {number}
 */
export function getTotalFavoritesCount(profile) {
  if (!profile.favorites) return 0;
  return ['books', 'characters', 'houses', 'spells'].reduce(
    (acc, cat) => acc + (Array.isArray(profile.favorites[cat]) ? profile.favorites[cat].length : 0),
    0
  );
}
