/**
 * PotterFlix — Application Bootstrap & Main Lifecycle Orchestrator
 * Connects all modular ES6 components, handles 7-language switching, and manages global state.
 */

import { $, $$ } from './utils/dom.js';
import { t, SUPPORTED_LANGUAGES } from './config/i18n.js';
import { fetchPotterResource } from './services/potterApi.js';
import { loadProfile, saveProfile } from './services/storageService.js';
import { normalizeItem } from './utils/formatters.js';
import { showToast } from './components/toast.js';

import { NavbarController } from './components/navbar.js';
import { HeroController } from './components/hero.js';
import { TrendsCarouselController } from './components/trendsCarousel.js';
import { CatalogController } from './components/catalog.js';
import { SpellSandboxController } from './components/spellSandbox.js';
import { DetailModalController } from './components/detailModal.js';
import { ProfileModalController } from './components/profileModal.js';

class PotterFlixApp {
  constructor() {
    this.profile = loadProfile();
    this.currentLang = this.profile.lang || 'en';
    this.cachedAllData = {
      books: [],
      characters: [],
      houses: [],
      spells: []
    };

    this.initComponents();
    this.initGlobalEvents();
    this.applyLanguage(this.currentLang, false);
    this.bootstrapData();
  }

  initComponents() {
    // 1. Toast & Modals
    this.detailModal = new DetailModalController({
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    this.profileModal = new ProfileModalController({
      onProfileUpdate: (updatedProfile) => this.syncProfileChanges(updatedProfile),
      onItemClick: (item) => this.detailModal.open(item, this.profile, this.currentLang)
    });

    // 2. Navbar
    this.navbar = new NavbarController({
      onNavigate: (target) => this.handleNavigation(target),
      onLanguageChange: (newLang) => this.applyLanguage(newLang, true),
      onSearch: (query) => this.handleGlobalSearch(query),
      onOpenProfile: () => this.profileModal.open(this.profile, this.currentLang)
    });

    // 3. Hero Showcase
    this.hero = new HeroController({
      onExplore: (item) => this.detailModal.open(item, this.profile, this.currentLang),
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // 4. Trends Carousel
    this.trends = new TrendsCarouselController({
      onSourceChange: (source) => this.handleTrendsSourceChange(source),
      onItemClick: (item) => this.detailModal.open(item, this.profile, this.currentLang),
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // 5. Catalog Explorer
    this.catalog = new CatalogController({
      onRequestData: (params) => this.fetchCatalogData(params),
      onItemClick: (item) => this.detailModal.open(item, this.profile, this.currentLang),
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // 6. Arcane Spell Sandbox
    this.spellSandbox = new SpellSandboxController({
      onFavoriteChange: (updatedProfile) => this.syncProfileChanges(updatedProfile)
    });

    // Sync initial profile state across components
    this.navbar.updateProfileState(this.profile);
  }

  initGlobalEvents() {
    // Footer Newsletter Form
    const newsletterForm = $('#footerNewsletterForm');
    const emailInput = $('#footerEmailInput');

    newsletterForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput?.value.trim();
      if (!email || !email.includes('@')) {
        showToast('Please enter a valid wizarding owl address.', 'error');
        return;
      }
      showToast(t(this.currentLang, 'newsletterSubscribedToast'), 'success');
      newsletterForm.reset();
    });

    // Footer 7-Language Flags
    $$('[data-footer-lang]').forEach(flagBtn => {
      flagBtn.addEventListener('click', () => {
        const lang = flagBtn.dataset.footerLang;
        this.applyLanguage(lang, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  syncProfileChanges(updatedProfile) {
    this.profile = updatedProfile;
    saveProfile(this.profile);

    this.navbar.updateProfileState(this.profile);
    this.hero.updateProfile(this.profile, this.currentLang);
    this.trends.updateProfile(this.profile, this.currentLang);
    this.catalog.updateProfile(this.profile, this.currentLang);
    this.spellSandbox.updateProfile(this.profile, this.currentLang);
    this.profileModal.updateProfile(this.profile, this.currentLang);
  }

  handleNavigation(target) {
    if (target === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (target === 'mylist') {
      this.profileModal.open(this.profile, this.currentLang);
      return;
    }
    // Resource endpoints: books, characters, houses, spells
    const catalogSection = $('#catalogSection');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
      this.catalog.setEndpoint(target);
    }
  }

  handleGlobalSearch(query) {
    const catalogSection = $('#catalogSection');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
    const sectionSearchInput = $('#sectionSearchInput');
    if (sectionSearchInput) {
      sectionSearchInput.value = query;
    }
    this.catalog.currentSearch = query;
    this.catalog.currentPage = 1;
    this.catalog.triggerFetch();
  }

  handleTrendsSourceChange(source) {
    const rawList = this.cachedAllData[source] || [];
    const normalized = rawList.map((item, idx) => normalizeItem(source, item, idx));
    this.trends.setItems(normalized, this.profile, this.currentLang);
  }

  applyLanguage(langCode, shouldRefetch = false) {
    const matched = SUPPORTED_LANGUAGES.some(l => l.code === langCode);
    this.currentLang = matched ? langCode : 'en';
    this.profile.lang = this.currentLang;
    saveProfile(this.profile);

    // Update document lang attribute
    document.documentElement.lang = this.currentLang;

    // Update all elements containing data-i18n
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = t(this.currentLang, key);
      if (translated) {
        el.textContent = translated;
      }
    });

    // Update placeholders
    const navSearchInput = $('#navSearchInput');
    if (navSearchInput) navSearchInput.placeholder = t(this.currentLang, 'searchPlaceholder');

    const sectionSearchInput = $('#sectionSearchInput');
    if (sectionSearchInput) sectionSearchInput.placeholder = t(this.currentLang, 'filterSearchPlaceholder');

    // Update Navbar component
    this.navbar.updateLanguage(this.currentLang);

    if (shouldRefetch) {
      this.bootstrapData();
    }
  }

  async bootstrapData() {
    try {
      this.catalog.renderSkeletons();

      // Parallel fetch of all 4 resources
      const [booksRes, charactersRes, housesRes, spellsRes] = await Promise.all([
        fetchPotterResource({ lang: this.currentLang, endpoint: 'books' }),
        fetchPotterResource({ lang: this.currentLang, endpoint: 'characters' }),
        fetchPotterResource({ lang: this.currentLang, endpoint: 'houses' }),
        fetchPotterResource({ lang: this.currentLang, endpoint: 'spells' })
      ]);

      this.cachedAllData.books = Array.isArray(booksRes.data) ? booksRes.data : [];
      this.cachedAllData.characters = Array.isArray(charactersRes.data) ? charactersRes.data : [];
      this.cachedAllData.houses = Array.isArray(housesRes.data) ? housesRes.data : [];
      this.cachedAllData.spells = Array.isArray(spellsRes.data) ? spellsRes.data : [];

      // 1. Setup Hero Showcase (Books highlight)
      const normalizedBooks = this.cachedAllData.books.map((b, i) => normalizeItem('books', b, i));
      this.hero.setItems(normalizedBooks, this.profile, this.currentLang);

      // 2. Setup Trends Carousel (Books default)
      this.trends.setItems(normalizedBooks, this.profile, this.currentLang);

      // 3. Setup Arcane Spell Sandbox
      this.spellSandbox.setSpells(this.cachedAllData.spells, this.profile, this.currentLang);

      // 4. Setup Initial Catalog (Books)
      this.catalog.setItems(normalizedBooks, booksRes.endpointUrl, this.profile);

    } catch (err) {
      console.error('[PotterFlixApp] Bootstrap data loading error:', err);
      this.catalog.showError(err.message || t(this.currentLang, 'apiErrorDesc'));
    }
  }

  async fetchCatalogData({ endpoint, search, max, page, lang }) {
    try {
      const res = await fetchPotterResource({
        endpoint,
        search,
        max,
        page,
        lang,
        abortPrevious: true
      });

      const items = Array.isArray(res.data) ? res.data : [res.data];
      const normalized = items.map((raw, idx) => normalizeItem(endpoint, raw, raw.index !== undefined ? raw.index : idx));
      this.catalog.setItems(normalized, res.endpointUrl, this.profile);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[PotterFlixApp] Catalog fetch error:', err);
      this.catalog.showError(err.message || t(this.currentLang, 'apiErrorDesc'));
    }
  }
}

// Instantiate application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.potterFlixApp = new PotterFlixApp();
});
