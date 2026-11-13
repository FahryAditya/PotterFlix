/**
 * ============================================================================
 * File: js/utils/formatters.js
 * Deskripsi: Utilitas penyeragaman model data (data normalization), pembuatan
 *            poster SVG fallback dinamis (dengan penanganan Unicode aman),
 *            serta pemetaan tema warna asrama Hogwarts.
 * ============================================================================
 */

import { HOUSE_THEMES, DEFAULT_FALLBACK_THEME } from '../config/constants.js';
import { escapeHTML } from './dom.js';

/**
 * Menemukan konfigurasi tema warna dan ikon berdasarkan nama asrama Hogwarts.
 * 
 * @param {string} [houseName=''] - Nama asrama Hogwarts (misal: 'Gryffindor', 'Slytherin')
 * @returns {object} Objek konfigurasi tema asrama {primaryColor, secondaryColor, accentColor, icon, borderClass}
 */
export function getHouseTheme(houseName = '') {
  // 1. Jika nama asrama kosong atau bukan string, kembalikan tema default
  if (!houseName || typeof houseName !== 'string') {
    return DEFAULT_FALLBACK_THEME;
  }

  // 2. Cari kecocokan kata kunci nama asrama secara case-insensitive
  const match = Object.keys(HOUSE_THEMES).find(key => 
    houseName.toLowerCase().includes(key.toLowerCase())
  );

  // 3. Kembalikan tema yang cocok atau tema default jika tidak ditemukan
  return match ? HOUSE_THEMES[match] : DEFAULT_FALLBACK_THEME;
}

/**
 * Membuat gambar poster SVG fallback dinamis dalam format Data URI (base64/utf8).
 * Menghasilkan poster sinematik bertema Harry Potter jika gambar asli dari API tidak tersedia.
 * 
 * Fitur Keamanan:
 * - Membersihkan emoji sebelum mengambil huruf inisial untuk menghindari pemotongan surrogate pair.
 * - Menggunakan toWellFormed() untuk mencegah URIError: URI malformed pada encodeURIComponent.
 * 
 * @param {string} title - Judul utama yang ditampilkan pada poster (misal: judul buku / nama karakter)
 * @param {string} subtitle - Sub-judul atau keterangan tambahan (misal: tanggal rilis / asrama)
 * @param {string} [c1='#450a0a'] - Warna awal gradien latar belakang SVG (hex color)
 * @param {string} [c2='#121212'] - Warna akhir gradien latar belakang SVG (hex color)
 * @param {string} [badge='WIZARD'] - Teks lencana atas (misal: 'BOOK', 'WIZARD', 'HOGWARTS')
 * @returns {string} String Data URI gambar SVG yang siap digunakan pada tag <img src="...">
 */
