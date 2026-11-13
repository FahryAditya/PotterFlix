/**
 * ============================================================================
 * File: js/services/potterApi.js
 * Deskripsi: Layanan klien HTTP async resmi untuk berkomunikasi dengan PotterAPI.
 *            Menangani validasi parameter, in-memory Map caching, pembatalan request
 *            lama dengan AbortController, serta error handling yang tangguh.
 * ============================================================================
 */

import { API_BASE_URL, VALID_ENDPOINTS, DEFAULT_LANGUAGE } from '../config/constants.js';
import { SUPPORTED_LANGUAGES } from '../config/i18n.js';

/**
 * Cache memori internal berbasis Map.
 * Menyimpan hasil respons URL agar tidak melakukan network call berulang untuk data yang sama.
 * @type {Map<string, any>}
 */
const memoryCache = new Map();

/**
 * Menyimpan instance AbortController aktif untuk pencarian real-time (live search).
 * Jika ada request pencarian baru sebelum request sebelumnya selesai, request lama akan dibatalkan.
 * @type {AbortController|null}
 */
let currentSearchAbortController = null;

/**
 * Menentukan kode bahasa yang valid untuk PotterAPI.
 * Jika bahasa yang dipilih adalah bahasa yang hanya diterjemahkan di UI (seperti Jerman 'de'),
 * fungsi ini akan mengarahkan API language ke 'en' agar API tetap mengembalikan data canon.
 * 
 * @param {string} lang - Kode bahasa dari sistem UI
 * @returns {string} Kode bahasa resmi yang didukung PotterAPI
 */
function resolveApiLang(lang) {
  const match = SUPPORTED_LANGUAGES.find(item => item.code === lang);
  return match ? match.apiCode : DEFAULT_LANGUAGE;
}

/**
 * Mengambil resource data dari PotterAPI secara asynchronous.
 * 
 * Parameter yang Didukung (Sesuai Dokumentasi Resmi):
 * - index: Mengambil 1 item spesifik berdasarkan indeks urutan keseluruhan list.
 * - max: Memotong (crop) jumlah data yang dikembalikan per halaman.
 * - page: Menentukan nomor halaman saat 'max' digunakan.
 * - search: Mencari teks pada seluruh item dan mengembalikan hasil pencocokan terbaik.
 * 
 * @param {object} options - Konfigurasi request
 * @param {string} [options.lang='en'] - Kode bahasa target (misal: 'en', 'es', 'fr', 'it', 'pt', 'uk')
 * @param {string} [options.endpoint='books'] - Endpoint target ('books', 'characters', 'houses', 'spells')
 * @param {string} [options.search=''] - Query teks pencarian untuk parameter ?search=
 * @param {number} [options.max=0] - Batas jumlah item untuk parameter ?max= (0 berarti ambil semua)
 * @param {number} [options.page=1] - Nomor halaman untuk parameter ?page=
 * @param {number|string|null} [options.index=null] - Indeks item spesifik untuk parameter ?index=
 * @param {boolean} [options.abortPrevious=false] - Apakah membatalkan request sebelumnya (digunakan saat live search)
 * @returns {Promise<{data: any, endpointUrl: string}>} Objek hasil berisi payload data dan endpoint URL
 * @throws {Error} Melempar error jika endpoint tidak valid, respons HTTP gagal, atau data JSON korup
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
  // 1. Validasi Endpoint
  if (!VALID_ENDPOINTS.includes(endpoint)) {
    throw new Error(`Invalid PotterAPI endpoint requested: "${endpoint}"`);
  }

  // 2. Susun URL Endpoint Resmi
  const apiLang = resolveApiLang(lang);
  const url = new URL(`${API_BASE_URL}/${apiLang}/${endpoint}`);

  // 3. Pasang Query Parameters Sesuai Dokumentasi
  if (index !== null && index !== undefined && index !== '') {
    // Mode Single Item (?index=N)
    url.searchParams.set('index', String(index));
  } else {
    // Mode Pencarian Teks (?search=query)
    if (search && search.trim().length > 0) {
      url.searchParams.set('search', search.trim());
    }
    // Mode Pagination (?max=N&page=N)
    if (Number(max) > 0) {
      url.searchParams.set('max', String(max));
      url.searchParams.set('page', String(Math.max(1, Number(page) || 1)));
    }
  }

  // 4. Periksa In-Memory Cache
  const cacheKey = url.toString();
  if (memoryCache.has(cacheKey)) {
    return {
      data: memoryCache.get(cacheKey),
      endpointUrl: `/${apiLang}/${endpoint}${url.search}`
    };
  }

  // 5. Tangani AbortController untuk Membatalkan Request Lama
  if (abortPrevious && currentSearchAbortController) {
    currentSearchAbortController.abort();
  }
  const controller = new AbortController();
  if (abortPrevious) {
    currentSearchAbortController = controller;
  }

  // 6. Eksekusi Network Call dengan try / catch
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    // Validasi Status HTTP
    if (!response.ok) {
      throw new Error(`PotterAPI responded with HTTP ${response.status} (${response.statusText})`);
    }

    // Parsing dan Validasi JSON Payload
    const payload = await response.json();
    if (payload === null || typeof payload !== 'object') {
      throw new Error('Malformed or empty JSON data received from PotterAPI.');
    }

    // Simpan ke Cache
    memoryCache.set(cacheKey, payload);

    return {
      data: payload,
      endpointUrl: `/${apiLang}/${endpoint}${url.search}`
    };
  } catch (err) {
    // Abaikan error pembatalan jika sengaja dibatalkan oleh user
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error(`[PotterAPI Service Error] ${url.toString()}:`, err);
    throw new Error(err.message || 'Network error while summoning PotterAPI records.');
  }
}

/**
 * Membersihkan seluruh in-memory cache jika dibutuhkan (misal saat reset atau pergantian bahasa).
 */
export function clearApiCache() {
  memoryCache.clear();
}
