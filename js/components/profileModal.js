/**
 * PotterFlix — Wizard Profile & 4-Category Favorites Drawer Modal
 */

import { $, $$ } from '../utils/dom.js';
import { saveProfile, removeFavorite, clearAllFavorites } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class ProfileModalController {
  /**
   * @param {object} options
   * @param {Function} options.onProfileUpdate Callback when profile or favorites change
   * @param {Function} options.onItemClick Detailed view trigger when clicking a saved favorite
   */
  constructor({ onProfileUpdate, onItemClick }) {
    this.onProfileUpdate = onProfileUpdate;
    this.onItemClick = onItemClick;

    this.modalEl = $('#myListModal');
    this.closeBtn = $('#closeMyListModalBtn');
    this.profileForm = $('#wizardProfileForm');
    this.nameInput = $('#wizardNameInput');
    this.favTabs = $$('.fav-cat-btn');
    this.favItemsContainer = $('#favItemsContainer');
    this.clearFavsBtn = $('#clearFavoritesBtn');

    // Counts
    this.favCountBooks = $('#favCountBooks');
    this.favCountCharacters = $('#favCountCharacters');
    this.favCountHouses = $('#favCountHouses');
    this.favCountSpells = $('#favCountSpells');

    this.currentProfile = null;
    this.currentCategory = 'books';
    this.currentLang = 'en';

    this.bindEvents();
  }

  bindEvents() {
    this.closeBtn?.addEventListener('click', () => this.close());

    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.close();
      }
    });

    // Profile Name Submission
    this.profileForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.currentProfile || !this.nameInput) return;

      const newName = this.nameInput.value.trim() || 'Harry Potter';
      this.currentProfile.wizardName = newName;
      saveProfile(this.currentProfile);
      showToast(t(this.currentLang, 'nameSavedToast'), 'success');

      if (this.onProfileUpdate) {
        this.onProfileUpdate(this.currentProfile);
      }
    });

    // Category Tabs
    this.favTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.favCat;
        if (cat === this.currentCategory) return;
        this.setCategory(cat);
      });
    });

    // Clear All Favorites
    this.clearFavsBtn?.addEventListener('click', () => {
      if (!this.currentProfile) return;
      clearAllFavorites(this.currentProfile);
      showToast(t(this.currentLang, 'favoritesClearedToast'), 'info');
      this.updateCounts();
      this.renderCategoryItems();

      if (this.onProfileUpdate) {
        this.onProfileUpdate(this.currentProfile);
      }
    });
  }

  open(profile, lang = 'en') {
    this.currentProfile = profile;
    this.currentLang = lang;

    if (this.nameInput) {
      this.nameInput.value = profile.wizardName || 'Harry Potter';
    }

    this.updateCounts();
    this.setCategory(this.currentCategory);
    this.modalEl?.classList.remove('hidden');
  }

  close() {
    this.modalEl?.classList.add('hidden');
  }

  setCategory(category) {
    this.currentCategory = category;

    this.favTabs.forEach(tab => {
      const match = tab.dataset.favCat === category;
      tab.classList.toggle('bg-brand-red', match);
      tab.classList.toggle('text-white', match);
      tab.classList.toggle('bg-[#202024]', !match);
      tab.classList.toggle('text-neutral-300', !match);
    });

    this.renderCategoryItems();
  }

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

  renderCategoryItems() {
    if (!this.favItemsContainer || !this.currentProfile) return;

    const items = this.currentProfile.favorites[this.currentCategory] || [];

    if (items.length === 0) {
      this.favItemsContainer.innerHTML = `
        <div class="col-span-full py-10 text-center space-y-2">
          <i class="fa-solid fa-bookmark text-2xl text-neutral-600"></i>
          <p class="text-xs text-neutral-400">${t(this.currentLang, 'emptyCategoryMsg')}</p>
        </div>
      `;
      return;
    }

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
        <button 
          type="button" 
          data-remove-fav-id="${item.id}" 
          title="Remove from favorites"
          class="w-8 h-8 rounded-full bg-white/5 hover:bg-brand-red text-neutral-400 hover:text-white flex items-center justify-center text-xs transition shrink-0"
        >
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    // Bind item click for inspection and remove button
    $$('[data-fav-item-id]', this.favItemsContainer).forEach(row => {
      const itemId = row.dataset.favItemId;
      const targetItem = items.find(i => i.id === itemId);

      row.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-fav-id]');
        if (removeBtn) {
          e.stopPropagation();
          this.removeItem(itemId);
          return;
        }

        if (targetItem && this.onItemClick) {
          this.close();
          this.onItemClick(targetItem);
        }
      });
    });
  }

  removeItem(itemId) {
    if (!this.currentProfile) return;

    removeFavorite(this.currentProfile, this.currentCategory, itemId);
    showToast(t(this.currentLang, 'itemRemovedToast'), 'info');
    this.updateCounts();
    this.renderCategoryItems();

    if (this.onProfileUpdate) {
      this.onProfileUpdate(this.currentProfile);
    }
  }

  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.updateCounts();
    this.renderCategoryItems();
  }
}
