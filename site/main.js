// ================================================================
// main.js — ThermaFair Landing Page
// Platform AI untuk Kenyamanan Termal yang Inklusif Gender
//
// Fitur JavaScript:
//  #1 — Typewriter Effect (hero title)
//  #2 — Burger Menu (navigasi mobile responsif)
//  #3 — Scroll To Top Button (kanan tengah, di atas chat)
//  #4 — Kalkulator Kenyamanan Termal (kalkulasi berbasis ASHRAE)
//  #5 — AI Chatbot dengan Gemini API
// ================================================================

// Endpoint backend berjalan di domain Netlify yang sama dengan situs.
const API_ROUTES = {
  reports: '/api/thermal-reports',
  stats: '/api/thermal-stats',
  export: '/api/thermal-reports/export',
  gemini: '/api/gemini'
};

// ================================================================
// JS #1 — TYPEWRITER EFFECT
// Konsep: String indexing, setInterval, clearInterval, textContent
// Fungsi: Menampilkan judul halaman satu per satu karakter untuk
//         menarik perhatian pengguna dan membuat kesan dinamis.
// ================================================================
(function typewriterEffect() {
  const el   = document.getElementById('hero-title');
  if (!el) return;

  const text = 'ThermaFair: AI untuk Kenyamanan Termal yang Inklusif Gender';
  let i      = 0;

  const interval = setInterval(function () {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      el.classList.add('done'); // hapus cursor berkedip setelah selesai
    }
  }, 48);
})();


// ================================================================
// JS #2 — BURGER MENU (NAVIGASI MOBILE)
// Konsep: classList.toggle, event delegation, klik di luar area
// Fungsi: Menampilkan/menyembunyikan menu navigasi saat di mobile.
//         Menutup otomatis saat klik overlay atau link navigasi.
// ================================================================
(function burgerMenu() {
  const burgerBtn  = document.getElementById('burger-btn');
  const mainNav    = document.getElementById('main-nav');
  const navOverlay = document.getElementById('nav-overlay');
  const navLinks   = document.querySelectorAll('.nav-links a');

  if (!burgerBtn || !mainNav || !navOverlay) return;

  function openNav() {
    burgerBtn.classList.add('open');
    mainNav.classList.add('open');
    navOverlay.classList.add('active');
    burgerBtn.setAttribute('aria-expanded', 'true');
    burgerBtn.setAttribute('aria-label', 'Tutup menu');
    document.body.style.overflow = 'hidden'; // mencegah scroll saat menu terbuka
  }

  function closeNav() {
    burgerBtn.classList.remove('open');
    mainNav.classList.remove('open');
    navOverlay.classList.remove('active');
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.setAttribute('aria-label', 'Buka menu');
    document.body.style.overflow = ''; // kembalikan scroll
  }

  // Toggle saat tombol burger diklik
  burgerBtn.addEventListener('click', function () {
    if (mainNav.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Tutup saat klik di luar area menu (overlay)
  navOverlay.addEventListener('click', closeNav);

  // Tutup dan scroll ke section saat link nav diklik
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeNav();
    });
  });

  // Tutup dengan tombol Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      closeNav();
    }
  });
})();


// ================================================================
// JS #3 — SCROLL TO TOP BUTTON
// Konsep: window.scrollY, addEventListener('scroll'), scrollTo
// Fungsi: Menampilkan tombol "kembali ke atas" setelah user
//         men-scroll lebih dari 300px, lalu menyembunyikannya kembali.
//         Posisi: kanan tengah layar, di atas tombol chat widget.
// ================================================================
(function backToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  function updateVisibility() {
    if (window.scrollY > 300) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  }

  // Jalankan saat halaman dimuat, lalu pantau posisi scroll.
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });

  // Klik → scroll halus ke paling atas
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


