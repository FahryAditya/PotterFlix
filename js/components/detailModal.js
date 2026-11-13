/**
 * ============================================================================
 * File: js/components/detailModal.js
 * Deskripsi: Komponen pengendali Dialog Modal Inspeksi Detail Mendalam.
 *            Memanfaatkan parameter resmi PotterAPI (?index=N) untuk mengambil
 *            informasi spesifik dan lengkap dari suatu item, menampilkan poster,
 *            metadata lengkap, serta tombol aksi simpan ke favorit.
 * ============================================================================
 */

import { $ } from '../utils/dom.js';
import { fetchPotterResource } from '../services/potterApi.js';
import { normalizeItem, getHouseTheme } from '../utils/formatters.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class DetailModalController {
  /**
   * Konstruktor inisialisasi DetailModalController.
   * 
   * @param {object} options - Konfigurasi callback event
   * @param {Function} options.onFavoriteChange - Callback saat status bookmark di dalam modal diubah
   */
  constructor({ onFavoriteChange }) {
    // 1. Simpan handler callback
    this.onFavoriteChange = onFavoriteChange;

    // 2. Referensi elemen DOM modal
    this.modalEl = $('#detailModal');
    this.modalBodyEl = $('#detailModalBody');
    this.closeBtn = $('#closeDetailModalBtn');

    // 3. Status item yang sedang dibuka
    this.currentItem = null;
    this.currentProfile = null;
    this.currentLang = 'en';

    // 4. Pasang event listener penutupan modal
    this.bindEvents();
  }

  /**
   * Mengikat aksi penutupan modal (tombol silang X, klik di luar backdrop, dan tombol Escape keyboard).
   */
  bindEvents() {
    // Aksi Klik Tombol Close (X)
    this.closeBtn?.addEventListener('click', () => this.close());

    // Aksi Klik Backdrop: Tutup modal jika user mengklik area gelap di luar modal
    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Aksi Keyboard Escape: Tutup modal saat tombol ESC ditekan
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  /**
   * Membuka modal inspeksi dan mengambil detail data langsung melalui parameter resmi PotterAPI ?index=N.
   * 
   * @param {object} item - Objek normalized item ringkas yang diklik pengguna
   * @param {object} profile - Objek profil pengguna aktif
   * @param {string} [lang='en'] - Kode bahasa saat ini
   */
  async open(item, profile, lang = 'en') {
    this.currentItem = item;
    this.currentProfile = profile;
    this.currentLang = lang;

    if (!this.modalEl || !this.modalBodyEl) return;

    // 1. Tampilkan modal dengan status loading spinner
    this.modalEl.classList.remove('hidden');
    this.modalBodyEl.innerHTML = `
      <div class="py-16 text-center space-y-3">
        <i class="fa-solid fa-wand-sparkles text-2xl text-brand-red animate-spin"></i>
        <p class="text-xs text-neutral-400">Summoning detailed archives via PotterAPI (?index=${item.index})...</p>
      </div>
    `;

    // 2. Ambil data single item dari PotterAPI menggunakan parameter index
    try {
      const result = await fetchPotterResource({
        lang: this.currentLang,
        endpoint: item.endpoint,
        index: item.index
      });

      // Tangani format respons (bisa array tunggal atau objek langsung)
      const detailedData = Array.isArray(result.data) ? result.data[0] : result.data;
      const normalized = normalizeItem(item.endpoint, detailedData || item.raw, item.index);
      this.currentItem = normalized;

      // Render informasi lengkap ke dalam modal
      this.renderContent(normalized, detailedData || item.raw);
    } catch (err) {
      console.warn('[DetailModal] Gagal mengambil single item index, memuat fallback data cache:', err);
      this.renderContent(item, item.raw);
    }
  }

  /**
   * Menutup dialog modal inspeksi.
   */
  close() {
    this.modalEl?.classList.add('hidden');
  }

  /**
   * Merender konten detail spesifik ke dalam modal berdasarkan kategori endpoint (Books / Characters / Houses / Spells).
   * 
   * @param {object} item - Objek item terstandardisasi
   * @param {object} raw - Objek mentah dari API untuk membaca properti spesifik (children, founder, wand, dsb.)
   */
  renderContent(item, raw) {
    if (!this.modalBodyEl) return;

    // Cek apakah item sudah pernah disimpan di favorit
    const favorited = this.currentProfile
      ? isFavorite(this.currentProfile, item.endpoint, item.id)
      : false;

    let extraDetailsHTML = '';

    // 1. Detail Khusus BUKU
    if (item.endpoint === 'books') {
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Book Number:</span> <span class="font-bold text-white">#${raw.number || (item.index + 1)}</span></div>
          <div><span class="text-neutral-400">Pages:</span> <span class="font-bold text-white">${raw.pages || 'N/A'}</span></div>
          <div class="col-span-2"><span class="text-neutral-400">Release Date:</span> <span class="font-bold text-white">${raw.releaseDate || 'N/A'}</span></div>
        </div>
        <div class="space-y-1">
          <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Book Synopsis</h5>
          <p class="text-xs text-neutral-300 leading-relaxed">${raw.description || raw.summary || 'Official Hogwarts canon book.'}</p>
        </div>
      `;
    } 
    // 2. Detail Khusus KARAKTER
    else if (item.endpoint === 'characters') {
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Hogwarts House:</span> <span class="font-bold text-white">${raw.hogwartsHouse || 'None'}</span></div>
          <div><span class="text-neutral-400">Interpreted By:</span> <span class="font-bold text-white">${raw.interpretedBy || 'N/A'}</span></div>
          <div><span class="text-neutral-400">Birthdate:</span> <span class="font-bold text-white">${raw.birthdate || 'N/A'}</span></div>
          <div><span class="text-neutral-400">Index:</span> <span class="font-bold text-brand-gold font-mono">#${item.index}</span></div>
        </div>
        ${raw.children && raw.children.length ? `
          <div class="space-y-1">
            <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Children</h5>
            <p class="text-xs text-neutral-300">${Array.isArray(raw.children) ? raw.children.join(', ') : raw.children}</p>
          </div>
        ` : ''}
      `;
    } 
    // 3. Detail Khusus ASRAMA
    else if (item.endpoint === 'houses') {
      const colors = Array.isArray(raw.colors) ? raw.colors.join(', ') : (raw.colors || 'N/A');
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Founder:</span> <span class="font-bold text-white">${raw.founder || 'Hogwarts'}</span></div>
          <div><span class="text-neutral-400">House Animal:</span> <span class="font-bold text-white">${raw.animal || 'Magical Beast'}</span></div>
          <div><span class="text-neutral-400">House Ghost:</span> <span class="font-bold text-white">${raw.ghost || 'Hogwarts Ghost'}</span></div>
          <div><span class="text-neutral-400">Common Room:</span> <span class="font-bold text-white">${raw.commonRoom || 'Castle'}</span></div>
          <div class="col-span-2"><span class="text-neutral-400">Colors:</span> <span class="font-bold text-white">${colors}</span></div>
        </div>
      `;
    } 
    // 4. Detail Khusus MANTRA
    else {
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Incantation:</span> <span class="font-bold text-brand-gold font-mono">${raw.spell || item.title}</span></div>
          <div><span class="text-neutral-400">Archive Index:</span> <span class="font-bold text-white font-mono">#${item.index}</span></div>
        </div>
        <div class="space-y-1">
          <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Magical Effect & Usage</h5>
          <p class="text-xs text-neutral-300 leading-relaxed">${raw.use || 'Magical incantation from the Wizarding World.'}</p>
        </div>
      `;
    }

    // Susun markup lengkap modal inspeksi
    this.modalBodyEl.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-6">
        <!-- Kolom Kiri: Poster / Visual Thumbnail -->
        <div class="w-full sm:w-48 shrink-0">
          <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#18181c] border border-white/10 shadow-xl">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover"/>
            <div class="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-brand-red text-white uppercase tracking-wider">
              ${item.badge}
            </div>
          </div>
        </div>

        <!-- Kolom Kanan: Metadata & Tombol Aksi -->
        <div class="flex-1 space-y-4">
          <div>
            <div class="flex items-center gap-2 text-xs text-brand-gold font-semibold">
              <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
              <span class="uppercase tracking-widest text-[10px] text-neutral-400">${item.endpoint}</span>
            </div>
            <h3 class="font-display font-extrabold text-2xl text-white mt-1 leading-tight">${item.title}</h3>
            <p class="text-xs text-neutral-400 mt-0.5">${item.subtitle}</p>
          </div>

          <!-- Detail Spesifik Endpoint -->
          ${extraDetailsHTML}

          <!-- Tombol Aksi Bookmark Modal -->
          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button 
              type="button" 
              id="detailModalFavBtn"
              class="px-5 py-2.5 rounded-full ${favorited ? 'bg-white/15 border border-brand-gold/50 text-brand-gold' : 'bg-brand-red hover:bg-red-700 text-white'} font-display font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 active:scale-95"
            >
              <i class="${favorited ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
              <span>${favorited ? t(this.currentLang, 'viewInList') : t(this.currentLang, 'addToList')}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Pasang event listener pada tombol bookmark di dalam modal
    $('#detailModalFavBtn', this.modalBodyEl)?.addEventListener('click', () => {
      this.toggleFavorite(item);
    });
  }

  /**
   * Menambah atau menghapus item dari koleksi favorit pengguna langsung dari modal detail.
   * 
   * @param {object} item - Item yang sedang diinspeksi
   */
  toggleFavorite(item) {
    if (!item || !this.currentProfile) return;

    const favorited = isFavorite(this.currentProfile, item.endpoint, item.id);
    if (favorited) {
      removeFavorite(this.currentProfile, item.endpoint, item.id);
      showToast(`"${item.title}" ${t(this.currentLang, 'itemRemovedToast')}`, 'info');
    } else {
      addFavorite(this.currentProfile, item.endpoint, item);
      showToast(`"${item.title}" ${t(this.currentLang, 'itemAddedToast')}`, 'success');
    }

    // Render ulang tampilan tombol bookmark di modal
    this.renderContent(item, item.raw);

    // Beri tahu orchestrator agar navbar badge & kartu di katalog ikut terupdate
    if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
  }
}
