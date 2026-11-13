# PotterFlix — Wizarding World Cinematic Explorer

PotterFlix adalah aplikasi penjelajah dunia sihir Harry Potter berbasis web dengan estetika antarmuka sinematik gelap (*dark mode*) yang terinspirasi oleh Netflix. Dibangun menggunakan **HTML5, Tailwind CSS, dan JavaScript Native (ES6 Modules)** serta terintegrasi penuh dengan [PotterAPI](https://github.com/fedeperin/potterapi).

---

## 🚀 Fitur Utama

- **Estetika Sinematik PotterFlix**: Tema gelap pekat (`#121212`, crimson red `#E50914`, gold `#F5B50A`), glassmorphic scroll-morphing navbar, hero showcase banner, dan ilustrasi vektor lanskap Hogwarts pada footer (sayap Golden Snitch mengepak, bintang berkelap-kelip, kastil Hogwarts).
- **Integrasi PotterAPI Resmi**: Mengakses 4 endpoint (`/books`, `/characters`, `/houses`, `/spells`) dengan dukungan parameter resmi `?index=`, `?max=`, `?page=`, dan `?search=`.
- **Filter Bertingkat (Multi-Tier Filter)**:
  - **Tier 1**: Endpoint sumber utama (Books, Characters, Houses, Spells).
  - **Tier 2**: Sub-kategori dinamis (Asrama Hogwarts: Gryffindor, Slytherin, Ravenclaw, Hufflepuff; Era Buku; Jenis Mantra).
  - **Tier 3**: Live search bar & selector limit per halaman.
- **Sorting & Live Search**: Urutan A-Z, Z-A, Halaman/Tahun rilis, serta pencarian instan dengan *debounce* dan *AbortController*.
- **Arcane Spell Sandbox**: Fitur interaktif untuk memicu mantra acak dengan animasi visualizer sigil SVG dan tombol simpan ke daftar favorit.
- **LocalStorage Profil Wizard & 4 Kategori Favorit**: Pengguna dapat menyimpan nama penyihir mereka serta mengelola 4 kategori data favorit (`books`, `characters`, `houses`, `spells`) yang tersinkronisasi langsung dengan badge counter dan drawer modal *My List*.
- **Adaptif 7 Bahasa**: Fitur switcher adaptif untuk 7 bahasa (`en`, `es`, `fr`, `it`, `pt`, `uk`, `de`) yang langsung merubah seluruh teks antarmuka dan query bahasa PotterAPI secara dinamis.

---

## 📂 Struktur Proyek

```
harry-potter/
├── index.html                   # Entry point aplikasi & semantic markup
├── css/
│   └── custom.css               # Kustomisasi scrollbar, glassmorphism, dan animasi SVG footer
└── js/
    ├── main.js                  # Bootstrap & lifecycle orchestrator
    ├── config/
    │   ├── constants.js         # API URL, house theme palettes, defaults
    │   └── i18n.js              # Kamus terjemahan 7 bahasa & helper t()
    ├── services/
    │   ├── potterApi.js         # Client API async, validasi, params, cache, AbortController
    │   └── storageService.js    # LocalStorage handler untuk profil wizard & 4 kategori favorit
    ├── utils/
    │   ├── dom.js               # Helper selektor DOM & sanitasi string aman
    │   └── formatters.js        # Dynamic SVG poster generator & item normalizer
    └── components/
        ├── toast.js             # Notifikasi toast interaktif
        ├── navbar.js            # Navbar controller, language switcher, search expansion
        ├── hero.js              # Hero showcase banner & pagination dots
        ├── trendsCarousel.js    # Horizontal carousel slider "Trends Now"
        ├── catalog.js           # Multi-tier filter, sort, pagination, error state banner
        ├── spellSandbox.js      # Arcane spell caster interaktif
        ├── detailModal.js       # Inspector modal (?index=)
        └── profileModal.js      # Modal profil wizard & 4-category drawer My List
```

---

## 💻 Cara Menjalankan Secara Lokal

Karena proyek ini menggunakan native **ES6 Modules**, jalankan melalui web server lokal:

### Menggunakan Node.js:
```bash
npx serve
# atau
node -e "const http = require('http'), fs = require('fs'), path = require('path'), mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }; http.createServer((req, res) => { let p = req.url.split('?')[0]; if (p === '/') p = '/index.html'; const f = path.join(process.cwd(), p); fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end('Not Found'); return; } res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'text/plain' }); res.end(data); }); }).listen(3000, () => console.log('http://localhost:3000'));"
```

Buka peramban di `http://localhost:3000`.