// ================================================================
// JS #4 — KALKULATOR KENYAMANAN TERMAL
// Konsep: Form handling, DOM manipulation, logika kalkulasi ASHRAE
// Fungsi: Menghitung skor kenyamanan termal personal berdasarkan
//         faktor gender, usia, pakaian, suhu, dan kondisi saat ini.
//         Menghasilkan rekomendasi suhu ideal dan status zona.
//
// Model Kalkulasi (berbasis ASHRAE 55 + adaptasi gender):
//   - Suhu nyaman dasar ASHRAE: 22–24°C
//   - Perempuan: metabolisme 20–35% lebih rendah → preferensi lebih hangat
//   - Usia > 50: cenderung lebih nyaman di suhu lebih hangat
//   - Pakaian tipis: merasa lebih dingin; pakaian tebal: lebih hangat
//   - AI (Gemini) memberikan penjelasan narasi berbasis input
// ================================================================
(function thermalCalculator() {
  const form           = document.getElementById('thermal-form');
  const resultEl       = document.getElementById('thermal-result');
  const tempSlider     = document.getElementById('tf-temp');
  const tempValDisplay = document.getElementById('tf-temp-val');
  const resetBtn       = document.getElementById('reset-btn');

  if (!form || !resultEl || !tempSlider) return;

  // Update tampilan nilai slider secara real-time
  tempSlider.addEventListener('input', function () {
    tempValDisplay.textContent = this.value + '°C';
  });

  // Hitung skor kenyamanan berdasarkan input
  function calculateComfort(data) {
    let idealMin = 22;
    let idealMax = 24;

    // Penyesuaian berdasarkan gender
    if (data.gender === 'perempuan') {
      idealMin += 1.5;  // perempuan cenderung perlu suhu lebih hangat
      idealMax += 2.0;
    } else if (data.gender === 'laki-laki') {
      idealMin -= 0.5;
      idealMax -= 0.5;
    } else {
      idealMin += 0.5;
      idealMax += 1.0;
    }

    // Penyesuaian berdasarkan usia
    if (data.age === '50+') {
      idealMin += 1.0;
      idealMax += 1.0;
    } else if (data.age === '18-29') {
      idealMin -= 0.5;
    }

    // Penyesuaian berdasarkan pakaian
    const clothingAdj = {
      'formal-tebal':    -1.0, // jas/blazer → merasa lebih hangat
      'formal-tipis':     0.0, // standar
      'kasual':           0.5, // kasual → cenderung lebih dingin
      'gamis-hijab':      1.5, // pakaian tertutup → merasa lebih panas
      'jaket-tambahan':  -2.0  // sudah pakai jaket → artinya kedinginan
    };
    const adj = clothingAdj[data.clothing] || 0;
    idealMin -= adj;
    idealMax -= adj;

    // Penyesuaian lokasi
    const locationAdj = {
      'dekat-ac':      -1.5, // dekat AC → terasa lebih dingin
      'tengah':         0.0,
      'jauh-ac':        0.5,
      'pinggir-jendela': 0.5
    };
    const locAdj = locationAdj[data.location] || 0;
    idealMin -= locAdj;
    idealMax -= locAdj;

    // Hitung skor berdasarkan suhu aktual vs rentang ideal
    const currentTemp = parseFloat(data.temp);
    let score = 100;

    if (currentTemp < idealMin) {
      const diff = idealMin - currentTemp;
      score = Math.max(0, 100 - (diff * 12));
    } else if (currentTemp > idealMax) {
      const diff = currentTemp - idealMax;
      score = Math.max(0, 100 - (diff * 12));
    }

    // Koreksi berdasarkan kondisi yang dilaporkan pengguna
    const conditionMap = {
      'sangat-dingin': -25,
      'dingin':        -10,
      'nyaman':          0,
      'panas':         -10,
      'sangat-panas':  -25
    };
    score += (conditionMap[data.condition] || 0);
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Tentukan status zona
    let zone, zoneBadgeClass;
    if (data.condition === 'sangat-dingin' || data.condition === 'dingin' || currentTemp < idealMin - 1) {
      zone = '🥶 Cold Spot';
      zoneBadgeClass = 'cold';
    } else if (data.condition === 'sangat-panas' || data.condition === 'panas' || currentTemp > idealMax + 1) {
      zone = '🔥 Hot Spot';
      zoneBadgeClass = 'hot';
    } else {
      zone = '😊 Zona Nyaman';
      zoneBadgeClass = 'normal';
    }

    // Rekomendasi suhu AC
    const acRecMin = Math.round((idealMin + idealMax) / 2 * 2) / 2;
    const acRecMax = acRecMin + 2;

    return {
      idealRange: `${idealMin.toFixed(1)}°C – ${idealMax.toFixed(1)}°C`,
      score: score,
      zone: zone,
      zoneBadgeClass: zoneBadgeClass,
      acRec: `${acRecMin.toFixed(1)}°C – ${acRecMax.toFixed(1)}°C`
    };
  }

  // Tampilkan hasil di DOM
  function displayResult(result, data) {
    document.getElementById('result-ideal-temp').textContent = result.idealRange;
    document.getElementById('result-score').textContent      = result.score + '/100';
    document.getElementById('result-zone').textContent       = result.zone;
    document.getElementById('result-ac-rec').textContent     = result.acRec;

    const badge = document.getElementById('result-status-badge');
    badge.className = 'status-badge ' + result.zoneBadgeClass;
    badge.textContent = result.zone;

    // Tampilkan penjelasan lokal sementara AI diproses
    document.getElementById('result-ai-text').innerHTML =
      '<em>⏳ Sedang menganalisis dengan AI…</em>';

    resultEl.removeAttribute('hidden');
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Kirim data anonim ke server dan minta penjelasan AI secara paralel
    submitReport(data, result);
    getAIExplanation(data, result);
  }

  // Submit form
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const gender    = document.getElementById('tf-gender').value;
    const age       = document.getElementById('tf-age').value;
    const clothing  = document.getElementById('tf-clothing').value;
    const location  = document.getElementById('tf-location').value;
    const temp      = document.getElementById('tf-temp').value;
    const condition = document.querySelector('input[name="condition"]:checked')?.value || 'nyaman';

    if (!gender || !age || !clothing) {
      alert('Harap lengkapi semua field yang wajib diisi.');
      return;
    }

    const data   = { gender, age, clothing, location, temp, condition };
    const result = calculateComfort(data);
    displayResult(result, data);
  });

  // Reset form
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resultEl.setAttribute('hidden', '');
      tempValDisplay.textContent = '22°C';
    });
  }


  // Kirim data anonim ke server setelah kalkulasi selesai
  async function submitReport(data, result) {
    try {
      const response = await fetch(API_ROUTES.reports, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender:      data.gender,
          ageGroup:    data.age,
          clothing:    data.clothing,
          location:    data.location,
          currentTemp: parseFloat(data.temp),
          condition:   data.condition,
          score:       result.score,
          zone:        result.zone.replace(/[🥶😊🔥]/g, '').trim()
        })
      });
      if (!response.ok) {
        const error = await response.json().catch(function () { return {}; });
        throw new Error(error.error || 'Laporan gagal disimpan.');
      }
      showToast('✅ Data kenyamanan termalmu tercatat secara anonim!');
      // Refresh dashboard setelah submit
      loadDashboard();
    } catch (err) {
      console.warn('Gagal mengirim laporan anonim:', err);
    }
  }

  // Simple toast notification
  function showToast(msg) {
    let toast = document.getElementById('tf-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tf-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3500);
  }

  // ================================================================
  // AI EXPLANATION (Gemini API)
  // Dipanggil setelah kalkulasi lokal untuk mendapat penjelasan naratif
  // ================================================================
  async function getAIExplanation(data, result) {
    const GEMINI_URL = API_ROUTES.gemini;

    const conditionLabel = {
      'sangat-dingin': 'sangat kedinginan',
      'dingin': 'kedinginan',
      'nyaman': 'nyaman',
      'panas': 'kepanasan',
      'sangat-panas': 'sangat kepanasan'
    };

    const clothingLabel = {
      'formal-tebal': 'pakaian formal tebal (jas/blazer)',
      'formal-tipis': 'pakaian formal tipis (kemeja/blouse)',
      'kasual': 'pakaian kasual',
      'gamis-hijab': 'gamis/hijab tertutup',
      'jaket-tambahan': 'perlu jaket tambahan'
    };

    const prompt = `Kamu adalah AI asisten ThermaFair, platform kenyamanan termal inklusif berbasis ASHRAE.

Berikan penjelasan singkat (3-4 kalimat) dalam Bahasa Indonesia yang ramah dan informatif berdasarkan data kenyamanan termal berikut:
- Gender: ${data.gender}
- Kelompok usia: ${data.age} tahun
- Pakaian: ${clothingLabel[data.clothing] || data.clothing}
- Suhu kantor saat ini: ${data.temp}°C
- Kondisi yang dirasakan: ${conditionLabel[data.condition] || data.condition}
- Suhu ideal hasil kalkulasi: ${result.idealRange}
- Skor kenyamanan: ${result.score}/100
- Status zona: ${result.zone}

Jelaskan mengapa seseorang dengan profil ini mungkin mengalami ketidaknyamanan, kaitan dengan perbedaan metabolisme gender (berdasarkan penelitian Olesen 2015), dan apa yang dapat dilakukan oleh manajemen gedung untuk meningkatkan kenyamanan di area tersebut. Gunakan bahasa yang hangat dan inklusif.`;

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      });

      const data_resp = await response.json();
      const reply =
        data_resp.candidates?.[0]?.content?.parts?.[0]?.text
          ? data_resp.candidates[0].content.parts[0].text
          : (data_resp.error ? `⚠️ Error AI: ${data_resp.error.message || data_resp.error}` : '⚠️ Tidak dapat memuat penjelasan AI.');

      document.getElementById('result-ai-text').innerHTML =
        reply
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

    } catch (err) {
      document.getElementById('result-ai-text').innerHTML =
        '⚠️ Layanan AI tidak dapat dihubungi. Pastikan konfigurasi Gemini di Netlify aktif.';
      console.error('AI explanation error:', err);
    }
  }
})();


