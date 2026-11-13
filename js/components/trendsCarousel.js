/**
 * PotterFlix — Trends Now Carousel Component
 */

import { $, $$ } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class TrendsCarouselController {
  /**
   * @param {object} options
   * @param {Function} options.onSourceChange When user switches between books/characters
   * @param {Function} options.onItemClick Detailed view trigger
   * @param {Function} options.onFavoriteChange Favorite state change trigger
   */
  constructor({ onSourceChange, onItemClick, onFavoriteChange }) {
    this.onSourceChange = onSourceChange;
    this.onItemClick = onItemClick;
    this.onFavoriteChange = onFavoriteChange;

    this.trackEl = $('#trendsTrack');
    this.prevBtn = $('#trendsPrevBtn');
    this.nextBtn = $('#trendsNextBtn');
    this.sourceTabs = $$('.trend-tab');

    this.items = [];
    this.currentProfile = null;
    this.currentLang = 'en';
    this.currentSource = 'books';

    this.bindEvents();
  }

  bindEvents() {
    this.prevBtn?.addEventListener('click', () => {
      if (this.trackEl) {
        this.trackEl.scrollBy({ left: -360, behavior: 'smooth' });
      }
    });

    this.nextBtn?.addEventListener('click', () => {
      if (this.trackEl) {
        this.trackEl.scrollBy({ left: 360, behavior: 'smooth' });
      }
    });

    this.sourceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const source = tab.dataset.trendSource;
        if (source === this.currentSource) return;
        this.currentSource = source;

        this.sourceTabs.forEach(tBtn => {
          const isActive = tBtn.dataset.trendSource === source;
          tBtn.classList.toggle('text-white', isActive);
          tBtn.classList.toggle('text-neutral-400', !isActive);
        });

        if (this.onSourceChange) {
          this.onSourceChange(source);
        }
      });
    });
  }

  setItems(items, profile, lang = 'en') {
    this.items = items || [];
    this.currentProfile = profile;
    this.currentLang = lang;
    this.render();
  }

  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.render();
  }

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

            <!-- Top Badge -->
            <div class="absolute top-2 left-2 z-10">
              <span class="px-2 py-0.5 rounded text-[9px] font-display font-extrabold bg-brand-red text-white uppercase tracking-wider shadow">
                ${item.badge}
              </span>
            </div>

            <!-- Bookmark Button -->
            <button 
              type="button" 
              data-fav-action="${item.id}"
              title="Bookmark"
              class="absolute top-2 right-2 z-10 w-7 h-7 rounded-full ${favorited ? 'bg-brand-red text-white' : 'bg-black/60 text-white/70 hover:text-white'} flex items-center justify-center text-xs transition"
            >
              <i class="${favorited ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>

            <!-- Bottom Info -->
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

    // Bind item click and bookmark toggle
    $$('[data-trend-item-id]', this.trackEl).forEach(card => {
      const itemId = card.dataset.trendItemId;
      const targetItem = this.items.find(i => i.id === itemId);

      card.addEventListener('click', (e) => {
        const favBtn = e.target.closest('[data-fav-action]');
        if (favBtn) {
          e.stopPropagation();
          this.toggleFavorite(targetItem);
          return;
        }

        if (targetItem && this.onItemClick) {
          this.onItemClick(targetItem);
        }
      });
    });
  }

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
