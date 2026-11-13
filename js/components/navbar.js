/**
 * ============================================================================
 * File: js/components/navbar.js
 * Deskripsi: Komponen pengendali bilah navigasi utama (Navbar).
 *            Mengatur efek scroll-morphing glassmorphism, garis penunjuk aktif,
 *            popover pemilih 7 bahasa, search bar yang dapat memanjang (expandable),
 *            serta sinkronisasi status profil wizard dan live badge counter "My List".
 * ============================================================================
 */

import { $, $$, debounce } from '../utils/dom.js';
import { SUPPORTED_LANGUAGES } from '../config/i18n.js';
import { getTotalFavoritesCount } from '../services/storageService.js';

export class NavbarController {
  /**
   * Konstruktor inisialisasi NavbarController.
   * 
   * @param {object} options - Konfigurasi callback event
   * @param {Function} options.onNavigate - Callback saat user berpindah menu (Home, Books, Characters, dll.)
   * @param {Function} options.onLanguageChange - Callback saat user memilih salah satu dari 7 bahasa
   * @param {Function} options.onSearch - Callback saat user mengetik kata kunci pencarian di navbar
   * @param {Function} options.onOpenProfile - Callback saat user mengklik avatar/nama profil wizard
   */
  constructor({ onNavigate, onLanguageChange, onSearch, onOpenProfile }) {
    // 1. Simpan handler callback
    this.onNavigate = onNavigate;
    this.onLanguageChange = onLanguageChange;
    this.onSearch = onSearch;
    this.onOpenProfile = onOpenProfile;

    // 2. Referensi elemen-elemen DOM navbar
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

    // 3. Status aktif saat ini
    this.currentNav = 'home';

    // 4. Inisialisasi seluruh event listener
    this.init();
  }

  /**
   * Mengikat seluruh listener aksi navbar: scroll window, item navigasi, bahasa, pencarian, dan profil.
   */
  init() {
    this.bindScroll();
    this.bindNavItems();
    this.bindLanguageSwitcher();
    this.bindSearch();
    this.bindProfile();
    this.renderLanguageOptions();
  }

  /**
   * Aksi scroll window: mengubah latar belakang navbar dari transparan menjadi
   * latar belakang gelap berkaca tebal (glass-nav-scrolled) saat halaman di-scroll ke bawah.
   */
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

