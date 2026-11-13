/**
 * PotterFlix — Official PotterAPI HTTP Client Service
 * Handles async fetching, error handling, parameter validation, in-memory caching, and request aborts.
 */

import { API_BASE_URL, VALID_ENDPOINTS, DEFAULT_LANGUAGE } from '../config/constants.js';
import { SUPPORTED_LANGUAGES } from '../config/i18n.js';

const memoryCache = new Map();
let currentSearchAbortController = null;

/**
 * Resolve supported PotterAPI language code with fallback
 * @param {string} lang Target language code
 * @returns {string} Safe API language code
 */
function resolveApiLang(lang) {
  const match = SUPPORTED_LANGUAGES.find(item => item.code === lang);
  return match ? match.apiCode : DEFAULT_LANGUAGE;
}

/**
 * Fetch resources from PotterAPI
 * @param {object} options
 * @param {string} [options.lang='en'] Language code
 * @param {string} [options.endpoint='books'] Resource endpoint (books, characters, houses, spells)
 * @param {string} [options.search=''] Search term for ?search=
 * @param {number} [options.max=0] Cropping limit for ?max=
 * @param {number} [options.page=1] Page offset for ?page=
 * @param {number|string|null} [options.index=null] Single item index for ?index=
 * @param {boolean} [options.abortPrevious=false] Whether to abort in-flight search request
 * @returns {Promise<{data: any, endpointUrl: string}>}
 */
export async function fetchPotterResource({
  lang = 'en',
  endpoint = 'books',
  search = '',
  max = 0,
  page = 1,
  index = null,
  abortPrevious = false
} = {}) {
  if (!VALID_ENDPOINTS.includes(endpoint)) {
    throw new Error(`Invalid PotterAPI endpoint requested: "${endpoint}"`);
  }

  const apiLang = resolveApiLang(lang);
  const url = new URL(`${API_BASE_URL}/${apiLang}/${endpoint}`);

  // Query parameter assignment
  if (index !== null && index !== undefined && index !== '') {
    url.searchParams.set('index', String(index));
  } else {
    if (search && search.trim().length > 0) {
      url.searchParams.set('search', search.trim());
    }
    if (Number(max) > 0) {
      url.searchParams.set('max', String(max));
      url.searchParams.set('page', String(Math.max(1, Number(page) || 1)));
    }
  }

  const cacheKey = url.toString();
  if (memoryCache.has(cacheKey)) {
    return {
      data: memoryCache.get(cacheKey),
      endpointUrl: `/${apiLang}/${endpoint}${url.search}`
    };
  }

  // Handle AbortController for rapidly fired search requests
  if (abortPrevious && currentSearchAbortController) {
    currentSearchAbortController.abort();
  }
  const controller = new AbortController();
  if (abortPrevious) {
    currentSearchAbortController = controller;
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`PotterAPI responded with HTTP ${response.status} (${response.statusText})`);
    }

    const payload = await response.json();
    if (payload === null || typeof payload !== 'object') {
      throw new Error('Malformed or empty JSON data received from PotterAPI.');
    }

    // Save successful response to cache
    memoryCache.set(cacheKey, payload);

    return {
      data: payload,
      endpointUrl: `/${apiLang}/${endpoint}${url.search}`
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error(`[PotterAPI Service Error] ${url.toString()}:`, err);
    throw new Error(err.message || 'Network error while summoning PotterAPI records.');
  }
}

/**
 * Clear the in-memory cache if needed (e.g. on language change or reset)
 */
export function clearApiCache() {
  memoryCache.clear();
}
