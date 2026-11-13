/**
 * PotterFlix — Formatters & Data Normalization
 */

import { HOUSE_THEMES, DEFAULT_FALLBACK_THEME } from '../config/constants.js';
import { escapeHTML } from './dom.js';

/**
 * Resolve theme color palette for a given Hogwarts house name
 * @param {string} houseName
 * @returns {object} House theme definition
 */
export function getHouseTheme(houseName = '') {
  if (!houseName || typeof houseName !== 'string') return DEFAULT_FALLBACK_THEME;
  const match = Object.keys(HOUSE_THEMES).find(k => houseName.toLowerCase().includes(k.toLowerCase()));
  return match ? HOUSE_THEMES[match] : DEFAULT_FALLBACK_THEME;
}

/**
 * Generate an inline SVG fallback poster image
 * @param {string} title Poster title
 * @param {string} subtitle Poster subtitle
 * @param {string} c1 Gradient start color
 * @param {string} c2 Gradient end color
 * @param {string} badge Top badge text
 * @returns {string} Data URI SVG string
 */
export function buildFallbackPosterSVG(title, subtitle, c1 = '#450a0a', c2 = '#121212', badge = 'WIZARD') {
  const safeTitle = escapeHTML(String(title || 'PotterFlix'));
  const safeSub = escapeHTML(String(subtitle || 'Wizarding World'));

  // Strip emojis and symbols to safely extract alphabet initials without breaking surrogate pairs
  const cleanWords = safeTitle
    .replace(/[\uD800-\uDFFF]|\p{Extended_Pictographic}|\p{Emoji}/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials = cleanWords.slice(0, 2).map(w => Array.from(w)[0] || '').join('').toUpperCase() || 'HP';
  
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="450" fill="url(#bg)"/>
    <circle cx="240" cy="85" r="95" fill="#ffffff" fill-opacity="0.05"/>
    <circle cx="65" cy="365" r="115" fill="#E50914" fill-opacity="0.15"/>
    <text x="22" y="46" fill="#E50914" font-family="Montserrat, sans-serif" font-weight="900" font-size="16" letter-spacing="2">${badge}</text>
    <text x="150" y="240" text-anchor="middle" fill="#ffffff" fill-opacity="0.14" font-family="Montserrat, sans-serif" font-weight="900" font-size="88">${initials}</text>
    <text x="22" y="390" fill="#ffffff" font-family="Montserrat, sans-serif" font-weight="700" font-size="16">${safeTitle.slice(0, 26)}</text>
    <text x="22" y="416" fill="#a3a3a3" font-family="sans-serif" font-size="12">${safeSub.slice(0, 32)}</text>
  </svg>`;

  const wellFormedSvg = typeof rawSvg.toWellFormed === 'function' ? rawSvg.toWellFormed() : rawSvg;
  return `data:image/svg+xml;utf8,${encodeURIComponent(wellFormedSvg)}`;
}

/**
 * Normalize raw PotterAPI item into a consistent model across endpoints
 * @param {string} endpoint Resource endpoint (books, characters, houses, spells)
 * @param {object} raw Raw item from PotterAPI
 * @param {number} fallbackIndex Index fallback
 * @returns {object} Normalized item
 */
export function normalizeItem(endpoint, raw, fallbackIndex = 0) {
  const index = raw.index !== undefined ? raw.index : fallbackIndex;

  if (endpoint === 'books') {
    const bookNumber = raw.number !== undefined ? raw.number : index + 1;
    return {
      id: `books-${index}`,
      endpoint: 'books',
      index,
      title: raw.title || 'Untitled Book',
      subtitle: raw.releaseDate || 'Hogwarts Library Edition',
      badge: `BOOK #${bookNumber}`,
      metric: raw.pages ? `${raw.pages}p` : 'Book',
      image: raw.cover || buildFallbackPosterSVG(raw.title, raw.releaseDate, '#7f1d1d', '#141414', 'BOOK'),
      description: raw.description || raw.summary || '',
      raw
    };
  }

  if (endpoint === 'characters') {
    const theme = getHouseTheme(raw.hogwartsHouse);
    return {
      id: `characters-${index}`,
      endpoint: 'characters',
      index,
      title: raw.fullName || raw.nickname || 'Unknown Wizard',
      subtitle: raw.hogwartsHouse || raw.interpretedBy || 'Wizarding World',
      badge: raw.hogwartsHouse ? raw.hogwartsHouse.toUpperCase() : 'WIZARD',
      metric: raw.birthdate || 'Character',
      image: raw.image || buildFallbackPosterSVG(raw.fullName, raw.hogwartsHouse, theme.primaryColor, theme.secondaryColor, 'WIZARD'),
      description: raw.interpretedBy ? `Interpreted by ${raw.interpretedBy}` : (raw.hogwartsHouse || ''),
      raw
    };
  }

  if (endpoint === 'houses') {
    const theme = getHouseTheme(raw.house);
    return {
      id: `houses-${index}`,
      endpoint: 'houses',
      index,
      title: raw.house || 'Hogwarts House',
      subtitle: raw.founder ? `Founder: ${raw.founder}` : 'Hogwarts School',
      badge: `${raw.emoji || theme.icon} HOUSE`,
      metric: raw.animal || 'Crest',
      image: buildFallbackPosterSVG(raw.house, raw.founder, theme.primaryColor, theme.secondaryColor, 'HOGWARTS'),
      description: raw.colors ? `Colors: ${Array.isArray(raw.colors) ? raw.colors.join(', ') : raw.colors}` : '',
      raw
    };
  }

  // endpoint === 'spells'
  return {
    id: `spells-${index}`,
    endpoint: 'spells',
    index,
    title: raw.spell || 'Unknown Incantation',
    subtitle: raw.use || 'Magical Incantation',
    badge: `SPELL #${index + 1}`,
    metric: 'Incantation',
    image: buildFallbackPosterSVG(raw.spell, raw.use, '#3b0764', '#09090b', 'SPELL'),
    description: raw.use || '',
    raw
  };
}
