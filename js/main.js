/**
 * ============================================================================
 * File: js/main.js
 * Deskripsi: Berkas Entry Point & Lifecycle Orchestrator Utama PotterFlix.
 *            Bertanggung jawab menghubungkan seluruh komponen modular ES6,
 *            mengelola status global aplikasi, memuat data awal secara paralel,
 *            serta menangani pergantian 7 bahasa adaptif secara realtime.
 * ============================================================================
 */

import { $, $$ } from './utils/dom.js';
import { t, SUPPORTED_LANGUAGES } from './config/i18n.js';
import { fetchPotterResource } from './services/potterApi.js';
import { loadProfile, saveProfile } from './services/storageService.js';
import { normalizeItem } from './utils/formatters.js';
import { showToast } from './components/toast.js';

// Import Komponen-Komponen Modular
import { NavbarController } from './components/navbar.js';
import { HeroController } from './components/hero.js';
import { TrendsCarouselController } from './components/trendsCarousel.js';
import { CatalogController } from './components/catalog.js';
import { SpellSandboxController } from './components/spellSandbox.js';
import { DetailModalController } from './components/detailModal.js';
import { ProfileModalController } from './components/profileModal.js';

/**
 * Kelas Utama Aplikasi PotterFlix.
 * Mengkoordinasikan alur data dan interaksi antarmuka pengguna.
 */
class PotterFlixApp {
  /**
   * Konstruktor inisialisasi aplikasi.
   * Menyiapkan state awal, memuat profil tersimpan, dan memulai lifecycle.
   */
  constructor() {
    // 1. Muat profil pengguna (nama wizard & koleksi 4 kategori favorit) dari LocalStorage
    this.profile = loadProfile();

    // 2. Tentukan bahasa aktif awal (mengikuti preferensi profil atau fallback ke 'en')
    this.currentLang = this.profile.lang || 'en';

    // 3. Cache lokal untuk menyimpan data awal seluruh resource PotterAPI
    this.cachedAllData = {
      books: [],
      characters: [],
      houses: [],
      spells: []
    };

    // 4. Inisialisasi seluruh modul komponen antarmuka
    this.initComponents();

    // 5. Inisialisasi event listener global (newsletter, bendera bahasa footer)
    this.initGlobalEvents();

    // 6. Terapkan bahasa antarmuka awal
    this.applyLanguage(this.currentLang, false);

    // 7. Ambil data awal dari PotterAPI secara paralel
    this.bootstrapData();
  }