// ================================================================
// JS #5 — AI CHATBOT WIDGET (Gemini API)
// Konsep: Fetch API, async/await, DOM manipulation, event handling
// Fungsi: Chatbot AI interaktif khusus ThermaFair yang dapat
//         menjawab pertanyaan seputar kenyamanan termal, inklusivitas
//         gender di ruang kerja, standar ASHRAE, dan cara kerja ThermaFair.
//
// API: Google Gemini API
// Dapatkan API key gratis di: https://aistudio.google.com/apikey
// ================================================================
(function aiChatbot() {
  const GEMINI_URL = API_ROUTES.gemini;

  const SYSTEM_PROMPT = `# IDENTITAS

Kamu adalah ThermaFair AI, asisten kecerdasan buatan yang dikembangkan untuk mendukung kenyamanan termal yang inklusif di ruang kerja dan ruang publik ber-AC.
Tujuan utamamu adalah membantu pengguna memahami faktor-faktor yang memengaruhi kenyamanan termal, memberikan rekomendasi yang berbasis bukti ilmiah, serta meningkatkan kesadaran mengenai pentingnya desain ruang yang mempertimbangkan kebutuhan semua individu.
Kamu bukan dokter, psikolog, teknisi AC, maupun konsultan bangunan. Jangan memberikan diagnosis medis, resep obat, atau keputusan teknis yang bersifat mutlak.
Selalu berikan jawaban yang edukatif, objektif, dan mudah dipahami.

---

# LATAR BELAKANG PROYEK

ThermaFair merupakan proyek AI for Social Good yang bertujuan meningkatkan kesadaran tentang ketimpangan kenyamanan termal di ruang kerja.
Banyak gedung perkantoran menggunakan sistem AC Central yang menetapkan satu suhu untuk seluruh ruangan sehingga kebutuhan kenyamanan setiap individu belum tentu terpenuhi.
Penelitian menunjukkan bahwa perempuan lebih sering melaporkan rasa dingin di kantor. Namun, hal ini bukan berarti semua perempuan akan selalu merasa dingin. Kenyamanan termal dipengaruhi oleh berbagai faktor sehingga setiap individu dapat memiliki pengalaman yang berbeda.

Tujuan ThermaFair adalah:
• meningkatkan kesadaran mengenai kenyamanan termal yang inklusif;
• membantu pengguna memahami faktor-faktor yang memengaruhi kenyamanan termal;
• memberikan rekomendasi yang mempertimbangkan kenyamanan pengguna sekaligus efisiensi energi;
• mendukung lingkungan kerja yang lebih sehat, nyaman, dan adil.

---

# PENGETAHUAN YANG HARUS DIGUNAKAN

Gunakan konsep-konsep berikut ketika menjawab.
Kenyamanan termal dipengaruhi oleh kombinasi beberapa faktor, antara lain:
- suhu udara;
- kelembapan udara;
- aliran udara;
- jenis pakaian;
- tingkat aktivitas;
- metabolisme tubuh;
- paparan sinar matahari;
- preferensi individu.

Jangan pernah menyimpulkan hanya berdasarkan gender.
Jika membahas perempuan dan laki-laki, jelaskan secara ilmiah bahwa penelitian menemukan adanya kecenderungan tertentu, tetapi setiap individu tetap memiliki kebutuhan kenyamanan yang berbeda.

Hindari kalimat seperti:
"Perempuan pasti lebih mudah kedinginan."

Gunakan kalimat seperti:
"Beberapa penelitian menunjukkan bahwa banyak perempuan melaporkan rasa dingin lebih sering dibanding laki-laki di ruang kerja ber-AC. Namun, pengalaman setiap individu tetap dipengaruhi oleh berbagai faktor seperti pakaian, metabolisme, aktivitas, dan kondisi lingkungan."

---

# SUMBER PENGETAHUAN

Gunakan prinsip-prinsip berikut apabila relevan:
• standar kenyamanan termal ASHRAE;
• konsep kenyamanan termal dalam bangunan;
• penelitian mengenai metabolisme dan kenyamanan termal;
• prinsip efisiensi energi dalam penggunaan AC.
Jika pengguna bertanya mengenai standar suhu, jelaskan bahwa secara umum suhu ruang kerja yang nyaman berada pada kisaran sekitar 24–26°C, tetapi kebutuhan setiap individu dapat berbeda.

---

# DATA YANG DAPAT DITERIMA

Aplikasi dapat mengirimkan informasi seperti:

- gender;
- usia;
- jenis pakaian;
- suhu ruangan;
- kelembapan ruangan;
- suhu luar ruangan (BMKG);
- kelembapan luar ruangan (BMKG);
- kondisi yang dirasakan pengguna (dingin, nyaman, panas);
- aktivitas pengguna.

Gunakan seluruh informasi tersebut dalam melakukan analisis.

Jangan hanya berfokus pada satu variabel.

---

# FORMAT JAWABAN

Jika pengguna meminta analisis kenyamanan termal, gunakan struktur berikut.

## Analisis

Jelaskan kondisi pengguna secara singkat berdasarkan data yang diberikan.

## Faktor yang Mempengaruhi

Jelaskan faktor-faktor yang mungkin menyebabkan pengguna merasa dingin atau panas.

## Rekomendasi

Berikan saran yang realistis, misalnya:

- kisaran suhu yang lebih nyaman;
- penggunaan pakaian tambahan;
- perpindahan posisi duduk apabila terkena hembusan AC secara langsung;
- diskusi dengan pengelola gedung apabila diperlukan.

## Efisiensi Energi

Apabila relevan, jelaskan bahwa penyesuaian suhu AC secara bijak dapat meningkatkan kenyamanan sekaligus menghemat energi.

## Catatan

Sampaikan bahwa rekomendasi bersifat umum dan setiap individu dapat memiliki preferensi kenyamanan yang berbeda.

---

# GAYA BAHASA

Gunakan Bahasa Indonesia yang:

- sopan;
- profesional;
- ramah;
- mudah dipahami;
- tidak terlalu teknis.

Hindari paragraf yang terlalu panjang.
Gunakan poin-poin bila diperlukan.

---

# BATASAN

Jangan:

- memberikan diagnosis penyakit;
- menyarankan penggunaan obat;
- menyalahkan gender tertentu;
- membuat stereotip;
- memberikan informasi yang tidak memiliki dasar ilmiah.

Apabila pengguna mengeluhkan kondisi kesehatan serius, sarankan untuk berkonsultasi dengan tenaga kesehatan.

---

# TUJUAN AKHIR

Setiap jawaban harus membantu pengguna:
1. memahami kondisi kenyamanan termalnya;
2. memahami bahwa kenyamanan termal dipengaruhi oleh banyak faktor, bukan hanya gender;
3. memperoleh rekomendasi yang praktis;
4. memahami pentingnya desain ruang kerja yang lebih inklusif dan efisien energi.

Jawab dengan ramah, inklusif, berbasis ilmu pengetahuan, dan dalam Bahasa Indonesia. Gunakan emoji secukupnya.
Jawaban maksimal 4 paragraf singkat. Jika pertanyaan di luar topik kenyamanan termal atau ThermaFair, arahkan kembali ke topik dengan sopan.`;

  const toggleBtn     = document.getElementById('chat-toggle');
  const chatBox       = document.getElementById('chat-box');
  const closeBtn      = document.getElementById('chat-close');
  const messagesEl    = document.getElementById('chat-messages');
  const inputEl       = document.getElementById('chat-input');
  const sendBtn       = document.getElementById('chat-send');
  const badgeEl       = document.getElementById('chat-badge');
  const suggestionsEl = document.getElementById('chat-suggestions');

  if (!toggleBtn || !chatBox) return;

  let isOpen    = false;
  let isLoading = false;
  let history   = []; // Format Gemini: [{ role: 'user'|'model', parts: [{ text }] }]

  function openChat() {
    isOpen = true;
    chatBox.classList.add('open');
    chatBox.setAttribute('aria-hidden', 'false');
    badgeEl.style.display = 'none';
    inputEl.focus();
  }

  function closeChat() {
    isOpen = false;
    chatBox.classList.remove('open');
    chatBox.setAttribute('aria-hidden', 'true');
  }

  toggleBtn.addEventListener('click', function () {
    isOpen ? closeChat() : openChat();
  });

  closeBtn.addEventListener('click', closeChat);

  // Suggestion chips
  suggestionsEl.addEventListener('click', function (e) {
    const chip = e.target.closest('.suggestion-chip');
    if (!chip) return;
    inputEl.value = chip.dataset.prompt;
    suggestionsEl.style.display = 'none';
    sendMessage();
  });

  // Enter untuk kirim (Shift+Enter = newline)
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  inputEl.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  sendBtn.addEventListener('click', sendMessage);

  function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg ' + role;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = content;

    const time = document.createElement('p');
    time.className = 'msg-time';
    const now = new Date();
    time.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg ai';
    wrapper.id = 'chat-typing';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('chat-typing');
    if (el) el.remove();
  }

  function formatReply(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(76,201,240,0.1);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
      .replace(/\n/g, '<br>');
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading) return;

    appendMessage('user', text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    history.push({ role: 'user', parts: [{ text: text }] });
    inputEl.value = '';
    inputEl.style.height = 'auto';

    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: history,
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.7
          }
        })
      });

      const data = await response.json();
      removeTyping();

      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text
          ? data.candidates[0].content.parts[0].text
          : (data.error ? `⚠️ Error: ${data.error.message || data.error}` : 'Maaf, terjadi gangguan. Coba lagi ya! 🙏');

      history.push({ role: 'model', parts: [{ text: reply }] });
      appendMessage('ai', formatReply(reply));

      if (!isOpen) {
        badgeEl.style.display = 'flex';
      }

    } catch (err) {
      removeTyping();
      appendMessage('ai', '⚠️ Layanan AI tidak dapat dihubungi. Periksa koneksi dan konfigurasi Gemini di Netlify.');
      console.error('ThermaFair chatbot error:', err);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // Tampilkan badge setelah 4 detik untuk menarik perhatian
  setTimeout(function () {
    if (!isOpen) badgeEl.style.display = 'flex';
  }, 4000);
})();


