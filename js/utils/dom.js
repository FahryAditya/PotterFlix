/**
 * PotterFlix — DOM Helper Utilities
 */

/**
 * Shorthand query selector
 * @param {string} selector CSS selector
 * @param {HTMLElement|Document} scope Search root
 * @returns {HTMLElement|null}
 */
export function $(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Shorthand query selector all as Array
 * @param {string} selector CSS selector
 * @param {HTMLElement|Document} scope Search root
 * @returns {Array<HTMLElement>}
 */
export function $$(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Safely escape HTML to prevent XSS injection
 * @param {string} str Raw string
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Debounce helper function for search inputs
 * @param {Function} func Callback to debounce
 * @param {number} wait Milliseconds to wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeoutId = null;
  return function debounced(...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}
