/**
 * PotterFlix — Toast Notification Component
 */

import { $ } from '../utils/dom.js';

let toastTimeoutId = null;

/**
 * Display an interactive toast message
 * @param {string} message Text message to display
 * @param {string} [type='success'] 'success' | 'info' | 'error'
 */
export function showToast(message, type = 'success') {
  const toastContainer = $('#toastNotification');
  const toastMessageEl = $('#toastMessage');
  const toastIconEl = $('#toastIcon');

  if (!toastContainer || !toastMessageEl) return;

  toastMessageEl.textContent = message;

  if (toastIconEl) {
    toastIconEl.className = type === 'error'
      ? 'fa-solid fa-triangle-exclamation text-amber-500'
      : 'fa-solid fa-circle-check text-brand-red';
  }

  // Animate in
  toastContainer.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toastContainer.classList.add('translate-y-0', 'opacity-100');

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastContainer.classList.remove('translate-y-0', 'opacity-100');
    toastContainer.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 3200);
}
