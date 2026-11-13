/**
 * ============================================================================
 * File: js/components/toast.js
 * Deskripsi: Komponen notifikasi toast interaktif yang muncul di sudut bawah layar.
 *            Memberikan umpan balik instan kepada pengguna saat melakukan aksi
 *            (seperti menyimpan nama wizard, bookmark, atau notifikasi error).
 * ============================================================================
 */

import { $ } from '../utils/dom.js';

/**
 * Menyimpan ID timeout aktif agar toast tidak tumpang tindih saat dipanggil berulang kali.
 * @type {number|null}
 */
let toastTimeoutId = null;

/**
 * Menampilkan pesan notifikasi toast dengan animasi meluncur (slide-in) dan hilang otomatis.
 * 
 * @param {string} message - Pesan teks yang ingin ditampilkan ke pengguna
 * @param {'success'|'info'|'error'} [type='success'] - Jenis status notifikasi untuk menentukan ikon
 */
export function showToast(message, type = 'success') {
  // 1. Ambil elemen DOM kontainer toast dan teks
  const toastContainer = $('#toastNotification');
  const toastMessageEl = $('#toastMessage');
  const toastIconEl = $('#toastIcon');

  if (!toastContainer || !toastMessageEl) return;

  // 2. Pasang teks pesan
  toastMessageEl.textContent = message;

  // 3. Tentukan ikon FontAwesome berdasarkan jenis status
  if (toastIconEl) {
    if (type === 'error') {
      toastIconEl.className = 'fa-solid fa-triangle-exclamation text-amber-500';
    } else if (type === 'info') {
      toastIconEl.className = 'fa-solid fa-circle-info text-blue-400';
    } else {
      toastIconEl.className = 'fa-solid fa-circle-check text-brand-red';
    }
  }

  // 4. Picu animasi masuk (muncul dari bawah)
  toastContainer.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toastContainer.classList.add('translate-y-0', 'opacity-100');

  // 5. Bersihkan timer lama jika user memicu toast baru secara cepat
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  // 6. Pasang timer untuk menyembunyikan toast setelah 3.2 detik
  toastTimeoutId = setTimeout(() => {
    toastContainer.classList.remove('translate-y-0', 'opacity-100');
    toastContainer.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 3200);
}