  /**
   * Aksi klik & hover pada tombol menu navigasi (desktop maupun mobile).
   * Mengatur perpindahan tab, animasi garis aktif, dan hover pill indicator.
   */
  bindNavItems() {
    // Tombol Navigasi Desktop
    const desktopButtons = $$('.nav-item', this.navTrackEl);
    desktopButtons.forEach(btn => {
      // Aksi Klik: Pindah tab navigasi
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        this.setActiveNav(target);
        if (this.onNavigate) this.onNavigate(target);
      });

      // Aksi Mouse Enter: Geser hover pill indicator ke posisi tombol
      btn.addEventListener('mouseenter', () => {
        if (!this.hoverPillEl) return;
        this.hoverPillEl.style.width = `${btn.offsetWidth}px`;
        this.hoverPillEl.style.transform = `translateX(${btn.offsetLeft}px)`;
        this.hoverPillEl.style.opacity = '1';
      });
    });

    // Aksi Mouse Leave: Sembunyikan hover pill indicator saat mouse keluar dari track
    this.navTrackEl?.addEventListener('mouseleave', () => {
      if (this.hoverPillEl) this.hoverPillEl.style.opacity = '0';
    });

    // Tombol Navigasi Mobile
    $$('.mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        this.setActiveNav(target);
        if (this.onNavigate) this.onNavigate(target);
      });
    });

    // Klik Logo Brand: Kembali ke Home
    $('[data-nav="home"]')?.addEventListener('click', () => {
      this.setActiveNav('home');
      if (this.onNavigate) this.onNavigate('home');
    });

    // Hitung posisi garis merah aktif pertama kali dan saat resize window
    setTimeout(() => this.updateActiveBar(), 100);
    window.addEventListener('resize', debounce(() => this.updateActiveBar(), 100));
  }

  /**
   * Menandai tab yang sedang aktif dan memperbarui kelas styling aktif (merah/putih).
   * 
   * @param {string} navKey - Kunci navigasi ('home', 'books', 'characters', 'houses', 'spells', 'mylist')
   */
  setActiveNav(navKey) {
    this.currentNav = navKey;

    // Perbarui Tampilan Tombol Desktop
    $$('.nav-item', this.navTrackEl).forEach(btn => {
      const match = btn.dataset.nav === navKey;
      btn.classList.toggle('text-white', match);
      btn.classList.toggle('text-neutral-400', !match);
      if (match) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Perbarui Tampilan Tombol Mobile
    $$('.mobile-nav-item').forEach(btn => {
      const match = btn.dataset.nav === navKey;
      btn.classList.toggle('bg-brand-red/20', match);
      btn.classList.toggle('border-brand-red/40', match);
      btn.classList.toggle('border', match);
      btn.classList.toggle('text-white', match);
      btn.classList.toggle('text-neutral-400', !match);
    });

    // Geser garis merah aktif ke tombol yang baru dipilih
    this.updateActiveBar();
  }

  /**
   * Menghitung lebar dan posisi koordinat X untuk menggeser garis merah aktif (#navActiveBar).
   */
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

  /**
   * Mengatur interaksi popover dropdown 7 bahasa.
   * Menangani aksi buka/tutup dan penutupan otomatis saat klik di luar popover.
   */
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

    // Klik di luar popover untuk menutup otomatis
    document.addEventListener('click', (e) => {
      if (!this.langPopover?.contains(e.target) && !this.langBtn?.contains(e.target)) {
        this.closeLanguagePopover();
      }
    });
  }

  /**
   * Menutup popover pemilih bahasa dengan animasi memudar (fade out).
   */
  closeLanguagePopover() {
    if (!this.langPopover) return;
    this.langPopover.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      this.langPopover.classList.add('hidden');
    }, 180);
  }

  /**
   * Merender daftar 7 tombol pilihan bahasa di dalam popover (EN, ES, FR, IT, PT, UK, DE).
   */
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

    // Pasang aksi klik untuk setiap pilihan bahasa
    $$('[data-select-lang]', this.langListEl).forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.selectLang;
        this.closeLanguagePopover();
        if (this.onLanguageChange) this.onLanguageChange(code);
      });
    });
  }

  /**
   * Mengatur interaktivitas bilah pencarian pill expandable di navbar.
   * Saat diklik, input akan memanjang secara halus dan mendukung debounce input.
   */
  bindSearch() {
    const container = $('#searchPillContainer');

    // Aksi membuka kotak input pencarian
    const openSearch = () => {
      container?.classList.add('bg-[#1a1a1e]', 'border-white/20', 'px-2');
      container?.classList.remove('bg-white/0', 'border-transparent');
      this.searchInput?.classList.remove('w-0', 'opacity-0', 'pointer-events-none');
      this.searchInput?.classList.add('w-36', 'sm:w-48', 'opacity-100');
      this.searchInput?.focus();
    };

    // Aksi menutup kotak input jika kosong
    const closeSearch = () => {
      if (!this.searchInput?.value) {
        container?.classList.remove('bg-[#1a1a1e]', 'border-white/20', 'px-2');
        container?.classList.add('bg-white/0', 'border-transparent');
        this.searchInput?.classList.add('w-0', 'opacity-0', 'pointer-events-none');
        this.searchInput?.classList.remove('w-36', 'sm:w-48', 'opacity-100');
        this.searchClearBtn?.classList.add('hidden');
      }
    };

    // Klik tombol ikon kaca pembesar
    this.searchBtn?.addEventListener('click', () => {
      if (this.searchInput?.classList.contains('w-0')) {
        openSearch();
      } else if (this.searchInput?.value) {
        if (this.onSearch) this.onSearch(this.searchInput.value.trim());
      } else {
        closeSearch();
      }
    });

    // Mengetik dengan penundaan (debounce 300ms)
    this.searchInput?.addEventListener('input', debounce(() => {
      const val = this.searchInput.value.trim();
      this.searchClearBtn?.classList.toggle('hidden', val.length === 0);
      if (this.onSearch) this.onSearch(val);
    }, 300));

    // Tombol hapus pencarian (tanda silang X)
    this.searchClearBtn?.addEventListener('click', () => {
      if (this.searchInput) this.searchInput.value = '';
      this.searchClearBtn?.classList.add('hidden');
      if (this.onSearch) this.onSearch('');
      this.searchInput?.focus();
    });

    // Tutup search jika user mengklik area luar
    document.addEventListener('click', (e) => {
      if (!container?.contains(e.target)) {
        closeSearch();
      }
    });
  }

  /**
   * Mengikat aksi tombol profil wizard untuk membuka modal profil & koleksi favorit.
   */
  bindProfile() {
    this.profileBtn?.addEventListener('click', () => {
      if (this.onOpenProfile) this.onOpenProfile();
    });
  }

  /**
   * Memperbarui informasi nama penyihir, inisial avatar, dan angka badge counter "My List".
   * 
   * @param {object} profile - Objek profil pengguna aktif dari LocalStorage
   */
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

  /**
   * Memperbarui teks kode bahasa yang sedang aktif di tombol navbar (misal: 'EN', 'ES', 'FR').
   * 
   * @param {string} langCode - Kode bahasa baru
   */
  updateLanguage(langCode) {
    if (this.currentLangCodeEl) {
      this.currentLangCodeEl.textContent = langCode.toUpperCase();
    }
    this.updateActiveBar();
  }
}
