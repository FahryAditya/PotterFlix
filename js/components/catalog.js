/**
 * ============================================================================
 * File: js/components/catalog.js
 * Deskripsi: Komponen pengendali utama Katalog Ensiklopedia Dunia Sihir.
 *            Mengimplementasikan sistem filter bertingkat (Tier 1: Endpoint utama,
 *            Tier 2: Sub-filter dinamis seperti Asrama / Era / Tipe Mantra,
 *            Tier 3: Pencarian dan batasan limit), sorting dinamis, pagination API,
 *            loading skeleton shimmer, serta penanganan error state dengan tombol Retry.
 * ============================================================================
 */

import { $, $$, debounce } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class CatalogController {
  /**
   * Konstruktor inisialisasi CatalogController.
   * 
   * @param {object} options - Konfigurasi callback event
   * @param {Function} options.onRequestData - Callback saat filter/search/pagination berubah dan perlu fetch data baru
   * @param {Function} options.onItemClick - Callback saat kartu diklik untuk membuka modal inspeksi (?index=)
   * @param {Function} options.onFavoriteChange - Callback saat status bookmark kartu diubah
   */
  constructor({ onRequestData, onItemClick, onFavoriteChange }) {
    // 1. Simpan handler callback
    this.onRequestData = onRequestData;
    this.onItemClick = onItemClick;
    this.onFavoriteChange = onFavoriteChange;

    // 2. Referensi elemen-elemen DOM katalog
    this.gridEl = $('#catalogGrid');
    this.titleEl = $('#catalogSectionTitle');
    this.countBadgeEl = $('#catalogCountBadge');
    this.endpointBadgeEl = $('#apiEndpointBadge');
    this.errorBannerEl = $('#apiErrorBanner');
    this.errorMessageEl = $('#apiErrorMessage');
    this.retryBtn = $('#retryApiBtn');
    this.resetFiltersBtn = $('#resetAllFiltersBtn');
    this.tier1Pills = $$('.tier1-pill');
    this.tier2Container = $('#tier2PillsContainer');
    this.tier2Label = $('#tier2Label');
    this.sortSelect = $('#sortSelect');
    this.apiMaxSelect = $('#apiMaxSelect');
    this.prevPageBtn = $('#prevPageBtn');
    this.nextPageBtn = $('#nextPageBtn');
    this.pageIndicatorText = $('#pageIndicatorText');
    this.sectionSearchInput = $('#sectionSearchInput');
    this.sectionSearchClear = $('#sectionSearchClear');

    // 3. Status filter bertingkat & pagination
    this.currentEndpoint = 'books';       // Tier 1: 'books', 'characters', 'houses', 'spells'
    this.currentTier2Filter = 'all';      // Tier 2: Sub-filter dinamis kontekstual
    this.currentSort = 'default';         // Opsi sorting: 'default', 'az', 'za', 'metricDesc'
    this.currentMax = 12;                 // Limit pagination PotterAPI (?max=)
    this.currentPage = 1;                 // Nomor halaman PotterAPI (?page=)
    this.currentSearch = '';              // Parameter pencarian PotterAPI (?search=)
    this.currentLang = 'en';              // Bahasa aktif
    this.currentProfile = null;           // Objek profil pengguna aktif
    this.rawItems = [];                   // Data mentah hasil fetch
    this.displayedItems = [];             // Data yang sedang ditampilkan setelah filter & sort

    // 4. Inisialisasi event listener dan pill Tier 2
    this.bindEvents();
    this.renderTier2Pills();
  }

  /**
   * Mengikat seluruh listener interaksi filter, sort, search, pagination, dan retry.
   */
  bindEvents() {
    // Aksi Klik Tier 1: Memilih kategori utama (Books / Characters / Houses / Spells)
    this.tier1Pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const endpoint = pill.dataset.endpoint;
        if (endpoint === this.currentEndpoint) return;
        this.setEndpoint(endpoint);
      });
    });

    // Aksi Klik "Reset Filters": Mengembalikan semua filter, pencarian, dan pagination ke default
    this.resetFiltersBtn?.addEventListener('click', () => {
      this.currentTier2Filter = 'all';
      this.currentSort = 'default';
      this.currentSearch = '';
      this.currentPage = 1;
      if (this.sectionSearchInput) this.sectionSearchInput.value = '';
      if (this.sortSelect) this.sortSelect.value = 'default';
      this.renderTier2Pills();
      this.triggerFetch();
    });

    // Aksi Perubahan Dropdown Sort: Urutkan data secara lokal (A-Z, Z-A, Halaman, Default)
    this.sortSelect?.addEventListener('change', () => {
      this.currentSort = this.sortSelect.value;
      this.applyLocalSortAndFilter();
    });

    // Aksi Perubahan Dropdown Limit (?max): Ubah jumlah item per halaman dan kembali ke halaman 1
    this.apiMaxSelect?.addEventListener('change', () => {
      this.currentMax = Number(this.apiMaxSelect.value);
      this.currentPage = 1;
      this.triggerFetch();
    });

    // Aksi Tombol Halaman Sebelumnya (Prev Page): ?page=N-1
    this.prevPageBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.triggerFetch();
      }
    });

    // Aksi Tombol Halaman Berikutnya (Next Page): ?page=N+1
    this.nextPageBtn?.addEventListener('click', () => {
      this.currentPage++;
      this.triggerFetch();
    });

    // Aksi Input Live Search Seksi Katalog (?search=): Menggunakan debounce 350ms
    this.sectionSearchInput?.addEventListener('input', debounce(() => {
      const query = this.sectionSearchInput.value.trim();
      this.currentSearch = query;
      this.currentPage = 1;
      this.sectionSearchClear?.classList.toggle('hidden', query.length === 0);
      this.triggerFetch();
    }, 350));

    // Aksi Klik Tombol Clear Search (X): Bersihkan input dan refresh data
    this.sectionSearchClear?.addEventListener('click', () => {
      if (this.sectionSearchInput) this.sectionSearchInput.value = '';
      this.currentSearch = '';
      this.sectionSearchClear?.classList.add('hidden');
      this.currentPage = 1;
      this.triggerFetch();
      this.sectionSearchInput?.focus();
    });

    // Aksi Klik Tombol Retry pada Error Banner
    this.retryBtn?.addEventListener('click', () => {
      this.triggerFetch();
    });
  }

  /**
   * Mengganti endpoint Tier 1 aktif dan memperbarui UI terkait.
   * 
   * @param {string} endpoint - 'books' | 'characters' | 'houses' | 'spells'
   */
  setEndpoint(endpoint) {
    this.currentEndpoint = endpoint;
    this.currentTier2Filter = 'all';
    this.currentPage = 1;
    this.currentSearch = '';
    if (this.sectionSearchInput) this.sectionSearchInput.value = '';

    // Perbarui styling tombol pill Tier 1
    this.tier1Pills.forEach(pill => {
      const match = pill.dataset.endpoint === endpoint;
      pill.classList.toggle('bg-brand-red', match);
      pill.classList.toggle('text-white', match);
      pill.classList.toggle('shadow-[0_2px_12px_rgba(229,9,20,0.5)]', match);
      pill.classList.toggle('bg-[#202020]', !match);
      pill.classList.toggle('text-neutral-300', !match);
    });

    // Perbarui judul seksi ensiklopedia sesuai bahasa
    if (this.titleEl) {
      const titles = {
        books: t(this.currentLang, 'navBooks'),
        characters: t(this.currentLang, 'navCharacters'),
        houses: t(this.currentLang, 'navHouses'),
        spells: t(this.currentLang, 'navSpells')
      };
      this.titleEl.textContent = titles[endpoint] || 'Wizarding Encyclopedia';
    }

    // Bangun ulang tombol filter Tier 2 yang sesuai dengan kategori terpilih
    this.renderTier2Pills();
    this.triggerFetch();
  }

  /**
   * Merender tombol sub-filter dinamis (Tier 2) sesuai endpoint yang sedang aktif:
   * - Karakter: Filter asrama (All, Gryffindor, Slytherin, Ravenclaw, Hufflepuff)
   * - Buku: Filter era (Classic Saga #1-4 vs Dark War Saga #5-7)
   * - Mantra: Filter jenis (Charms & Defense vs Curses & Hexes)
   * - Asrama: All
   */
  renderTier2Pills() {
    if (!this.tier2Container) return;

    let subOptions = [];
    if (this.currentEndpoint === 'characters') {
      if (this.tier2Label) this.tier2Label.textContent = t(this.currentLang, 'tier2HouseLabel');
      subOptions = [
        { key: 'all', label: t(this.currentLang, 'allFilter') },
        { key: 'Gryffindor', label: '🦁 Gryffindor' },
        { key: 'Slytherin', label: '🐍 Slytherin' },
        { key: 'Ravenclaw', label: '🦅 Ravenclaw' },
        { key: 'Hufflepuff', label: '🦡 Hufflepuff' }
      ];
    } else if (this.currentEndpoint === 'books') {
      if (this.tier2Label) this.tier2Label.textContent = t(this.currentLang, 'tier2EraLabel');
      subOptions = [
        { key: 'all', label: t(this.currentLang, 'allFilter') },
        { key: 'classic', label: 'Classic Saga (#1–4)' },
        { key: 'dark', label: 'Dark War Saga (#5–7)' }
      ];
    } else if (this.currentEndpoint === 'spells') {
      if (this.tier2Label) this.tier2Label.textContent = t(this.currentLang, 'tier2SpellLabel');
      subOptions = [
        { key: 'all', label: t(this.currentLang, 'allFilter') },
        { key: 'charms', label: 'Charms & Defense' },
        { key: 'curses', label: 'Curses & Hexes' }
      ];
    } else {
      if (this.tier2Label) this.tier2Label.textContent = 'Tier 2 • Hogwarts Legacy:';
      subOptions = [
        { key: 'all', label: t(this.currentLang, 'allFilter') }
      ];
    }

    // Render pill ke dalam DOM
    this.tier2Container.innerHTML = subOptions.map(opt => `
      <button 
        type="button" 
        data-tier2-filter="${opt.key}" 
        class="tier2-pill px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${opt.key === this.currentTier2Filter ? 'bg-brand-red text-white' : 'bg-[#25252b] hover:bg-[#303038] text-neutral-300'}"
      >
        ${opt.label}
      </button>
    `).join('');

    // Pasang event klik pada tombol sub-filter Tier 2
    $$('[data-tier2-filter]', this.tier2Container).forEach(btn => {
      btn.addEventListener('click', () => {
        const filterKey = btn.dataset.tier2Filter;
        this.currentTier2Filter = filterKey;
        this.renderTier2Pills();
        this.applyLocalSortAndFilter();
      });
    });
  }

  /**
   * Menampilkan loading skeletons dan memicu pemanggilan callback pengambilan data (onRequestData).
   */
  triggerFetch() {
    this.renderSkeletons();
    this.hideErrorBanner();

    if (this.onRequestData) {
      this.onRequestData({
        endpoint: this.currentEndpoint,
        search: this.currentSearch,
        max: this.currentMax,
        page: this.currentPage,
        lang: this.currentLang
      });
    }
  }

  /**
   * Memasukkan data baru dari hasil pemanggilan API ke dalam katalog.
   * 
   * @param {Array<object>} normalizedItems - Array data yang telah distandardisasi
   * @param {string} [endpointUrl=''] - URL endpoint yang dipakai (untuk indikator hijau API di UI)
   * @param {object} [profile=null] - Profil pengguna terbaru
   */
  setItems(normalizedItems, endpointUrl = '', profile = null) {
    this.rawItems = normalizedItems || [];
    if (profile) this.currentProfile = profile;

    // Tampilkan informasi endpoint aktif pada badge pojok kanan atas
    if (this.endpointBadgeEl) {
      this.endpointBadgeEl.textContent = `GET ${endpointUrl || `/${this.currentLang}/${this.currentEndpoint}`}`;
    }

    // Terapkan filter Tier 2 dan sorting lokal
    this.applyLocalSortAndFilter();
  }

  /**
   * Melakukan filtering Tier 2 (asrama, era, tipe mantra) dan pengurutan (sorting) data.
   */
  applyLocalSortAndFilter() {
    let result = [...this.rawItems];

    // 1. Eksekusi Sub-Filter Tier 2
    if (this.currentTier2Filter !== 'all') {
      if (this.currentEndpoint === 'characters') {
        // Filter asrama karakter
        result = result.filter(item => {
          const house = (item.raw?.hogwartsHouse || '').toLowerCase();
          return house.includes(this.currentTier2Filter.toLowerCase());
        });
      } else if (this.currentEndpoint === 'books') {
        // Filter era buku (Classic #1-4 vs Dark #5-7)
        if (this.currentTier2Filter === 'classic') {
          result = result.filter(item => (item.index + 1) <= 4);
        } else if (this.currentTier2Filter === 'dark') {
          result = result.filter(item => (item.index + 1) > 4);
        }
      } else if (this.currentEndpoint === 'spells') {
        // Filter mantra bertahan vs kutukan gelap
        if (this.currentTier2Filter === 'charms') {
          result = result.filter(item => {
            const use = (item.raw?.use || '').toLowerCase();
            return !use.includes('curse') && !use.includes('kill') && !use.includes('tortur');
          });
        } else if (this.currentTier2Filter === 'curses') {
          result = result.filter(item => {
            const use = (item.raw?.use || '').toLowerCase();
            return use.includes('curse') || use.includes('kill') || use.includes('tortur') || use.includes('dark');
          });
        }
      }
    }

    // 2. Eksekusi Pengurutan (Sorting)
    if (this.currentSort === 'az') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (this.currentSort === 'za') {
      result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (this.currentSort === 'metricDesc') {
      result.sort((a, b) => (b.raw?.pages || 0) - (a.raw?.pages || 0));
    } else {
      // Urutan index canon asli
      result.sort((a, b) => a.index - b.index);
    }

    this.displayedItems = result;
    this.renderCards();
    this.updatePaginationUI();
  }

  /**
   * Merender kartu-kartu item ke dalam grid 6 kolom responsif.
   */
  renderCards() {
    if (!this.gridEl) return;

    // Update jumlah item yang ditemukan
    if (this.countBadgeEl) {
      this.countBadgeEl.textContent = `${this.displayedItems.length} ${t(this.currentLang, 'itemCountSuffix')}`;
    }

    // Jika tidak ada data yang cocok dengan kriteria pencarian/filter
    if (this.displayedItems.length === 0) {
      this.gridEl.innerHTML = `
        <div class="col-span-full py-16 text-center space-y-3">
          <i class="fa-solid fa-hat-wizard text-3xl text-neutral-600"></i>
          <h4 class="font-display font-bold text-sm text-neutral-300">No magical archives found</h4>
          <p class="text-xs text-neutral-500 max-w-sm mx-auto">Try adjusting your search criteria, resetting the sub-filters, or choosing another category.</p>
        </div>
      `;
      return;
    }

    // Susun markup setiap kartu
    this.gridEl.innerHTML = this.displayedItems.map(item => {
      const favorited = this.currentProfile
        ? isFavorite(this.currentProfile, item.endpoint, item.id)
        : false;

      return `
        <div 
          data-catalog-item-id="${item.id}"
          class="group cursor-pointer flex flex-col space-y-2 select-none animate-card-reveal"
        >
          <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#18181c] border border-white/10 group-hover:border-brand-red/60 group-hover:shadow-[0_8px_24px_rgba(229,9,20,0.35)] transition-all duration-300">
            <img 
              src="${item.image}" 
              alt="${item.title}" 
              loading="lazy" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent"></div>

            <!-- Lencana Atas -->
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

            <!-- Informasi Bawah -->
            <div class="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-0.5">
              <div class="flex items-center gap-1.5 text-[10px] text-brand-gold font-bold">
                <i class="fa-solid fa-star text-[9px]"></i>
                <span>9.${(item.index % 6) + 4}</span>
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

    // Ikat event listener klik pada setiap kartu dan tombol bookmark
    $$('[data-catalog-item-id]', this.gridEl).forEach(card => {
      const itemId = card.dataset.catalogItemId;
      const targetItem = this.displayedItems.find(i => i.id === itemId);

      card.addEventListener('click', (e) => {
        // Jika yang diklik adalah tombol bookmark
        const favBtn = e.target.closest('[data-fav-action]');
        if (favBtn) {
          e.stopPropagation();
          this.toggleFavorite(targetItem);
          return;
        }

        // Jika badan kartu diklik: buka modal inspeksi (?index=)
        if (targetItem && this.onItemClick) {
          this.onItemClick(targetItem);
        }
      });
    });
  }

  /**
   * Menambah atau menghapus item dari favorit pengguna.
   * 
   * @param {object} item - Item target
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

    this.renderCards();
    if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
  }

  /**
   * Memperbarui profil pengguna secara reaktif dan memicu render ulang bookmark kartu.
   * 
   * @param {object} profile - Objek profil pengguna
   * @param {string} [lang] - Kode bahasa jika ada perubahan
   */
  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.renderCards();
  }

  /**
   * Memperbarui status tombol navigasi pagination (disabled state tombol prev & next).
   */
  updatePaginationUI() {
    if (this.pageIndicatorText) {
      this.pageIndicatorText.textContent = `Page ${this.currentPage}`;
    }
    if (this.prevPageBtn) {
      this.prevPageBtn.disabled = this.currentPage <= 1;
    }
    if (this.nextPageBtn) {
      // Nonaktifkan tombol next jika limit = 0 (semua item) atau data yang kembali kurang dari limit
      this.nextPageBtn.disabled = this.currentMax === 0 || this.rawItems.length < this.currentMax;
    }
  }

  /**
   * Merender placeholder loading skeleton dengan efek shimmer saat data sedang dimuat.
   */
  renderSkeletons() {
    if (!this.gridEl) return;
    const skeletonCount = this.currentMax > 0 ? Math.min(this.currentMax, 12) : 12;

    this.gridEl.innerHTML = Array.from({ length: skeletonCount }).map(() => `
      <div class="space-y-2">
        <div class="aspect-[2/3] rounded-xl skeleton-shimmer border border-white/5"></div>
        <div class="h-3 w-3/4 rounded skeleton-shimmer"></div>
        <div class="h-2.5 w-1/2 rounded skeleton-shimmer"></div>
      </div>
    `).join('');
  }

  /**
   * Menampilkan banner error saat koneksi jaringan ke PotterAPI terputus.
   * 
   * @param {string} message - Pesan error
   */
  showError(message) {
    if (this.errorBannerEl) {
      this.errorBannerEl.classList.remove('hidden');
    }
    if (this.errorMessageEl) {
      this.errorMessageEl.textContent = message || t(this.currentLang, 'apiErrorDesc');
    }
    if (this.gridEl) {
      this.gridEl.innerHTML = '';
    }
  }

  /**
   * Menyembunyikan banner error saat proses pengambilan data diulang (retry).
   */
  hideErrorBanner() {
    if (this.errorBannerEl) {
      this.errorBannerEl.classList.add('hidden');
    }
  }
}
