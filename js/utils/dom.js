/**
 * ============================================================================
 * File: js/utils/dom.js
 * Deskripsi: Kumpulan fungsi utilitas helper untuk manipulasi DOM, pembersihan
 *            string dari risiko XSS, serta fungsi debounce untuk penundaan aksi input.
 * ============================================================================
 */

/**
 * Shorthand helper query selector untuk mengambil 1 elemen HTML pertama yang cocok.
 * Mirip dengan document.querySelector namun lebih ringkas.
 * 
 * @param {string} selector - Selector CSS yang ingin dicari (misal: '#myId', '.myClass')
 * @param {HTMLElement|Document} [scope=document] - Elemen induk tempat pencarian dimulai (default: document)
 * @returns {HTMLElement|null} Mengembalikan elemen DOM yang cocok, atau null jika tidak ditemukan
 */
export function $(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Shorthand helper query selector untuk mengambil semua elemen yang cocok sebagai Array native.
 * Memudahkan penggunaan method array modern seperti .map(), .forEach(), .filter().
 * 
 * @param {string} selector - Selector CSS yang ingin dicari
 * @param {HTMLElement|Document} [scope=document] - Elemen induk tempat pencarian dimulai (default: document)
 * @returns {Array<HTMLElement>} Array berisi seluruh elemen DOM yang cocok
 */
export function $$(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Sanitasi string untuk mencegah celah keamanan Cross-Site Scripting (XSS).
 * Mengubah karakter khusus HTML (<, >, &, ", ') menjadi entity code yang aman dirender.
 * 
 * @param {string} str - String teks mentah yang mungkin mengandung karakter bahaya
 * @returns {string} String yang telah disanitasi secara aman
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Fungsi penunda eksekusi (debounce) untuk mengoptimalkan performa input pengguna.
 * Berguna saat user mengetik di search bar agar request API tidak ditembakkan di setiap ketukan tombol,
 * melainkan menunggu jeda beberapa milidetik setelah user berhenti mengetik.
 * 
 * @param {Function} func - Fungsi callback target yang ingin ditunda
 * @param {number} [wait=300] - Waktu tunggu dalam milidetik (default: 300ms)
 * @returns {Function} Fungsi debounced yang siap dipasang pada event listener
 */
export function debounce(func, wait = 300) {
  let timeoutId = null;

  return function debounced(...args) {
    // 1. Bersihkan timer sebelumnya jika user mengetik lagi sebelum waktu tunggu habis
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 2. Pasang timer baru untuk mengeksekusi fungsi target
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}
