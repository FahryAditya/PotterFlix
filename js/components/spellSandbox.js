/**
 * ============================================================================
 * File: js/components/spellSandbox.js
 * Deskripsi: Komponen pengendali Sandbox Mantra Interaktif (Arcane Spell Sandbox).
 *            Memungkinkan pengguna memicu mantra acak ("Cast Random Spell") dengan
 *            animasi pulse pada visualizer sigil SVG magis, serta menyimpan mantra
 *            ke dalam kategori favorit di LocalStorage.
 * ============================================================================
 */

import { $ } from '../utils/dom.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/storageService.js';
import { showToast } from './toast.js';
import { t } from '../config/i18n.js';
import { normalizeItem } from '../utils/formatters.js';

export class SpellSandboxController {
  /**
   * Konstruktor inisialisasi SpellSandboxController.
   * 
   * @param {object} options - Konfigurasi callback event
   * @param {Function} options.onFavoriteChange - Callback saat status bookmark mantra diubah
   */
  constructor({ onFavoriteChange }) {
    // 1. Simpan handler callback
    this.onFavoriteChange = onFavoriteChange;

    // 2. Referensi elemen-elemen DOM Sandbox Mantra
    this.spellNameEl = $('#spotlightSpellName');
    this.spellUseEl = $('#spotlightSpellUse');
    this.spellIndexEl = $('#spotlightSpellIndex');
    this.castBtn = $('#castRandomSpellBtn');
    this.saveBtn = $('#saveSpotlightSpellBtn');
    this.sigilBox = $('#arcaneSigilBox');

    // 3. Status internal
    this.spellsList = [];       // Daftar seluruh mantra dari PotterAPI
    this.currentSpell = null;   // Mantra yang sedang aktif disorot
    this.currentProfile = null; // Profil pengguna untuk sinkronisasi bookmark
    this.currentLang = 'en';    // Bahasa aktif

    // 4. Pasang event listener
    this.bindEvents();
  }

  /**
   * Mengikat aksi tombol "Cast Random Spell" dan tombol "Save to My List".
   */
  bindEvents() {
    // Aksi Klik Tombol "Cast Random Spell": Pilih mantra acak dan picu animasi sigil
    this.castBtn?.addEventListener('click', () => {
      this.castRandomSpell();
    });

    // Aksi Klik Tombol "Save to My List": Simpan atau hapus mantra dari koleksi favorit
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

  /**
   * Mengisi daftar mantra canon yang diperoleh dari PotterAPI.
   * 
   * @param {Array<object>} spells - Daftar objek mantra dari API
   * @param {object} profile - Objek profil pengguna aktif
   * @param {string} [lang='en'] - Kode bahasa saat ini
   */
  setSpells(spells, profile, lang = 'en') {
    this.spellsList = spells || [];
    this.currentProfile = profile;
    this.currentLang = lang;

    // Tampilkan mantra pertama sebagai default jika belum ada mantra yang aktif
    if (this.spellsList.length > 0 && !this.currentSpell) {
      this.currentSpell = this.spellsList[0];
      this.renderCurrentSpell();
    }
  }

  /**
   * Memilih satu mantra acak dari daftar dan memicu animasi pulse pada lingkaran sigil.
   */
  castRandomSpell() {
    if (this.spellsList.length === 0) return;

    // 1. Picu animasi pulse pada visualizer rune sigil magis (reset class untuk trigger reflow)
    if (this.sigilBox) {
      this.sigilBox.classList.remove('spell-cast-active');
      void this.sigilBox.offsetWidth; // Paksa DOM reflow agar animasi dapat berulang
      this.sigilBox.classList.add('spell-cast-active');
    }

    // 2. Pilih indeks acak
    const randomIndex = Math.floor(Math.random() * this.spellsList.length);
    this.currentSpell = this.spellsList[randomIndex];

    // 3. Render teks mantra ke layar
    this.renderCurrentSpell();
  }

  /**
   * Merender nama mantra, kegunaan, dan indeks canonical ke elemen HTML.
   */
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

  /**
   * Memperbarui status tombol bookmark ("Save to My List" vs "In My List").
   */
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

  /**
   * Memperbarui profil pengguna secara reaktif.
   * 
   * @param {object} profile - Profil pengguna terbaru
   * @param {string} [lang] - Kode bahasa jika ada perubahan
   */
  updateProfile(profile, lang) {
    this.currentProfile = profile;
    if (lang) this.currentLang = lang;
    this.updateSaveButton();
  }
}