  /**
   * Menginisialisasi dan menghubungkan instance setiap komponen UI modular.
   */
  initComponents() {
    // A. Inisialisasi Modal Dialog Detail Inspeksi (?index=)
    this.detailModal = new DetailModalController({
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // B. Inisialisasi Modal Dialog Profil Wizard & Drawer Koleksi Favorit
    this.profileModal = new ProfileModalController({
      onProfileUpdate: (updatedProfile) => this.syncProfileChanges(updatedProfile),
      onItemClick: (item) => this.detailModal.open(item, this.profile, this.currentLang)
    });

    // C. Inisialisasi Navbar Glassmorphic
    this.navbar = new NavbarController({
      onNavigate: (target) => this.handleNavigation(target),
      onLanguageChange: (newLang) => this.applyLanguage(newLang, true),
      onSearch: (query) => this.handleGlobalSearch(query),
      onOpenProfile: () => this.profileModal.open(this.profile, this.currentLang)
    });

    // D. Inisialisasi Hero Showcase Banner
    this.hero = new HeroController({
      onExplore: (item) => this.detailModal.open(item, this.profile, this.currentLang),
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // E. Inisialisasi Carousel "Trends Now"
    this.trends = new TrendsCarouselController({
      onSourceChange: (source) => this.handleTrendsSourceChange(source),
      onItemClick: (item) => this.detailModal.open(item, this.profile, this.currentLang),
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // F. Inisialisasi Katalog Utama Ensiklopedia Dunia Sihir
    this.catalog = new CatalogController({
      onRequestData: (params) => this.fetchCatalogData(params),
      onItemClick: (item) => this.detailModal.open(item, this.profile, this.currentLang),
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // G. Inisialisasi Sandbox Mantra Interaktif
    this.spellSandbox = new SpellSandboxController({
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // Sinkronisasikan nama wizard & badge counter favorit awal ke bilah navigasi
    this.navbar.updateProfileState(this.profile);
  }

  /**
   * Mengikat aksi listener global di luar komponen utama (newsletter dan switcher bendera footer).
   */
  initGlobalEvents() {
    // 1. Aksi Submit Form Langganan Newsletter "Daily Prophet Owl Post"
    const newsletterForm = $('#footerNewsletterForm');
    const emailInput = $('#footerEmailInput');

    newsletterForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput?.value.trim();

      // Validasi sederhana format email
      if (!email || !email.includes('@')) {
        showToast('Please enter a valid wizarding owl address.', 'error');
        return;
      }

      showToast(t(this.currentLang, 'newsletterSubscribedToast'), 'success');
      newsletterForm.reset();
    });

    // 2. Aksi Klik 7 Bendera Bahasa di Footer
    $$('[data-footer-lang]').forEach(flagBtn => {
      flagBtn.addEventListener('click', () => {
        const lang = flagBtn.dataset.footerLang;
        this.applyLanguage(lang, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /**
   * Sinkronisasi perubahan profil dan koleksi favorit ke seluruh komponen aplikasi secara realtime.
   * 
   * @param {object} updatedProfile - Objek profil pengguna terbaru
   */
  syncProfileChanges(updatedProfile) {
    this.profile = updatedProfile;

    // Simpan perubahan ke LocalStorage
    saveProfile(this.profile);

    // Beritahukan pembaruan ke setiap komponen terkait
    this.navbar.updateProfileState(this.profile);
    this.hero.updateProfile(this.profile, this.currentLang);
    this.trends.updateProfile(this.profile, this.currentLang);
    this.catalog.updateProfile(this.profile, this.currentLang);
    this.spellSandbox.updateProfile(this.profile, this.currentLang);
    this.profileModal.updateProfile(this.profile, this.currentLang);
  }

  /**
   * Menangani perpindahan tab navigasi yang dipilih pengguna dari bilah navigasi atau tautan footer.
   * 
   * @param {string} target - Kunci navigasi ('home', 'books', 'characters', 'houses', 'spells', 'mylist')
   */
  handleNavigation(target) {
    // Navigasi ke Home: Gulir halus ke puncak halaman
    if (target === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Navigasi ke My List: Buka modal drawer favorit
    if (target === 'mylist') {
      this.profileModal.open(this.profile, this.currentLang);
      return;
    }

    // Navigasi ke Resource Endpoint: Gulir ke seksi katalog dan aktifkan endpoint terpilih
    const catalogSection = $('#catalogSection');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
      this.catalog.setEndpoint(target);
    }
  }

  /**
   * Menangani pencarian global dari input pill navbar dan mengarahkannya ke katalog.
   * 
   * @param {string} query - Kata kunci pencarian
   */
  handleGlobalSearch(query) {
    const catalogSection = $('#catalogSection');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Sinkronisasikan nilai pencarian ke input search seksi katalog
    const sectionSearchInput = $('#sectionSearchInput');
    if (sectionSearchInput) {
      sectionSearchInput.value = query;
    }

    this.catalog.currentSearch = query;
    this.catalog.currentPage = 1;
    this.catalog.triggerFetch();
  }

  /**
   * Menangani peralihan sumber data pada carousel "Trends Now" ('books' atau 'characters').
   * 
   * @param {'books'|'characters'} source - Sumber data terpilih
   */
  handleTrendsSourceChange(source) {
    const rawList = this.cachedAllData[source] || [];
    const normalized = rawList.map((item, idx) => normalizeItem(source, item, idx));
    this.trends.setItems(normalized, this.profile, this.currentLang);
  }

  /**
   * Menerapkan salah satu dari 7 bahasa adaptif ke seluruh antarmuka web.
   * Merubah atribut lang HTML, memperbarui seluruh elemen dengan data-i18n,
   * merubah placeholder pencarian, dan memicu fetch ulang data API jika diminta.
   * 
   * @param {string} langCode - Kode bahasa target (misal: 'en', 'es', 'fr', 'it', 'pt', 'uk', 'de')
   * @param {boolean} [shouldRefetch=false] - Apakah memicu pemanggilan ulang data API dalam bahasa baru
   */
  applyLanguage(langCode, shouldRefetch = false) {
    // Validasi apakah bahasa ada dalam daftar yang didukung
    const matched = SUPPORTED_LANGUAGES.some(l => l.code === langCode);
    this.currentLang = matched ? langCode : 'en';

    // Simpan preferensi bahasa ke profil pengguna
    this.profile.lang = this.currentLang;
    saveProfile(this.profile);

    // 1. Perbarui atribut lang pada dokumen HTML
    document.documentElement.lang = this.currentLang;

    // 2. Terjemahkan semua elemen HTML yang memiliki atribut data-i18n
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = t(this.currentLang, key);
      if (translated) {
        el.textContent = translated;
      }
    });

    // 3. Perbarui teks placeholder input pencarian
    const navSearchInput = $('#navSearchInput');
    if (navSearchInput) navSearchInput.placeholder = t(this.currentLang, 'searchPlaceholder');

    const sectionSearchInput = $('#sectionSearchInput');
    if (sectionSearchInput) sectionSearchInput.placeholder = t(this.currentLang, 'filterSearchPlaceholder');

    // 4. Perbarui tampilan kode bahasa di navbar
    this.navbar.updateLanguage(this.currentLang);

    // 5. Muat ulang data API jika bahasa diubah oleh user saat aplikasi berjalan
    if (shouldRefetch) {
      this.bootstrapData();
    }
  }

  /**
   * Mengambil data awal dari ke-4 endpoint PotterAPI secara paralel (Promise.all)
   * untuk menginisialisasi Hero Showcase, Trends Carousel, Spell Sandbox, dan Catalog.
   */
  async bootstrapData() {
    try {
      this.catalog.renderSkeletons();

      // Panggilan paralel 4 resource: buku, karakter, asrama, dan mantra sihir
      const [booksRes, charactersRes, housesRes, spellsRes] = await Promise.all([
        fetchPotterResource({ lang: this.currentLang, endpoint: 'books' }),
        fetchPotterResource({ lang: this.currentLang, endpoint: 'characters' }),
        fetchPotterResource({ lang: this.currentLang, endpoint: 'houses' }),
        fetchPotterResource({ lang: this.currentLang, endpoint: 'spells' })
      ]);

      // Simpan data mentah ke cache internal aplikasi
      this.cachedAllData.books = Array.isArray(booksRes.data) ? booksRes.data : [];
      this.cachedAllData.characters = Array.isArray(charactersRes.data) ? charactersRes.data : [];
      this.cachedAllData.houses = Array.isArray(housesRes.data) ? housesRes.data : [];
      this.cachedAllData.spells = Array.isArray(spellsRes.data) ? spellsRes.data : [];

      // 1. Inisialisasi Hero Showcase (menggunakan koleksi buku canon)
      const normalizedBooks = this.cachedAllData.books.map((b, i) => normalizeItem('books', b, i));
      this.hero.setItems(normalizedBooks, this.profile, this.currentLang);

      // 2. Inisialisasi Carousel Trends Now (default: Popular Books)
      this.trends.setItems(normalizedBooks, this.profile, this.currentLang);

      // 3. Inisialisasi Sandbox Mantra Arcane
      this.spellSandbox.setSpells(this.cachedAllData.spells, this.profile, this.currentLang);

      // 4. Inisialisasi Katalog Awal
      this.catalog.setItems(normalizedBooks, booksRes.endpointUrl, this.profile);

    } catch (err) {
      console.error('[PotterFlixApp] Kesalahan saat memuat data awal PotterAPI:', err);
      this.catalog.showError(err.message || t(this.currentLang, 'apiErrorDesc'));
    }
  }

  /**
   * Mengambil data spesifik katalog berdasarkan parameter filter, pencarian (?search=), dan pagination (?max= & ?page=).
   * 
   * @param {object} params - Parameter permintaan data katalog
   * @param {string} params.endpoint - 'books' | 'characters' | 'houses' | 'spells'
   * @param {string} params.search - Teks pencarian
   * @param {number} params.max - Limit per halaman
   * @param {number} params.page - Nomor halaman
   * @param {string} params.lang - Kode bahasa
   */
  async fetchCatalogData({ endpoint, search, max, page, lang }) {
    try {
      const res = await fetchPotterResource({
        endpoint,
        search,
        max,
        page,
        lang,
        abortPrevious: true // Batalkan request pencarian lama jika ada yang sedang berjalan
      });

      const items = Array.isArray(res.data) ? res.data : [res.data];
      const normalized = items.map((raw, idx) => 
        normalizeItem(endpoint, raw, raw.index !== undefined ? raw.index : idx)
      );

      this.catalog.setItems(normalized, res.endpointUrl, this.profile);
    } catch (err) {
      // Abaikan error pembatalan yang disengaja
      if (err.name === 'AbortError') return;

      console.error('[PotterFlixApp] Kesalahan saat mengambil data katalog:', err);
      this.catalog.showError(err.message || t(this.currentLang, 'apiErrorDesc'));
    }
  }
}

// Inisialisasi instansiasi aplikasi saat DOM telah selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  window.potterFlixApp = new PotterFlixApp();
});
