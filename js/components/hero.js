/**
 * ============================================================================
 * File: js/components/hero.js
 * Deskripsi: Komponen pengendali Hero Showcase Banner sinematik.
 *            Menampilkan judul unggulan dengan visual latar belakang gelap,
 *            skor rating canon, sinopsis, tombol penjelajahan detail ("Explore Details"),
 *            tombol simpan ke "My List", serta titik-titik navigasi pagination slider.
 * ============================================================================
 */

import { $, $$ } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class HeroController {
  /**
   * Konstruktor inisialisasi HeroController.
   * 
   * @param {object} options - Konfigurasi event handler
   * @param {Function} options.onExplore - Callback saat tombol "Explore Details" diklik untuk membuka modal
   * @param {Function} options.onFavoriteChange - Callback saat status bookmark hero diubah
   */
  constructor({ onExplore, onFavoriteChange }) {
    // 1. Simpan handler callback
    this.onExplore = onExplore;
    this.onFavoriteChange = onFavoriteChange;

    // 2. Referensi elemen DOM Hero Banner
    this.backdropImg = $('#heroBackdropImg');
    this.badgeTag = $('#heroBadgeTag');
    this.metaPrimary = $('#heroMetaPrimary');
    this.ratingScore = $('#heroRatingScore');
    this.titleEl = $('#heroTitle');
    this.descEl = $('#heroDescription');
    this.exploreBtn = $('#heroExploreBtn');
    this.addListBtn = $('#heroAddListBtn');
    this.addListIcon = $('#heroAddListIcon');
    this.addListLabel = $('#heroAddListLabel');
    this.dotsContainer = $('#heroPaginationDots');

    // 3. Status internal
    this.items = [];            // Koleksi item yang dijadikan highlight di hero banner
    this.currentIndex = 0;      // Index slide yang sedang aktif ditampilkan
    this.currentProfile = null; // Profil pengguna untuk sinkronisasi bookmark
    this.currentLang = 'en';    // Bahasa yang sedang aktif

    // 4. Pasang event listener
    this.bindEvents();
  }

  /**
   * Mengikat aksi tombol "Explore Details" dan "My List" pada hero banner.
   */
  bindEvents() {
    // Aksi Klik Tombol "Explore Details": Menampilkan modal detail inspeksi mendalam (?index=)
    this.exploreBtn?.addEventListener('click', () => {
      const currentItem = this.items[this.currentIndex];
      if (currentItem && this.onExplore) {
        this.onExplore(currentItem);
      }
    });

    // Aksi Klik Tombol "My List": Menambah atau menghapus judul unggulan dari koleksi favorit
    this.addListBtn?.addEventListener('click', () => {
      const currentItem = this.items[this.currentIndex];
      if (!currentItem || !this.currentProfile) return;

      const favorited = isFavorite(this.currentProfile, currentItem.endpoint, currentItem.id);
      if (favorited) {
        // Hapus dari favorit jika sebelumnya sudah ada
        removeFavorite(this.currentProfile, currentItem.endpoint, currentItem.id);
        showToast(`"${currentItem.title}" ${t(this.currentLang, 'itemRemovedToast')}`, 'info');
      } else {
        // Tambahkan ke favorit jika belum ada
        addFavorite(this.currentProfile, currentItem.endpoint, currentItem);
        showToast(`"${currentItem.title}" ${t(this.currentLang, 'itemAddedToast')}`, 'success');
      }

      // Perbarui tampilan tombol dan beri tahu komponen lain
      this.updateAddListButton();
      if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
    });
  }

  /**
   * Mengatur data item yang akan ditampilkan pada carousel hero banner.
   * 
   * @param {Array<object>} items - Daftar normalized items (biasanya buku atau karakter utama)
   * @param {object} profile - Objek profil pengguna aktif
   * @param {string} [lang='en'] - Kode bahasa saat ini
   */
  setItems(items, profile, lang = 'en') {
    this.items = items || [];
    this.currentProfile = profile;
    this.currentLang = lang;
    this.currentIndex = 0;

    if (this.items.length === 0) return;
    this.renderDots();
    this.renderCurrent();
  }

  /**
   * Memperbarui profil pengguna atau bahasa pada hero banner secara reaktif.
   * 
   * @param {object} profile - Profil pengguna terbaru
   * @param {string} [lang] - Kode bahasa jika ada perubahan bahasa
   */
  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.updateAddListButton();
  }

  /**
   * Merender konten slide hero banner yang sedang aktif berdasarkan this.currentIndex.
   */
  renderCurrent() {
    const item = this.items[this.currentIndex];
    if (!item) return;

    // Pasang gambar backdrop dengan efek transisi halus
    if (this.backdropImg) {
      this.backdropImg.src = item.image;
      this.backdropImg.alt = item.title;
    }
    // Pasang lencana (misal: 'BOOK #1')
    if (this.badgeTag) this.badgeTag.textContent = item.badge || 'FEATURED';
    // Pasang informasi metadata sekunder (misal: jumlah halaman & tanggal rilis)
    if (this.metaPrimary) this.metaPrimary.textContent = item.subtitle || 'Wizarding Canon';
    // Pasang skor rating sinematik
    if (this.ratingScore) this.ratingScore.textContent = '9.8';
    // Pasang judul utama
    if (this.titleEl) this.titleEl.textContent = item.title;
    // Pasang sinopsis ringkas
    if (this.descEl) {
      this.descEl.textContent = item.description ||
        `Enter the enchanting universe of ${item.title}. Explore official archives, magical spells, and lore powered by PotterAPI.`;
    }

    this.updateAddListButton();
    this.updateDots();
  }

  /**
   * Memperbarui ikon dan teks tombol "My List" pada hero banner (tanda plus vs tanda centang hijau).
   */
  updateAddListButton() {
    const currentItem = this.items[this.currentIndex];
    if (!currentItem || !this.currentProfile) return;

    const favorited = isFavorite(this.currentProfile, currentItem.endpoint, currentItem.id);
    if (favorited) {
      // Jika sudah ada di favorit: tampilkan centang dan sorot merah transparan
      this.addListIcon?.classList.replace('fa-plus', 'fa-check');
      if (this.addListLabel) this.addListLabel.textContent = t(this.currentLang, 'viewInList');
      this.addListBtn?.classList.add('bg-brand-red/30', 'border-brand-red');
    } else {
      // Jika belum ada di favorit: tampilkan plus
      this.addListIcon?.classList.replace('fa-check', 'fa-plus');
      if (this.addListLabel) this.addListLabel.textContent = t(this.currentLang, 'heroAddListCta');
      this.addListBtn?.classList.remove('bg-brand-red/30', 'border-brand-red');
    }
  }

  /**
   * Merender titik-titik bulat pagination navigasi slider di bagian bawah hero banner.
   */
  renderDots() {
    if (!this.dotsContainer) return;
    const maxDots = Math.min(this.items.length, 6); // Maksimal 6 titik agar rapi

    this.dotsContainer.innerHTML = Array.from({ length: maxDots }).map((_, i) => `
      <button 
        type="button" 
        data-hero-dot="${i}" 
        aria-label="Slide ${i + 1}"
        class="h-1.5 rounded-full transition-all duration-300 ${i === this.currentIndex ? 'w-8 bg-brand-red' : 'w-2 bg-white/40 hover:bg-white/80'}"
      ></button>
    `).join('');

    // Aksi Klik pada Titik: Berpindah ke slide yang dipilih
    $$('[data-hero-dot]', this.dotsContainer).forEach(dotBtn => {
      dotBtn.addEventListener('click', () => {
        const targetIndex = Number(dotBtn.dataset.heroDot);
        this.currentIndex = targetIndex;
        this.renderCurrent();
      });
    });
  }

  /**
   * Memperbarui ukuran titik aktif (lebar 32px merah vs 8px abu-abu transparan).
   */
  updateDots() {
    if (!this.dotsContainer) return;
    $$('[data-hero-dot]', this.dotsContainer).forEach((dotBtn, i) => {
      const isActive = i === this.currentIndex;
      dotBtn.className = `h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-brand-red' : 'w-2 bg-white/40 hover:bg-white/80'}`;
    });
  }
}
