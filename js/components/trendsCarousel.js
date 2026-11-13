/**
 * ============================================================================
 * File: js/components/trendsCarousel.js
 * Deskripsi: Komponen pengendali carousel horizontal "Trends Now".
 *            Menyediakan tombol scroll geser kiri/kanan yang halus, toggle sumber
 *            data ("Popular Books" vs "Iconic Wizards"), serta kartu beranimasi
 *            dengan lencana canon, rating, dan tombol bookmark favorit.
 * ============================================================================
 */

import { $, $$ } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class TrendsCarouselController {
  /**
   * Konstruktor inisialisasi TrendsCarouselController.
   * 
   * @param {object} options - Konfigurasi event handler
   * @param {Function} options.onSourceChange - Callback saat user beralih antara tab Books / Characters
   * @param {Function} options.onItemClick - Callback saat kartu diklik untuk membuka modal inspeksi
   * @param {Function} options.onFavoriteChange - Callback saat bookmark kartu diklik
   */
  constructor({ onSourceChange, onItemClick, onFavoriteChange }) {
    // 1. Simpan handler callback
    this.onSourceChange = onSourceChange;
    this.onItemClick = onItemClick;
    this.onFavoriteChange = onFavoriteChange;

    // 2. Referensi elemen DOM Carousel
    this.trackEl = $('#trendsTrack');
    this.prevBtn = $('#trendsPrevBtn');
    this.nextBtn = $('#trendsNextBtn');
    this.sourceTabs = $$('.trend-tab');

    // 3. Status internal carousel
    this.items = [];                 // Daftar item yang sedang dirender di carousel
    this.currentProfile = null;      // Profil pengguna untuk verifikasi status favorit
    this.currentLang = 'en';         // Bahasa yang sedang aktif
    this.currentSource = 'books';    // Sumber data aktif: 'books' atau 'characters'

    // 4. Pasang event listener
    this.bindEvents();
  }

  /**
   * Mengikat aksi tombol geser (prev/next) dan tab peralihan sumber ("Popular Books" / "Iconic Wizards").
   */
  bindEvents() {
    // Aksi Klik Tombol Panah Kiri: Geser track ke kiri sejauh 360px
    this.prevBtn?.addEventListener('click', () => {
      if (this.trackEl) {
        this.trackEl.scrollBy({ left: -360, behavior: 'smooth' });
      }
    });

    // Aksi Klik Tombol Panah Kanan: Geser track ke kanan sejauh 360px
    this.nextBtn?.addEventListener('click', () => {
      if (this.trackEl) {
        this.trackEl.scrollBy({ left: 360, behavior: 'smooth' });
      }
    });

    // Aksi Klik Tab Sumber Data ("Popular Books" vs "Iconic Wizards")
    this.sourceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const source = tab.dataset.trendSource;
        if (source === this.currentSource) return;
        this.currentSource = source;

        // Perbarui highlight tab aktif
        this.sourceTabs.forEach(tBtn => {
          const isActive = tBtn.dataset.trendSource === source;
          tBtn.classList.toggle('text-white', isActive);
          tBtn.classList.toggle('text-neutral-400', !isActive);
        });

        // Picu callback pergantian data di main orchestrator
        if (this.onSourceChange) {
          this.onSourceChange(source);
        }
      });
    });
  }

  /**
   * Memasukkan data baru ke dalam carousel dan merendernya.
   * 
   * @param {Array<object>} items - Daftar normalized items
   * @param {object} profile - Objek profil pengguna aktif
   * @param {string} [lang='en'] - Kode bahasa saat ini
   */
  setItems(items, profile, lang = 'en') {
    this.items = items || [];
    this.currentProfile = profile;
    this.currentLang = lang;
    this.render();
  }

  /**
   * Memperbarui profil pengguna dan memicu render ulang bookmark.
   * 
   * @param {object} profile - Objek profil pengguna terbaru
   * @param {string} [lang] - Kode bahasa jika ada perubahan
   */
  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.render();
  }

  /**
   * Merender seluruh kartu item di dalam track horizontal carousel.
   */
  render() {
    if (!this.trackEl) return;

    if (this.items.length === 0) {
      this.trackEl.innerHTML = `
        <div class="py-8 text-neutral-500 text-xs text-center w-full">
          Loading wizarding trends...
        </div>
      `;
      return;
    }

    // Bangun markup HTML untuk setiap kartu
    this.trackEl.innerHTML = this.items.map(item => {
      const favorited = this.currentProfile
        ? isFavorite(this.currentProfile, item.endpoint, item.id)
        : false;

      return `
        <div 
          data-trend-item-id="${item.id}"
          class="flex-none w-[155px] sm:w-[190px] group cursor-pointer transition-transform duration-300 hover:scale-105 select-none"
        >
          <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a1e] border border-white/10 group-hover:border-brand-red/60 shadow-lg">
            <img 
              src="${item.image}" 
              alt="${item.title}" 
              loading="lazy" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30"></div>

            <!-- Lencana Canon Atas -->
            <div class="absolute top-2 left-2 z-10">
              <span class="px-2 py-0.5 rounded text-[9px] font-display font-extrabold bg-brand-red text-white uppercase tracking-wider shadow">
                ${item.badge}
              </span>
            </div>

            <!-- Tombol Bookmark Cepat -->
            <button 
              type="button" 
              data-fav-action="${item.id}"
              title="Bookmark"
              class="absolute top-2 right-2 z-10 w-7 h-7 rounded-full ${favorited ? 'bg-brand-red text-white' : 'bg-black/60 text-white/70 hover:text-white'} flex items-center justify-center text-xs transition active:scale-90"
            >
              <i class="${favorited ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>

            <!-- Informasi Judul & Rating Bawah -->
            <div class="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-0.5">
              <div class="flex items-center gap-1 text-[10px] text-brand-gold font-bold">
                <i class="fa-solid fa-star text-[9px]"></i>
                <span>9.${(item.index % 5) + 4}</span>
                <span class="text-neutral-400 font-normal ml-1 truncate">${item.metric}</span>
              </div>
              <h4 class="font-display font-bold text-xs text-white truncate group-hover:text-brand-red transition">
                ${item.title}
              </h4>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Pasang event listener klik pada setiap kartu dan tombol bookmark
    $$('[data-trend-item-id]', this.trackEl).forEach(card => {
      const itemId = card.dataset.trendItemId;
      const targetItem = this.items.find(i => i.id === itemId);

      card.addEventListener('click', (e) => {
        // Aksi jika yang diklik adalah tombol bookmark
        const favBtn = e.target.closest('[data-fav-action]');
        if (favBtn) {
          e.stopPropagation();
          this.toggleFavorite(targetItem);
          return;
        }

        // Aksi jika yang diklik adalah badan kartu: buka modal detail
        if (targetItem && this.onItemClick) {
          this.onItemClick(targetItem);
        }
      });
    });
  }

  /**
   * Menambah atau menghapus item dari koleksi favorit pengguna.
   * 
   * @param {object} item - Item yang ingin di-bookmark
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

    this.render();
    if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
  }
}
