/**
 * ============================================================================
 * File: js/config/constants.js
 * Deskripsi: Konfigurasi konstanta global, endpoint resmi PotterAPI, tema warna
 *            asrama Hogwarts, serta key penyimpanan browser LocalStorage.
 * ============================================================================
 */

/**
 * URL dasar (base URL) resmi untuk mengakses layanan PotterAPI (by Fede Perin).
 * Layanan ini menyediakan data buku, karakter, asrama, dan mantra sihir.
 * @type {string}
 */
export const API_BASE_URL = 'https://potterapi-fedeperin.vercel.app';

/**
 * Daftar endpoint resmi yang valid dan didukung oleh PotterAPI.
 * Menggunakan Object.freeze agar nilainya tidak dapat diubah (immutable).
 * @type {ReadonlyArray<string>}
 */
export const VALID_ENDPOINTS = Object.freeze([
  'books',       // Data buku canon Harry Potter
  'characters',  // Data karakter penyihir & makhluk sihir
  'houses',      // Data 4 asrama resmi Hogwarts
  'spells'       // Data mantra sihir canon
]);

/**
 * Bahasa standar (default fallback) jika user belum menentukan bahasa.
 * @type {string}
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Konfigurasi tema warna dan ikon untuk masing-masing asrama Hogwarts.
 * Digunakan untuk styling dinamis kartu karakter, modal, serta fallback poster.
 * @type {Readonly<Record<string, {primaryColor: string, secondaryColor: string, accentColor: string, icon: string, borderClass: string}>>}
 */
export const HOUSE_THEMES = Object.freeze({
  Gryffindor: {
    primaryColor: '#7f1d1d',   // Merah tua marun khas Gryffindor
    secondaryColor: '#b45309', // Emas kecokelatan sekunder
    accentColor: '#F5B50A',    // Emas terang bercahaya
    icon: '🦁',                // Simbol Singa keberanian
    borderClass: 'border-amber-600/40'
  },
  Slytherin: {
    primaryColor: '#064e3b',   // Hijau zamrud tua khas Slytherin
    secondaryColor: '#1e293b', // Abu-abu perak gelap sekunder
    accentColor: '#34d399',    // Hijau cerah aksen
    icon: '🐍',                // Simbol Ular kecerdikan
    borderClass: 'border-emerald-600/40'
  },
  Ravenclaw: {
    primaryColor: '#1e3a8a',   // Biru safir tua khas Ravenclaw
    secondaryColor: '#312e81', // Perunggu/indigo sekunder
    accentColor: '#60a5fa',    // Biru langit aksen kecerdasan
    icon: '🦅',                // Simbol Elang kebijaksanaan
    borderClass: 'border-blue-600/40'
  },
  Hufflepuff: {
    primaryColor: '#78350f',   // Kuning kenari hangat & tanah khas Hufflepuff
    secondaryColor: '#1c1917', // Hitam pekat sekunder
    accentColor: '#fbbf24',    // Kuning cerah aksen loyalitas
    icon: '🦡',                // Simbol Luwak ketekunan
    borderClass: 'border-yellow-600/40'
  }
});

/**
 * Tema fallback umum jika karakter atau item tidak memiliki data asrama Hogwarts.
 * @type {Readonly<{primaryColor: string, secondaryColor: string, accentColor: string, icon: string, borderClass: string}>}
 */
export const DEFAULT_FALLBACK_THEME = Object.freeze({
  primaryColor: '#3f3f46',     // Abu-abu gelap netral
  secondaryColor: '#18181b',   // Charcoal hitam
  accentColor: '#E50914',      // Merah khas PotterFlix
  icon: '⚡',                  // Simbol kilat Harry Potter
  borderClass: 'border-neutral-700/40'
});

/**
 * Key identifikasi unik untuk penyimpanan di LocalStorage browser.
 * Digunakan untuk menyimpan nama wizard dan 4 kategori koleksi favorit.
 * @type {Readonly<{PROFILE: string}>}
 */
export const STORAGE_KEYS = Object.freeze({
  PROFILE: 'potterflix_wizard_profile_v2'
});
