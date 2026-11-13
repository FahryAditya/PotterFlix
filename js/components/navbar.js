/**
 * PotterFlix — Navbar Component
 * Controls sticky glassmorphism, active indicator, language popover, search expansion, and profile triggers.
 */

import { $, $$, debounce } from '../utils/dom.js';
import { SUPPORTED_LANGUAGES, t } from '../config/i18n.js';
import { getTotalFavoritesCount } from '../services/storageService.js';

export class NavbarController {
  /**
   * @param {object} options
   * @param {Function} options.onNavigate Tab navigation callback
   * @param {Function} options.onLanguageChange Language change callback
   * @param {Function} options.onSearch Search query callback
   * @param {Function} options.onOpenProfile Open profile modal callback
   */
  constructor({ onNavigate, onLanguageChange, onSearch, onOpenProfile }) {
    this.onNavigate = onNavigate;
    this.onLanguageChange = onLanguageChange;
    this.onSearch = onSearch;
    this.onOpenProfile = onOpenProfile;

    this.headerEl = $('#mainNavbar');
    this.navTrackEl = $('#primaryNavTrack');
    this.activeBarEl = $('#navActiveBar');
    this.hoverPillEl = $('#navHoverPill');
    this.langBtn = $('#langSwitcherBtn');
    this.langPopover = $('#langPopover');
    this.langListEl = $('#langOptionsList');
    this.currentLangCodeEl = $('#currentLangCode');
    this.searchBtn = $('#navSearchBtn');
    this.searchInput = $('#navSearchInput');
    this.searchClearBtn = $('#navSearchClear');
    this.profileBtn = $('#profileModalBtn');
    this.displayNameEl = $('#wizardDisplayName');
    this.avatarInitialEl = $('#wizardAvatarInitial');
    this.myListBadgeEl = $('#myListBadge');
    this.mobileMyListBadgeEl = $('#mobileMyListBadge');

    this.currentNav = 'home';
    this.init();
  }

  init() {
    this.bindScroll();
    this.bindNavItems();
    this.bindLanguageSwitcher();
    this.bindSearch();
    this.bindProfile();
    this.renderLanguageOptions();
  }

