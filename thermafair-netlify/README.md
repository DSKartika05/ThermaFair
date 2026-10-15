# ThermaFair — Netlify

Situs tetap menggunakan HTML, CSS, dan JavaScript biasa. Netlify Functions
menyediakan endpoint untuk laporan, dasbor, ekspor CSV, dan Gemini. Laporan
disimpan sebagai objek JSON di Netlify Blobs pada situs yang sama; tidak ada
server Replit maupun database eksternal.

## Deploy

1. Unggah folder ini ke repositori GitHub dan hubungkan repositori tersebut ke
   Netlify. Pastikan direktori dasar proyek adalah folder ini.
2. Netlify membaca `netlify.toml`, memasang dependensi fungsi, lalu menerbitkan
   isi folder `site/`.
3. Di pengaturan situs Netlify, tambahkan environment variable
   `GEMINI_API_KEY` dengan API key Gemini milikmu. Opsional: tambahkan
   `GEMINI_MODEL` untuk mengganti model (default `gemini-3.1-flash-lite`).
4. Deploy ulang setelah menambahkan atau mengganti environment variable.

Jangan masukkan nilai API key ke `site/main.js`, repositori Git, atau file
yang bisa diunduh pengunjung. Karena key sebelumnya pernah ditaruh di
JavaScript publik, cabut key lama di Google AI Studio dan gunakan key baru
sebagai `GEMINI_API_KEY` di Netlify.

## Menjalankan secara lokal

Pasang Netlify CLI, hubungkan folder ini ke situs Netlify, lalu jalankan:

```sh
npm install
npx netlify dev
```

Untuk merilis dari CLI setelah login dan menautkan situs:

```sh
npx netlify deploy --build --prod
```

Data Blobs melekat pada situs Netlify dan tetap ada setelah deploy baru. Endpoint
laporan dan ekspor bersifat publik seperti versi semula; jangan kirim informasi
pribadi ke formulir ini.
