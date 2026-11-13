/**
 * PotterFlix — Detail Inspector Modal Component
 * Displays rich single-item details fetched via the official PotterAPI ?index= parameter.
 */

import { $ } from '../utils/dom.js';
import { fetchPotterResource } from '../services/potterApi.js';
import { normalizeItem, getHouseTheme } from '../utils/formatters.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';

export class DetailModalController {
  /**
   * @param {object} options
   * @param {Function} options.onFavoriteChange Trigger favorite state update
   */
  constructor({ onFavoriteChange }) {
    this.onFavoriteChange = onFavoriteChange;

    this.modalEl = $('#detailModal');
    this.modalBodyEl = $('#detailModalBody');
    this.closeBtn = $('#closeDetailModalBtn');

    this.currentItem = null;
    this.currentProfile = null;
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
  }

  /**
   * Open modal and fetch full details using PotterAPI ?index= parameter
   * @param {object} item Basic normalized item
   * @param {object} profile Current user profile
   * @param {string} lang Current active language
   */
  async open(item, profile, lang = 'en') {
    this.currentItem = item;
    this.currentProfile = profile;
    this.currentLang = lang;

    if (!this.modalEl || !this.modalBodyEl) return;

    this.modalEl.classList.remove('hidden');
    this.modalBodyEl.innerHTML = `
      <div class="py-16 text-center space-y-3">
        <i class="fa-solid fa-wand-sparkles text-2xl text-brand-red animate-spin"></i>
        <p class="text-xs text-neutral-400">Summoning detailed archives via PotterAPI (?index=${item.index})...</p>
      </div>
    `;

    try {
      // Query single item using ?index= endpoint param
      const result = await fetchPotterResource({
        lang: this.currentLang,
        endpoint: item.endpoint,
        index: item.index
      });

      const detailedData = Array.isArray(result.data) ? result.data[0] : result.data;
      const normalized = normalizeItem(item.endpoint, detailedData || item.raw, item.index);
      this.currentItem = normalized;
      this.renderContent(normalized, detailedData || item.raw);
    } catch (err) {
      console.warn('[DetailModal] Could not fetch single item index, falling back to cached item:', err);
      this.renderContent(item, item.raw);
    }
  }

  close() {
    this.modalEl?.classList.add('hidden');
  }

  renderContent(item, raw) {
    if (!this.modalBodyEl) return;

    const favorited = this.currentProfile
      ? isFavorite(this.currentProfile, item.endpoint, item.id)
      : false;

    let extraDetailsHTML = '';

    if (item.endpoint === 'books') {
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Book Number:</span> <span class="font-bold text-white">#${raw.number || (item.index + 1)}</span></div>
          <div><span class="text-neutral-400">Pages:</span> <span class="font-bold text-white">${raw.pages || 'N/A'}</span></div>
          <div class="col-span-2"><span class="text-neutral-400">Release Date:</span> <span class="font-bold text-white">${raw.releaseDate || 'N/A'}</span></div>
        </div>
        <div class="space-y-1">
          <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Book Synopsis</h5>
          <p class="text-xs text-neutral-300 leading-relaxed">${raw.description || raw.summary || 'Official Hogwarts canon book.'}</p>
        </div>
      `;
    } else if (item.endpoint === 'characters') {
      const theme = getHouseTheme(raw.hogwartsHouse);
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Hogwarts House:</span> <span class="font-bold text-white">${raw.hogwartsHouse || 'None'}</span></div>
          <div><span class="text-neutral-400">Interpreted By:</span> <span class="font-bold text-white">${raw.interpretedBy || 'N/A'}</span></div>
          <div><span class="text-neutral-400">Birthdate:</span> <span class="font-bold text-white">${raw.birthdate || 'N/A'}</span></div>
          <div><span class="text-neutral-400">Index:</span> <span class="font-bold text-brand-gold font-mono">#${item.index}</span></div>
        </div>
        ${raw.children && raw.children.length ? `
          <div class="space-y-1">
            <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Children</h5>
            <p class="text-xs text-neutral-300">${Array.isArray(raw.children) ? raw.children.join(', ') : raw.children}</p>
          </div>
        ` : ''}
      `;
    } else if (item.endpoint === 'houses') {
      const colors = Array.isArray(raw.colors) ? raw.colors.join(', ') : (raw.colors || 'N/A');
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Founder:</span> <span class="font-bold text-white">${raw.founder || 'Hogwarts'}</span></div>
          <div><span class="text-neutral-400">House Animal:</span> <span class="font-bold text-white">${raw.animal || 'Magical Beast'}</span></div>
          <div><span class="text-neutral-400">House Ghost:</span> <span class="font-bold text-white">${raw.ghost || 'Hogwarts Ghost'}</span></div>
          <div><span class="text-neutral-400">Common Room:</span> <span class="font-bold text-white">${raw.commonRoom || 'Castle'}</span></div>
          <div class="col-span-2"><span class="text-neutral-400">Colors:</span> <span class="font-bold text-white">${colors}</span></div>
        </div>
      `;
    } else {
      // spells
      extraDetailsHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/5">
          <div><span class="text-neutral-400">Incantation:</span> <span class="font-bold text-brand-gold font-mono">${raw.spell || item.title}</span></div>
          <div><span class="text-neutral-400">Archive Index:</span> <span class="font-bold text-white font-mono">#${item.index}</span></div>
        </div>
        <div class="space-y-1">
          <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Magical Effect & Usage</h5>
          <p class="text-xs text-neutral-300 leading-relaxed">${raw.use || 'Magical incantation from the Wizarding World.'}</p>
        </div>
      `;
    }

    this.modalBodyEl.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-6">
        <!-- Poster / Visual Thumbnail -->
        <div class="w-full sm:w-48 shrink-0">
          <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#18181c] border border-white/10 shadow-xl">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover"/>
            <div class="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-brand-red text-white uppercase tracking-wider">
              ${item.badge}
            </div>
          </div>
        </div>

        <!-- Meta and Action Area -->
        <div class="flex-1 space-y-4">
          <div>
            <div class="flex items-center gap-2 text-xs text-brand-gold font-semibold">
              <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
              <span class="uppercase tracking-widest text-[10px] text-neutral-400">${item.endpoint}</span>
            </div>
            <h3 class="font-display font-extrabold text-2xl text-white mt-1 leading-tight">${item.title}</h3>
            <p class="text-xs text-neutral-400 mt-0.5">${item.subtitle}</p>
          </div>

          <!-- Dynamic Resource Details -->
          ${extraDetailsHTML}

          <!-- Action Buttons -->
          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button 
              type="button" 
              id="detailModalFavBtn"
              class="px-5 py-2.5 rounded-full ${favorited ? 'bg-white/15 border border-brand-gold/50 text-brand-gold' : 'bg-brand-red hover:bg-red-700 text-white'} font-display font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
            >
              <i class="${favorited ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
              <span>${favorited ? t(this.currentLang, 'viewInList') : t(this.currentLang, 'addToList')}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Favorite button inside modal
    $('#detailModalFavBtn', this.modalBodyEl)?.addEventListener('click', () => {
      this.toggleFavorite(item);
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

    this.renderContent(item, item.raw);
    if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
  }
}
