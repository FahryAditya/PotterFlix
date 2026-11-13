/**
 * ============================================================================
 * File: js/services/storageService.js
 * Deskripsi: Layanan penyimpanan persisten browser menggunakan LocalStorage.
 *            Mengelola profil pengguna (nama penyihir, preferensi bahasa) serta
 *            koleksi 4 kategori favorit (books, characters, houses, spells).
 * ============================================================================
 */

import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Struktur profil default standar jika pengguna baru pertama kali membuka web.
 * @type {Readonly<{wizardName: string, lang: string, favorites: {books: Array, characters: Array, houses: Array, spells: Array}}>}
 */
const DEFAULT_PROFILE = Object.freeze({
  wizardName: 'Harry Potter', // Nama penyihir default
  lang: 'en',                 // Bahasa default
  favorites: {
    books: [],                // Daftar koleksi buku favorit
    characters: [],           // Daftar koleksi karakter favorit
    houses: [],               // Daftar koleksi asrama favorit
    spells: []                // Daftar koleksi mantra favorit
  }
});

/**
 * Membaca status profil dan favorit dari LocalStorage browser.
 * Dilengkapi pengecekan try/catch dan validasi struktur data agar tidak crash jika JSON rusak.
 * 
 * @returns {object} Objek profil lengkap yang siap dipakai di aplikasi
 */
export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      return structuredClone(DEFAULT_PROFILE);
    }

    const parsed = JSON.parse(raw);
    return {
      wizardName: typeof parsed.wizardName === 'string' && parsed.wizardName.trim()
        ? parsed.wizardName.trim()
        : DEFAULT_PROFILE.wizardName,
      lang: typeof parsed.lang === 'string'
        ? parsed.lang
        : DEFAULT_PROFILE.lang,
      favorites: {
        books: Array.isArray(parsed.favorites?.books) ? parsed.favorites.books : [],
        characters: Array.isArray(parsed.favorites?.characters) ? parsed.favorites.characters : [],
        houses: Array.isArray(parsed.favorites?.houses) ? parsed.favorites.houses : [],
        spells: Array.isArray(parsed.favorites?.spells) ? parsed.favorites.spells : []
      }
    };
  } catch (err) {
    console.warn('[StorageService] Gagal membaca LocalStorage, memuat konfigurasi default:', err);
    return structuredClone(DEFAULT_PROFILE);
  }
}

/**
 * Menyimpan seluruh objek profil dan 4 kategori favorit ke LocalStorage.
 * 
 * @param {object} profile - Objek profil pengguna yang akan disimpan
 */
export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('[StorageService] Gagal menulis ke LocalStorage:', err);
  }
}

/**
 * Menambahkan suatu item ke salah satu dari 4 kategori favorit pengguna.
 * Jika item sudah ada di dalam list (berdasarkan ID), penambahan akan diabaikan.
 * 
 * @param {object} profile - Objek profil pengguna aktif
 * @param {string} category - Kategori target ('books' | 'characters' | 'houses' | 'spells')
 * @param {object} item - Objek normalized item yang ingin disimpan
 * @returns {boolean} Mengembalikan true jika berhasil ditambahkan, false jika sudah ada
 */
export function addFavorite(profile, category, item) {
  // 1. Pastikan array kategori ada
  if (!profile.favorites[category]) {
    profile.favorites[category] = [];
  }

  // 2. Cek apakah item sudah pernah disimpan
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

    // 3. Simpan perubahan ke LocalStorage
    saveProfile(profile);
    return true;
  }
  return false;
}

/**
 * Menghapus suatu item dari kategori favorit tertentu.
 * 
 * @param {object} profile - Objek profil pengguna aktif
 * @param {string} category - Kategori target ('books' | 'characters' | 'houses' | 'spells')
 * @param {string} itemId - ID unik item yang ingin dihapus (misal: 'characters-0')
 * @returns {boolean} Mengembalikan true jika item berhasil dihapus, false jika tidak ditemukan
 */
export function removeFavorite(profile, category, itemId) {
  if (!profile.favorites[category]) return false;

  const initialLength = profile.favorites[category].length;
  profile.favorites[category] = profile.favorites[category].filter(f => f.id !== itemId);

  // Jika panjang array berkurang, berarti item berhasil dihapus
  if (profile.favorites[category].length !== initialLength) {
    saveProfile(profile);
    return true;
  }
  return false;
}

/**
 * Memeriksa apakah suatu item saat ini sudah tersimpan di kategori favorit tertentu.
 * 
 * @param {object} profile - Objek profil pengguna aktif
 * @param {string} category - Kategori target ('books' | 'characters' | 'houses' | 'spells')
 * @param {string} itemId - ID unik item yang ingin diperiksa
 * @returns {boolean} True jika sudah tersimpan, false jika belum
 */
export function isFavorite(profile, category, itemId) {
  if (!profile.favorites || !profile.favorites[category]) return false;
  return profile.favorites[category].some(f => f.id === itemId);
}

/**
 * Mengosongkan seluruh koleksi favorit di ke-4 kategori secara bersamaan (Clear All).
 * 
 * @param {object} profile - Objek profil pengguna aktif
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
 * Menghitung total keseluruhan item favorit yang tersimpan di seluruh 4 kategori.
 * Digunakan untuk menampilkan angka badge counter live pada menu navigasi "My List".
 * 
 * @param {object} profile - Objek profil pengguna aktif
 * @returns {number} Jumlah total item favorit
 */
export function getTotalFavoritesCount(profile) {
  if (!profile.favorites) return 0;
  return ['books', 'characters', 'houses', 'spells'].reduce(
    (total, category) => total + (Array.isArray(profile.favorites[category]) ? profile.favorites[category].length : 0),
    0
  );
}
