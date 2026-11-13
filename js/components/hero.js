/**
 * PotterFlix — Hero Showcase Banner Component
 */

import { $, $$ } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class HeroController {
  /**
   * @param {object} options
   * @param {Function} options.onExplore Trigger detailed modal inspection
   * @param {Function} options.onFavoriteChange Trigger favorite state update
   */
  constructor({ onExplore, onFavoriteChange }) {
    this.onExplore = onExplore;
    this.onFavoriteChange = onFavoriteChange;

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

    this.items = [];
    this.currentIndex = 0;
    this.currentProfile = null;
    this.currentLang = 'en';

    this.bindEvents();
  }

  bindEvents() {
    this.exploreBtn?.addEventListener('click', () => {
      const currentItem = this.items[this.currentIndex];
      if (currentItem && this.onExplore) {
        this.onExplore(currentItem);
      }
    });

    this.addListBtn?.addEventListener('click', () => {
      const currentItem = this.items[this.currentIndex];
      if (!currentItem || !this.currentProfile) return;

      const favorited = isFavorite(this.currentProfile, currentItem.endpoint, currentItem.id);
      if (favorited) {
        removeFavorite(this.currentProfile, currentItem.endpoint, currentItem.id);
        showToast(`"${currentItem.title}" ${t(this.currentLang, 'itemRemovedToast')}`, 'info');
      } else {
        addFavorite(this.currentProfile, currentItem.endpoint, currentItem);
        showToast(`"${currentItem.title}" ${t(this.currentLang, 'itemAddedToast')}`, 'success');
      }

      this.updateAddListButton();
      if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
    });
  }

  setItems(items, profile, lang = 'en') {
    this.items = items || [];
    this.currentProfile = profile;
    this.currentLang = lang;
    this.currentIndex = 0;

    if (this.items.length === 0) return;
    this.renderDots();
    this.renderCurrent();
  }

  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.updateAddListButton();
  }

  renderCurrent() {
    const item = this.items[this.currentIndex];
    if (!item) return;

    if (this.backdropImg) {
      this.backdropImg.src = item.image;
      this.backdropImg.alt = item.title;
    }
    if (this.badgeTag) this.badgeTag.textContent = item.badge || 'FEATURED';
    if (this.metaPrimary) this.metaPrimary.textContent = item.subtitle || 'Wizarding Canon';
    if (this.ratingScore) this.ratingScore.textContent = '9.8';
    if (this.titleEl) this.titleEl.textContent = item.title;
    if (this.descEl) {
      this.descEl.textContent = item.description ||
        `Enter the enchanting universe of ${item.title}. Explore official archives, magical spells, and lore powered by PotterAPI.`;
    }

    this.updateAddListButton();
    this.updateDots();
  }

  updateAddListButton() {
    const currentItem = this.items[this.currentIndex];
    if (!currentItem || !this.currentProfile) return;

    const favorited = isFavorite(this.currentProfile, currentItem.endpoint, currentItem.id);
    if (favorited) {
      this.addListIcon?.classList.replace('fa-plus', 'fa-check');
      if (this.addListLabel) this.addListLabel.textContent = t(this.currentLang, 'viewInList');
      this.addListBtn?.classList.add('bg-brand-red/30', 'border-brand-red');
    } else {
      this.addListIcon?.classList.replace('fa-check', 'fa-plus');
      if (this.addListLabel) this.addListLabel.textContent = t(this.currentLang, 'heroAddListCta');
      this.addListBtn?.classList.remove('bg-brand-red/30', 'border-brand-red');
    }
  }

  renderDots() {
    if (!this.dotsContainer) return;
    const maxDots = Math.min(this.items.length, 6);
    this.dotsContainer.innerHTML = Array.from({ length: maxDots }).map((_, i) => `
      <button 
        type="button" 
        data-hero-dot="${i}" 
        aria-label="Slide ${i + 1}"
        class="h-1.5 rounded-full transition-all duration-300 ${i === this.currentIndex ? 'w-8 bg-brand-red' : 'w-2 bg-white/40 hover:bg-white/80'}"
      ></button>
    `).join('');

    $$('[data-hero-dot]', this.dotsContainer).forEach(dotBtn => {
      dotBtn.addEventListener('click', () => {
        const targetIndex = Number(dotBtn.dataset.heroDot);
        this.currentIndex = targetIndex;
        this.renderCurrent();
      });
    });
  }

  updateDots() {
    if (!this.dotsContainer) return;
    $$('[data-hero-dot]', this.dotsContainer).forEach((dotBtn, i) => {
      const isActive = i === this.currentIndex;
      dotBtn.className = `h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-brand-red' : 'w-2 bg-white/40 hover:bg-white/80'}`;
    });
  }
}
