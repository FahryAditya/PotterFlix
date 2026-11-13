/**
 * ============================================================================
 * File: js/components/profileModal.js
 * Deskripsi: Komponen pengendali Dialog Modal Profil Wizard & Drawer Koleksi Favorit.
 *            Mengatur pengubahan nama wizard yang tersimpan persisten di LocalStorage,
 *            tab pemfilter 4 kategori (Books, Characters, Houses, Spells), penampilan
 *            daftar koleksi dengan badge count live, serta penghapusan item/Clear All.
 * ============================================================================
 */

import { $, $$ } from '../utils/dom.js';
import { saveProfile, removeFavorite, clearAllFavorites } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class ProfileModalController {
  /**
   * Konstruktor inisialisasi ProfileModalController.
   * 
   * @param {object} options - Konfigurasi callback event
   * @param {Function} options.onProfileUpdate - Callback saat nama penyihir disimpan atau favorit berubah
   * @param {Function} options.onItemClick - Callback saat item favorit diklik untuk membuka modal inspeksi
   */
  constructor({ onProfileUpdate, onItemClick }) {
    // 1. Simpan handler callback
    this.onProfileUpdate = onProfileUpdate;
    this.onItemClick = onItemClick;

    // 2. Referensi elemen DOM modal profil & favorit
    this.modalEl = $('#myListModal');
    this.closeBtn = $('#closeMyListModalBtn');
    this.profileForm = $('#wizardProfileForm');
    this.nameInput = $('#wizardNameInput');
    this.favTabs = $$('.fav-cat-btn');
    this.favItemsContainer = $('#favItemsContainer');
    this.clearFavsBtn = $('#clearFavoritesBtn');

    // 3. Referensi elemen badge counter untuk 4 kategori
    this.favCountBooks = $('#favCountBooks');
    this.favCountCharacters = $('#favCountCharacters');
    this.favCountHouses = $('#favCountHouses');
    this.favCountSpells = $('#favCountSpells');

    // 4. Status internal
    this.currentProfile = null;      // Objek profil pengguna aktif
    this.currentCategory = 'books';  // Kategori aktif: 'books', 'characters', 'houses', 'spells'
    this.currentLang = 'en';         // Bahasa aktif

    // 5. Pasang event listener
    this.bindEvents();
  }

  /**
   * Mengikat aksi penutupan modal, form submit nama wizard, klik tab kategori, dan tombol Clear All.
   */
  bindEvents() {
    // Aksi Klik Tombol Silang (X): Tutup modal
    this.closeBtn?.addEventListener('click', () => this.close());

    // Aksi Klik Backdrop: Tutup modal saat klik area gelap luar
    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Aksi Tombol Keyboard ESC: Tutup modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.close();
      }
    });

    // Aksi Submit Form Ganti Nama Wizard
    this.profileForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.currentProfile || !this.nameInput) return;

      const newName = this.nameInput.value.trim() || 'Harry Potter';
      this.currentProfile.wizardName = newName;

      // Simpan perubahan ke browser LocalStorage
      saveProfile(this.currentProfile);
      showToast(t(this.currentLang, 'nameSavedToast'), 'success');

      // Sinkronisasikan nama ke bilah navbar & avatar
      if (this.onProfileUpdate) {
        this.onProfileUpdate(this.currentProfile);
      }
    });

    // Aksi Klik Tab Kategori Favorit (Books / Characters / Houses / Spells)
    this.favTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.favCat;
        if (cat === this.currentCategory) return;
        this.setCategory(cat);
      });
    });

    // Aksi Klik Tombol "Clear All": Hapus seluruh favorit di ke-4 kategori
    this.clearFavsBtn?.addEventListener('click', () => {
      if (!this.currentProfile) return;
      clearAllFavorites(this.currentProfile);
      showToast(t(this.currentLang, 'favoritesClearedToast'), 'info');
      this.updateCounts();
      this.renderCategoryItems();

      // Sinkronisasi badge navbar
      if (this.onProfileUpdate) {
        this.onProfileUpdate(this.currentProfile);
      }
    });
  }

  /**
   * Membuka modal profil & drawer favorit dengan memuat profil pengguna terbaru.
   * 
   * @param {object} profile - Objek profil pengguna aktif
   * @param {string} [lang='en'] - Kode bahasa saat ini
   */
  open(profile, lang = 'en') {
    this.currentProfile = profile;
    this.currentLang = lang;

    // Isi input nama dengan nama wizard yang tersimpan di LocalStorage
    if (this.nameInput) {
      this.nameInput.value = profile.wizardName || 'Harry Potter';
    }

    // Perbarui angka counter dan buka kategori aktif
    this.updateCounts();
    this.setCategory(this.currentCategory);
    this.modalEl?.classList.remove('hidden');
  }

  /**
   * Menutup dialog modal profil.
   */
  close() {
    this.modalEl?.classList.add('hidden');
  }

  /**
   * Mengganti kategori favorit yang sedang dilihat dan merender ulang kartu itemnya.
   * 
   * @param {'books'|'characters'|'houses'|'spells'} category - Kategori yang dipilih
   */
  setCategory(category) {
    this.currentCategory = category;

    // Perbarui highlight tombol tab aktif
    this.favTabs.forEach(tab => {
      const match = tab.dataset.favCat === category;
      tab.classList.toggle('bg-brand-red', match);
      tab.classList.toggle('text-white', match);
      tab.classList.toggle('bg-[#202024]', !match);
      tab.classList.toggle('text-neutral-300', !match);
    });

    this.renderCategoryItems();
  }

  /**
   * Memperbarui badge angka counter untuk masing-masing ke-4 kategori favorit.
   */
  updateCounts() {
    if (!this.currentProfile?.favorites) return;

    if (this.favCountBooks) {
      this.favCountBooks.textContent = String(this.currentProfile.favorites.books?.length || 0);
    }
    if (this.favCountCharacters) {
      this.favCountCharacters.textContent = String(this.currentProfile.favorites.characters?.length || 0);
    }
    if (this.favCountHouses) {
      this.favCountHouses.textContent = String(this.currentProfile.favorites.houses?.length || 0);
    }
    if (this.favCountSpells) {
      this.favCountSpells.textContent = String(this.currentProfile.favorites.spells?.length || 0);
    }
  }

  /**
   * Merender daftar item tersimpan pada kategori yang sedang aktif.
   */
  renderCategoryItems() {
    if (!this.favItemsContainer || !this.currentProfile) return;

    const items = this.currentProfile.favorites[this.currentCategory] || [];

    // Jika kategori masih kosong
    if (items.length === 0) {
      this.favItemsContainer.innerHTML = `
        <div class="col-span-full py-10 text-center space-y-2">
          <i class="fa-solid fa-bookmark text-2xl text-neutral-600"></i>
          <p class="text-xs text-neutral-400">${t(this.currentLang, 'emptyCategoryMsg')}</p>
        </div>
      `;
      return;
    }

    // Susun baris kartu item tersimpan
    this.favItemsContainer.innerHTML = items.map(item => `
      <div 
        data-fav-item-id="${item.id}"
        class="flex items-center gap-3 p-2.5 rounded-xl bg-[#1a1a1e] border border-white/5 hover:border-white/15 transition group select-none"
      >
        <img 
          src="${item.image}" 
          alt="${item.title}" 
          class="w-12 h-16 object-cover rounded-lg shrink-0 cursor-pointer"
        />
        <div class="flex-1 min-w-0 cursor-pointer">
          <span class="text-[9px] font-bold text-brand-red uppercase tracking-wider">${item.badge || item.endpoint}</span>
          <h5 class="font-display font-bold text-xs text-white truncate group-hover:text-brand-red transition">${item.title}</h5>
          <p class="text-[11px] text-neutral-400 truncate">${item.subtitle || ''}</p>
        </div>
        <!-- Tombol Hapus Satuan dari Favorit -->
        <button 
          type="button" 
          data-remove-fav-id="${item.id}" 
          title="Remove from favorites"
          class="w-8 h-8 rounded-full bg-white/5 hover:bg-brand-red text-neutral-400 hover:text-white flex items-center justify-center text-xs transition shrink-0 active:scale-90"
        >
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    // Ikat event listener klik inspeksi dan klik hapus item
    $$('[data-fav-item-id]', this.favItemsContainer).forEach(row => {
      const itemId = row.dataset.favItemId;
      const targetItem = items.find(i => i.id === itemId);

      row.addEventListener('click', (e) => {
        // Jika yang diklik adalah tombol tong sampah: hapus item
        const removeBtn = e.target.closest('[data-remove-fav-id]');
        if (removeBtn) {
          e.stopPropagation();
          this.removeItem(itemId);
          return;
        }

        // Jika badan baris diklik: tutup modal favorit dan buka modal detail
        if (targetItem && this.onItemClick) {
          this.close();
          this.onItemClick(targetItem);
        }
      });
    });
  }

  /**
   * Menghapus 1 item dari kategori favorit saat ini.
   * 
   * @param {string} itemId - ID unik item yang akan dihapus
   */
  removeItem(itemId) {
    if (!this.currentProfile) return;

    removeFavorite(this.currentProfile, this.currentCategory, itemId);
    showToast(t(this.currentLang, 'itemRemovedToast'), 'info');
    this.updateCounts();
    this.renderCategoryItems();

    // Beri tahu orchestrator agar badge counter navbar terupdate
    if (this.onProfileUpdate) {
      this.onProfileUpdate(this.currentProfile);
    }
  }

  /**
   * Memperbarui profil pengguna secara reaktif.
   * 
   * @param {object} profile - Objek profil pengguna terbaru
   * @param {string} [lang] - Kode bahasa jika ada perubahan
   */
  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.updateCounts();
    this.renderCategoryItems();
  }
}