  bindScroll() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        this.headerEl?.classList.add('glass-nav-scrolled');
        this.headerEl?.classList.remove('glass-nav-top');
      } else {
        this.headerEl?.classList.remove('glass-nav-scrolled');
        this.headerEl?.classList.add('glass-nav-top');
      }
    }, { passive: true });
  }

  bindNavItems() {
    // Desktop Nav Items
    const desktopButtons = $$('.nav-item', this.navTrackEl);
    desktopButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        this.setActiveNav(target);
        if (this.onNavigate) this.onNavigate(target);
      });

      // Hover Pill Tracker
      btn.addEventListener('mouseenter', () => {
        if (!this.hoverPillEl) return;
        this.hoverPillEl.style.width = `${btn.offsetWidth}px`;
        this.hoverPillEl.style.transform = `translateX(${btn.offsetLeft}px)`;
        this.hoverPillEl.style.opacity = '1';
      });
    });

    this.navTrackEl?.addEventListener('mouseleave', () => {
      if (this.hoverPillEl) this.hoverPillEl.style.opacity = '0';
    });

    // Mobile Nav Items
    $$('.mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        this.setActiveNav(target);
        if (this.onNavigate) this.onNavigate(target);
      });
    });

    // Brand logo returns to home
    $('[data-nav="home"]')?.addEventListener('click', (e) => {
      this.setActiveNav('home');
      if (this.onNavigate) this.onNavigate('home');
    });

    // Initial position
    setTimeout(() => this.updateActiveBar(), 100);
    window.addEventListener('resize', debounce(() => this.updateActiveBar(), 100));
  }

  setActiveNav(navKey) {
    this.currentNav = navKey;

    // Desktop Buttons State
    $$('.nav-item', this.navTrackEl).forEach(btn => {
      const match = btn.dataset.nav === navKey;
      btn.classList.toggle('text-white', match);
      btn.classList.toggle('text-neutral-400', !match);
      if (match) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Mobile Buttons State
    $$('.mobile-nav-item').forEach(btn => {
      const match = btn.dataset.nav === navKey;
      btn.classList.toggle('bg-brand-red/20', match);
      btn.classList.toggle('border-brand-red/40', match);
      btn.classList.toggle('border', match);
      btn.classList.toggle('text-white', match);
      btn.classList.toggle('text-neutral-400', !match);
    });

    this.updateActiveBar();
  }

  updateActiveBar() {
    const activeBtn = this.navTrackEl?.querySelector(`.nav-item[data-nav="${this.currentNav}"]`);
    if (activeBtn && this.activeBarEl) {
      this.activeBarEl.style.width = `${activeBtn.offsetWidth - 16}px`;
      this.activeBarEl.style.transform = `translateX(${activeBtn.offsetLeft + 8}px)`;
      this.activeBarEl.style.opacity = '1';
    } else if (this.activeBarEl) {
      this.activeBarEl.style.opacity = '0';
    }
  }

  bindLanguageSwitcher() {
    this.langBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = this.langPopover.classList.contains('hidden');
      if (isHidden) {
        this.langPopover.classList.remove('hidden');
        requestAnimationFrame(() => {
          this.langPopover.classList.remove('opacity-0', 'translate-y-2');
        });
      } else {
        this.closeLanguagePopover();
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.langPopover?.contains(e.target) && !this.langBtn?.contains(e.target)) {
        this.closeLanguagePopover();
      }
    });
  }

  closeLanguagePopover() {
    if (!this.langPopover) return;
    this.langPopover.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      this.langPopover.classList.add('hidden');
    }, 180);
  }

  renderLanguageOptions() {
    if (!this.langListEl) return;
    this.langListEl.innerHTML = SUPPORTED_LANGUAGES.map(lang => `
      <button 
        type="button" 
        data-select-lang="${lang.code}" 
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white text-xs transition"
      >
        <span class="flex items-center gap-2">
          <span>${lang.flag}</span>
          <span class="font-medium">${lang.native}</span>
        </span>
        <span class="text-[10px] font-mono text-neutral-400 uppercase">${lang.code}</span>
      </button>
    `).join('');

    $$('[data-select-lang]', this.langListEl).forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.selectLang;
        this.closeLanguagePopover();
        if (this.onLanguageChange) this.onLanguageChange(code);
      });
    });
  }

  bindSearch() {
    const container = $('#searchPillContainer');

    const openSearch = () => {
      container?.classList.add('bg-[#1a1a1e]', 'border-white/20', 'px-2');
      container?.classList.remove('bg-white/0', 'border-transparent');
      this.searchInput?.classList.remove('w-0', 'opacity-0', 'pointer-events-none');
      this.searchInput?.classList.add('w-36', 'sm:w-48', 'opacity-100');
      this.searchInput?.focus();
    };

    const closeSearch = () => {
      if (!this.searchInput?.value) {
        container?.classList.remove('bg-[#1a1a1e]', 'border-white/20', 'px-2');
        container?.classList.add('bg-white/0', 'border-transparent');
        this.searchInput?.classList.add('w-0', 'opacity-0', 'pointer-events-none');
        this.searchInput?.classList.remove('w-36', 'sm:w-48', 'opacity-100');
        this.searchClearBtn?.classList.add('hidden');
      }
    };

    this.searchBtn?.addEventListener('click', () => {
      if (this.searchInput?.classList.contains('w-0')) {
        openSearch();
      } else if (this.searchInput?.value) {
        if (this.onSearch) this.onSearch(this.searchInput.value.trim());
      } else {
        closeSearch();
      }
    });

    this.searchInput?.addEventListener('input', debounce(() => {
      const val = this.searchInput.value.trim();
      this.searchClearBtn?.classList.toggle('hidden', val.length === 0);
      if (this.onSearch) this.onSearch(val);
    }, 300));

    this.searchClearBtn?.addEventListener('click', () => {
      if (this.searchInput) this.searchInput.value = '';
      this.searchClearBtn?.classList.add('hidden');
      if (this.onSearch) this.onSearch('');
      this.searchInput?.focus();
    });

    document.addEventListener('click', (e) => {
      if (!container?.contains(e.target)) {
        closeSearch();
      }
    });
  }

  bindProfile() {
    this.profileBtn?.addEventListener('click', () => {
      if (this.onOpenProfile) this.onOpenProfile();
    });
  }

  updateProfileState(profile) {
    if (this.displayNameEl) {
      this.displayNameEl.textContent = profile.wizardName || 'Wizard';
    }
    if (this.avatarInitialEl) {
      this.avatarInitialEl.textContent = (profile.wizardName || 'W')[0].toUpperCase();
    }
    const totalFavs = getTotalFavoritesCount(profile);
    if (this.myListBadgeEl) this.myListBadgeEl.textContent = String(totalFavs);
    if (this.mobileMyListBadgeEl) this.mobileMyListBadgeEl.textContent = String(totalFavs);
  }

  updateLanguage(langCode) {
    if (this.currentLangCodeEl) {
      this.currentLangCodeEl.textContent = langCode.toUpperCase();
    }
    this.updateActiveBar();
  }
}