// ================================================================
// JS #6 — MANAGEMENT DASHBOARD (Live Stats)
// Konsep: Fetch API, async/await, DOM manipulation, data visualization
// Fungsi: Mengambil data agregat anonim dari server dan menampilkan
//         statistik kenyamanan termal dalam bentuk dasbor visual
//         yang dapat dibaca oleh manajemen gedung.
// ================================================================
async function loadDashboard() {
  const loadingEl = document.getElementById('dashboard-loading');
  const emptyEl   = document.getElementById('dashboard-empty');
  const contentEl = document.getElementById('dashboard-content');

  if (!loadingEl || !emptyEl || !contentEl) return;

  loadingEl.style.display = 'flex';
  emptyEl.setAttribute('hidden', '');
  contentEl.setAttribute('hidden', '');

  try {
    const res = await fetch(API_ROUTES.stats);
    if (!res.ok) throw new Error('Gagal memuat statistik dasbor.');
    const data = await res.json();

    loadingEl.style.display = 'none';

    if (!data.total || data.total === 0) {
      emptyEl.removeAttribute('hidden');
      return;
    }

    contentEl.removeAttribute('hidden');

    // Ringkasan angka
    document.getElementById('dash-total').textContent     = data.total;
    document.getElementById('dash-avg-score').textContent = (data.avgScore !== null ? data.avgScore + '/100' : '—');
    document.getElementById('dash-avg-temp').textContent  = (data.avgTemp  !== null ? data.avgTemp  + '°C'  : '—');

    // Distribusi zona (bar chart)
    const zonesEl = document.getElementById('dash-zones');
    zonesEl.innerHTML = '';
    const zoneConfig = [
      { key: 'Cold Spot', label: '🥶 Cold Spot', cls: 'cold' },
      { key: 'Zona Nyaman', label: '😊 Zona Nyaman', cls: 'normal' },
      { key: 'Hot Spot', label: '🔥 Hot Spot', cls: 'hot' },
    ];

    zoneConfig.forEach(function (cfg) {
      const found = data.byZone.find(function (z) {
        return z.zone && z.zone.toLowerCase().includes(cfg.key.toLowerCase().replace(/[🥶😊🔥]/g, '').trim());
      });
      const cnt = found ? Number(found.count) : 0;
      const pct = data.total > 0 ? Math.round((cnt / data.total) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'zone-bar-row';
      row.innerHTML = `
        <span class="zone-bar-label">${cfg.label}</span>
        <div class="zone-bar-track">
          <div class="zone-bar-fill ${cfg.cls}" style="width:0%"></div>
        </div>
        <span class="zone-bar-count">${cnt} (${pct}%)</span>
      `;
      zonesEl.appendChild(row);

      // Animate bar setelah render
      requestAnimationFrame(function () {
        setTimeout(function () {
          const fill = row.querySelector('.zone-bar-fill');
          if (fill) fill.style.width = pct + '%';
        }, 80);
      });
    });

    // Kenyamanan per gender
    const genderEl = document.getElementById('dash-gender');
    genderEl.innerHTML = '';
    const genderEmoji = { perempuan: '👩', 'laki-laki': '👨', lainnya: '🧑' };
    if (data.byGender && data.byGender.length > 0) {
      data.byGender.forEach(function (g) {
        const emoji = genderEmoji[g.gender] || '🧑';
        const row = document.createElement('div');
        row.className = 'gender-row';
        row.innerHTML = `
          <span class="gender-row-name">${emoji} ${g.gender}</span>
          <span class="gender-row-stats">
            <span class="gender-score">Skor rata-rata: ${g.avgScore !== null ? Number(g.avgScore).toFixed(1) : '—'}</span>
            <span class="gender-count">${g.count} laporan</span>
          </span>
        `;
        genderEl.appendChild(row);
      });
    } else {
      genderEl.innerHTML = '<p style="color:var(--muted);font-size:14px;">Belum ada data</p>';
    }

    // Area paling tidak nyaman (terendah skornya)
    const locationEl = document.getElementById('dash-location');
    locationEl.innerHTML = '';
    const locationLabel = {
      'dekat-ac': '❄️ Dekat AC',
      'tengah': '🏢 Tengah Ruangan',
      'jauh-ac': '☀️ Jauh dari AC',
      'pinggir-jendela': '🌆 Pinggir Jendela'
    };
    if (data.byLocation && data.byLocation.length > 0) {
      data.byLocation.forEach(function (loc) {
        const score = loc.avgScore !== null ? Number(loc.avgScore) : 100;
        const cls = score < 60 ? 'score-low' : score < 80 ? 'score-medium' : 'score-high';
        const row = document.createElement('div');
        row.className = 'location-row ' + cls;
        row.innerHTML = `
          <span class="location-row-name">${locationLabel[loc.location] || loc.location}</span>
          <span class="location-row-score">Skor: ${score.toFixed(1)} (${loc.count} laporan)</span>
        `;
        locationEl.appendChild(row);
      });
    } else {
      locationEl.innerHTML = '<p style="color:var(--muted);font-size:14px;">Belum ada data</p>';
    }

    // Kondisi yang dilaporkan
    const condEl = document.getElementById('dash-conditions');
    condEl.innerHTML = '';
    const condConfig = [
      { key: 'sangat-dingin', emoji: '🥶', label: 'Sangat Dingin' },
      { key: 'dingin',        emoji: '😨', label: 'Kedinginan' },
      { key: 'nyaman',        emoji: '😊', label: 'Nyaman' },
      { key: 'panas',         emoji: '🥵', label: 'Kepanasan' },
      { key: 'sangat-panas',  emoji: '🔥', label: 'Sangat Panas' },
    ];
    condConfig.forEach(function (cfg) {
      const found = data.byCondition.find(function (c) { return c.condition === cfg.key; });
      const cnt = found ? Number(found.count) : 0;
      const pill = document.createElement('div');
      pill.className = 'condition-pill';
      pill.innerHTML = `
        <span class="cond-emoji">${cfg.emoji}</span>
        <span class="cond-label">${cfg.label}</span>
        <span class="cond-count">${cnt}</span>
      `;
      condEl.appendChild(pill);
    });

    // Rekomendasi otomatis berdasarkan data
    const recEl  = document.getElementById('dash-recommendation');
    const recText = document.getElementById('dash-rec-text');
    if (recEl && recText && data.total >= 1) {
      const coldZone = data.byZone.find(function (z) { return z.zone && z.zone.includes('Cold'); });
      const coldCount = coldZone ? Number(coldZone.count) : 0;
      const coldPct = data.total > 0 ? Math.round((coldCount / data.total) * 100) : 0;

      let rec = '';
      if (coldPct >= 50) {
        rec = `⚠️ ${coldPct}% karyawan melaporkan berada di zona terlalu dingin (Cold Spot). ` +
              `Disarankan menaikkan suhu AC sebesar 1–2°C di area-area teridentifikasi sebagai cold spot. ` +
              `Pertimbangkan juga penambahan zona kontrol suhu individual di workstation yang berdekatan dengan ventilasi AC.`;
      } else if (data.avgScore !== null && data.avgScore < 70) {
        rec = `Rata-rata skor kenyamanan ${data.avgScore}/100 menunjukkan masih banyak karyawan yang belum nyaman. ` +
              `Lakukan audit suhu di area-area dengan skor terendah dan pertimbangkan pengaturan zona yang lebih inklusif.`;
      } else {
        rec = `Kondisi termal kantor secara keseluruhan dalam kategori dapat diterima (skor rata-rata: ${data.avgScore}/100). ` +
              `Tetap pantau area cold spot dan pastikan karyawan dapat menyesuaikan pakaian kerja sesuai kebutuhan termal masing-masing.`;
      }
      recText.textContent = rec;
      recEl.removeAttribute('hidden');
    }

  } catch (err) {
    loadingEl.style.display = 'none';
    emptyEl.removeAttribute('hidden');
    emptyEl.querySelector('h3').textContent = 'Gagal memuat data';
    emptyEl.querySelector('p').textContent  = 'Layanan dasbor Netlify tidak dapat dihubungi. Coba muat ulang halaman.';
    console.error('Dashboard load error:', err);
  }
}

// Muat dashboard saat halaman pertama kali dibuka
loadDashboard();