export function buildFallbackPosterSVG(title, subtitle, c1 = '#450a0a', c2 = '#121212', badge = 'WIZARD') {
  // 1. Sanitasi teks input untuk mencegah injeksi HTML/SVG
  const safeTitle = escapeHTML(String(title || 'PotterFlix'));
  const safeSub = escapeHTML(String(subtitle || 'Wizarding World'));

  // 2. Bersihkan emoji & karakter surrogate agar tidak terpotong menjadi orphaned surrogate
  const cleanWords = safeTitle
    .replace(/[\uD800-\uDFFF]|\p{Extended_Pictographic}|\p{Emoji}/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // 3. Ambil inisial huruf besar dari 2 kata pertama secara aman dengan Array.from
  const initials = cleanWords.slice(0, 2).map(w => Array.from(w)[0] || '').join('').toUpperCase() || 'HP';
  
  // 4. Susun markup SVG dengan rasio bioskop 2:3 (300 x 450)
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <!-- Background Gradient -->
    <rect width="300" height="450" fill="url(#bg)"/>
    <!-- Decorative Arcane Circles -->
    <circle cx="240" cy="85" r="95" fill="#ffffff" fill-opacity="0.05"/>
    <circle cx="65" cy="365" r="115" fill="#E50914" fill-opacity="0.15"/>
    <!-- Top Badge -->
    <text x="22" y="46" fill="#E50914" font-family="Montserrat, sans-serif" font-weight="900" font-size="16" letter-spacing="2">${badge}</text>
    <!-- Center Watermark Initials -->
    <text x="150" y="240" text-anchor="middle" fill="#ffffff" fill-opacity="0.14" font-family="Montserrat, sans-serif" font-weight="900" font-size="88">${initials}</text>
    <!-- Bottom Title & Subtitle -->
    <text x="22" y="390" fill="#ffffff" font-family="Montserrat, sans-serif" font-weight="700" font-size="16">${safeTitle.slice(0, 26)}</text>
    <text x="22" y="416" fill="#a3a3a3" font-family="sans-serif" font-size="12">${safeSub.slice(0, 32)}</text>
  </svg>`;

  // 5. Validasi bahwa string SVG merupakan UTF-16 yang terformat dengan baik
  const wellFormedSvg = typeof rawSvg.toWellFormed === 'function' ? rawSvg.toWellFormed() : rawSvg;

  // 6. Encode menjadi Data URI aman
  return `data:image/svg+xml;utf8,${encodeURIComponent(wellFormedSvg)}`;
}

/**
 * Menyeragamkan objek data mentah dari PotterAPI menjadi satu struktur standar.
 * Memastikan semua komponen UI (kartu, modal, carousel, favorit) dapat membaca properti
 * yang sama (id, endpoint, index, title, subtitle, badge, metric, image, description).
 * 
 * @param {string} endpoint - Kategori endpoint ('books', 'characters', 'houses', 'spells')
 * @param {object} raw - Objek mentah dari respons JSON PotterAPI
 * @param {number} [fallbackIndex=0] - Nomor index cadangan jika data mentah tidak memiliki index
 * @returns {object} Objek terstandardisasi siap render
 */
export function normalizeItem(endpoint, raw, fallbackIndex = 0) {
  // Ambil index numerik canonical
  const index = raw.index !== undefined ? raw.index : fallbackIndex;

  // 1. Normalisasi Data BUKU (Books)
  if (endpoint === 'books') {
    const bookNumber = raw.number !== undefined ? raw.number : index + 1;
    return {
      id: `books-${index}`,
      endpoint: 'books',
      index,
      title: raw.title || 'Untitled Book',
      subtitle: raw.releaseDate || 'Hogwarts Library Edition',
      badge: `BOOK #${bookNumber}`,
      metric: raw.pages ? `${raw.pages}p` : 'Book',
      image: raw.cover || buildFallbackPosterSVG(raw.title, raw.releaseDate, '#7f1d1d', '#141414', 'BOOK'),
      description: raw.description || raw.summary || '',
      raw
    };
  }

  // 2. Normalisasi Data KARAKTER (Characters)
  if (endpoint === 'characters') {
    const theme = getHouseTheme(raw.hogwartsHouse);
    return {
      id: `characters-${index}`,
      endpoint: 'characters',
      index,
      title: raw.fullName || raw.nickname || 'Unknown Wizard',
      subtitle: raw.hogwartsHouse || raw.interpretedBy || 'Wizarding World',
      badge: raw.hogwartsHouse ? raw.hogwartsHouse.toUpperCase() : 'WIZARD',
      metric: raw.birthdate || 'Character',
      image: raw.image || buildFallbackPosterSVG(raw.fullName, raw.hogwartsHouse, theme.primaryColor, theme.secondaryColor, 'WIZARD'),
      description: raw.interpretedBy ? `Interpreted by ${raw.interpretedBy}` : (raw.hogwartsHouse || ''),
      raw
    };
  }

  // 3. Normalisasi Data ASRAMA (Houses)
  if (endpoint === 'houses') {
    const theme = getHouseTheme(raw.house);
    return {
      id: `houses-${index}`,
      endpoint: 'houses',
      index,
      title: raw.house || 'Hogwarts House',
      subtitle: raw.founder ? `Founder: ${raw.founder}` : 'Hogwarts School',
      badge: `${raw.emoji || theme.icon} HOUSE`,
      metric: raw.animal || 'Crest',
      image: buildFallbackPosterSVG(raw.house, raw.founder, theme.primaryColor, theme.secondaryColor, 'HOGWARTS'),
      description: raw.colors ? `Colors: ${Array.isArray(raw.colors) ? raw.colors.join(', ') : raw.colors}` : '',
      raw
    };
  }

  // 4. Normalisasi Data MANTRA (Spells)
  return {
    id: `spells-${index}`,
    endpoint: 'spells',
    index,
    title: raw.spell || 'Unknown Incantation',
    subtitle: raw.use || 'Magical Incantation',
    badge: `SPELL #${index + 1}`,
    metric: 'Incantation',
    image: buildFallbackPosterSVG(raw.spell, raw.use, '#3b0764', '#09090b', 'SPELL'),
    description: raw.use || '',
    raw
  };
}
