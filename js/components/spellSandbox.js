/**
 * PotterFlix — Arcane Spell Sandbox Component
 */

import { $ } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';
import { normalizeItem } from '../utils/formatters.js';

export class SpellSandboxController {
  /**
   * @param {object} options
   * @param {Function} options.onFavoriteChange Trigger favorite state update
   */
  constructor({ onFavoriteChange }) {
    this.onFavoriteChange = onFavoriteChange;

    this.spellNameEl = $('#spotlightSpellName');
    this.spellUseEl = $('#spotlightSpellUse');
    this.spellIndexEl = $('#spotlightSpellIndex');
    this.castBtn = $('#castRandomSpellBtn');
    this.saveBtn = $('#saveSpotlightSpellBtn');
    this.sigilBox = $('#arcaneSigilBox');

    this.spellsList = [];
    this.currentSpell = null;
    this.currentProfile = null;
    this.currentLang = 'en';

    this.bindEvents();
  }

  bindEvents() {
    this.castBtn?.addEventListener('click', () => {
      this.castRandomSpell();
    });

    this.saveBtn?.addEventListener('click', () => {
      if (!this.currentSpell || !this.currentProfile) return;

      const normalized = normalizeItem('spells', this.currentSpell, this.currentSpell.index || 0);
      const favorited = isFavorite(this.currentProfile, 'spells', normalized.id);

      if (favorited) {
        removeFavorite(this.currentProfile, 'spells', normalized.id);
        showToast(`"${normalized.title}" ${t(this.currentLang, 'itemRemovedToast')}`, 'info');
      } else {
        addFavorite(this.currentProfile, 'spells', normalized);
        showToast(`"${normalized.title}" ${t(this.currentLang, 'itemAddedToast')}`, 'success');
      }

      this.updateSaveButton();
      if (this.onFavoriteChange) this.onFavoriteChange(this.currentProfile);
    });
  }

  setSpells(spells, profile, lang = 'en') {
    this.spellsList = spells || [];
    this.currentProfile = profile;
    this.currentLang = lang;

    if (this.spellsList.length > 0 && !this.currentSpell) {
      this.currentSpell = this.spellsList[0];
      this.renderCurrentSpell();
    }
  }

  castRandomSpell() {
    if (this.spellsList.length === 0) return;

    // Trigger pulse visualizer animation
    if (this.sigilBox) {
      this.sigilBox.classList.remove('spell-cast-active');
      void this.sigilBox.offsetWidth; // Force reflow
      this.sigilBox.classList.add('spell-cast-active');
    }

    const randomIndex = Math.floor(Math.random() * this.spellsList.length);
    this.currentSpell = this.spellsList[randomIndex];
    this.renderCurrentSpell();
  }

  renderCurrentSpell() {
    if (!this.currentSpell) return;

    if (this.spellNameEl) {
      this.spellNameEl.textContent = this.currentSpell.spell || 'Unknown Spell';
    }
    if (this.spellUseEl) {
      this.spellUseEl.textContent = this.currentSpell.use || 'Conjures arcane wizarding light.';
    }
    if (this.spellIndexEl) {
      const idx = this.currentSpell.index !== undefined ? this.currentSpell.index : 0;
      this.spellIndexEl.textContent = `INDEX #${idx} • CANON INCANTATION`;
    }

    this.updateSaveButton();
  }

  updateSaveButton() {
    if (!this.currentSpell || !this.currentProfile || !this.saveBtn) return;

    const normalized = normalizeItem('spells', this.currentSpell, this.currentSpell.index || 0);
    const favorited = isFavorite(this.currentProfile, 'spells', normalized.id);

    if (favorited) {
      this.saveBtn.innerHTML = `
        <i class="fa-solid fa-bookmark text-brand-gold"></i>
        <span>${t(this.currentLang, 'viewInList')}</span>
      `;
      this.saveBtn.classList.add('bg-white/15', 'border-brand-gold/40');
    } else {
      this.saveBtn.innerHTML = `
        <i class="fa-regular fa-bookmark"></i>
        <span>${t(this.currentLang, 'saveSpellBtn')}</span>
      `;
      this.saveBtn.classList.remove('bg-white/15', 'border-brand-gold/40');
    }
  }

  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.updateSaveButton();
  }
}
