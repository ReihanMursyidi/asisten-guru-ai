const BASE_URL = "https://reihanmursyidi-guru-ai.hf.space";

// LOGIKA NAVIGASI
function switchTab(tabName) {
    // Ambil elemen form dan tombol
    const formRPP = document.getElementById('form-rpp');
    const formQuiz = document.getElementById('form-quiz');
    const btns = document.querySelectorAll('.tab-btn');
    
    // Reset Tampilan Hasil (Kembali ke layar sambutan saat pindah tab)
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('result-content').classList.add('hidden');

    if (tabName === 'rpp') {
        // Tampilkan Form RPP
        formRPP.classList.remove('hidden-form');
        formRPP.classList.add('active-form');
        formQuiz.classList.remove('active-form');
        formQuiz.classList.add('hidden-form');
        
        // Highlight Tombol RPP
        btns[0].classList.add('active');
        btns[1].classList.remove('active');

        updateMapel('rpp');
    } else {
        // Tampilkan Form Quiz
        formRPP.classList.remove('active-form');
        formRPP.classList.add('hidden-form');
        formQuiz.classList.remove('hidden-form');
        formQuiz.classList.add('active-form');

        // Highlight Tombol Quiz
        btns[0].classList.remove('active');
        btns[1].classList.add('active');

        updateMapel('quiz');
    }
}

// LOGIKA KELAS DINAMIS
function updateKelas(type) {
    const jenjang = document.getElementById(`${type}_jenjang`).value;
    const kelasSelect = document.getElementById(`${type}_kelas`);
    
    // Kosongkan opsi lama
    kelasSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas...</option>';
    
    if (!jenjang) {
        updateMapel(type);
        return;
    }

    // Tentukan opsi berdasarkan jenjang
    let opsi = [];
    if (jenjang === 'SD') opsi = [1, 2, 3, 4, 5, 6];
    else if (jenjang === 'SMP') opsi = [7, 8, 9];
    else if (jenjang === 'SMA') opsi = [10, 11, 12];

    // Masukkan opsi baru ke dropdown
    opsi.forEach(k => {
        const option = document.createElement('option');
        option.value = k;
        option.text = `Kelas ${k}`;
        kelasSelect.appendChild(option);
    });

    kelasSelect.onchange = () => updateMapel(type); 

    updateMapel(type);
}

// LOGIKA MAPEL DINAMIS
function updateMapel(type) {
    const jenjang = document.getElementById(`${type}_jenjang`).value;
    const kelasVal = document.getElementById(`${type}_kelas`).value;
    const mapelSelect = document.getElementById(`${type}_mapel`);
    const manualInput = document.getElementById(`${type}_mapel_manual`);
    
    mapelSelect.innerHTML = '';
    manualInput.classList.add('hidden');

    if (!jenjang || !kelasVal) {
        const placeholder = document.createElement('option');
        placeholder.text = "Pilih Jenjang & Kelas dulu...";
        placeholder.disabled = true;
        placeholder.selected = true;
        mapelSelect.appendChild(placeholder);
        return; // Berhenti, jangan load mapel db
    }

    const kelas = parseInt(kelasVal);
    let daftarMapel = [];

    if (jenjang === 'SD') {
        if (kelas <= 2) daftarMapel = MAPEL_DB.SD.LOWER;
        else if (kelas <= 4) daftarMapel = MAPEL_DB.SD.MIDDLE;
        else daftarMapel = MAPEL_DB.SD.UPPER;
    } else if (jenjang === 'SMP') {
        daftarMapel = MAPEL_DB.SMP;
    } else if (jenjang === 'SMA') {
        daftarMapel = MAPEL_DB.SMA;
    }

    // Masukkan dropdown
    if (daftarMapel) {
        const defaultOpt = document.createElement('option');
        defaultOpt.text = "Pilih Mata Pelajaran...";
        defaultOpt.value = "";
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        mapelSelect.appendChild(defaultOpt);
        
        daftarMapel.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.text = m;
            mapelSelect.appendChild(option);
        });
    }
    

    // Tambah opsi "Lainnya"
    const optLain = document.createElement('option');
    optLain.value = 'Lainnya';
    optLain.text = '--- Lainnya (Ketik Sendiri) ---';
    mapelSelect.appendChild(optLain);
}

function checkMapelLainnya(type) {
    const mapelSelect = document.getElementById(`${type}_mapel`).value;
    const manualInput = document.getElementById(`${type}_mapel_manual`);

    if (mapelSelect === 'Lainnya') {
        manualInput.classList.remove('hidden');
        manualInput.focus();
    } else {
        manualInput.classList.add('hidden');
    }
}

// FETCH API
async function sendRequest(endpoint, dataPayload) {
    // Ambil elemen-elemen UI
    const loader = document.getElementById('loading-overlay');
    const welcome = document.getElementById('welcome-screen');
    const resultContent = document.getElementById('result-content');
    const outputDiv = document.getElementById('markdown-output');
    
    const allButtons = document.querySelectorAll('.btn-submit');

    // STATE 1: MULAI LOADING
    loader.classList.remove('hidden');      // Munculkan loading
    welcome.classList.add('hidden');        // Sembunyikan welcome
    resultContent.classList.add('hidden');  // Sembunyikan hasil lama

    // Matikan tombol agar tidak di-spam klik
    allButtons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    });

    try {
        // Kirim data ke Backend
        const response = await fetch(`${BASE_URL}/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataPayload)
        });
        const result = await response.json();

        if (result.status === 'success') {
            // STATE 2: SUKSES
            resultContent.classList.remove('hidden');
            // Konversi Markdown ke HTML
            outputDiv.innerHTML = marked.parse(result.data);
        } else {
            // STATE 3: ERROR DARI BACKEND
            alert("Terjadi kesalahan: " + result.detail);
        }
    } catch (error) {
        // STATE 4: ERROR KONEKSI
        alert("Gagal terhubung ke server. Pastikan internet lancar atau backend aktif.");
        console.error(error);
    } finally {
        // STATE 5: SELESAI (Apapun yang terjadi)
        loader.classList.add('hidden');

        // Hidupkan tombol kembali
        allButtons.forEach(btn => {
            btn.disabled = false;
            
            // Kembalikan teks tombol sesuai jenisnya
            if(btn.classList.contains('btn-purple')) {
                btn.innerHTML = '<i class="fa-solid fa-puzzle-piece"></i> Buat Soal Otomatis';
            } else {
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Buat Modul Ajar';
            }
        });
    }
}

// TRIGGER TOMBOL GENERATE RPP
function generateRPP() {
    // Ambil Mapel (Cek apakah user pilih dropdown biasa atau manual)
    let mapelFinal = document.getElementById('rpp_mapel').value;
    
    if (mapelFinal === 'Lainnya') {
        mapelFinal = document.getElementById('rpp_mapel_manual').value;
    }

    const data = {
        jenjang: document.getElementById('rpp_jenjang').value,
        kelas: "Kelas " + document.getElementById('rpp_kelas').value,
        mapel: mapelFinal,
        materi: document.getElementById('rpp_materi').value,
        capaian: document.getElementById('rpp_capaian').value,
        durasi: document.getElementById('rpp_durasi').value
    };

    // Validasi
    if(!data.materi && !mapelFinal) {
        alert("Mohon isi Materi Pembelajaran dan Mapel terlebih dahulu!");
        return;
    } else if (!data.materi) {
        alert("Mohon isi Materi Pembelajaran terlebih dahulu!");
        return;
    } else if (!mapelFinal) {
        alert("Mohon isi Mata Pelajaran terlebih dahulu!");
        return;
    }
    
    // Ubah judul hasil & Panggil API
    document.getElementById('result-title').innerHTML = `<i class="fa-solid fa-book-open text-blue"></i> Modul Ajar (${data.mapel})`;
    sendRequest('generate-rpp', data);
}

// TRIGGER TOMBOL GENERATE QUIZ
function generateQuiz() {
    let mapelFinal = document.getElementById('quiz_mapel').value;
    if (mapelFinal === 'Lainnya') {
        mapelFinal = document.getElementById('quiz_mapel_manual').value;
    }

    const topikInput = document.getElementById('quiz_topik').value;
    const topikLengkap = `${mapelFinal}: ${topikInput}`;

    const data = {
        jenjang: document.getElementById('quiz_jenjang').value,
        kelas: "Kelas " + document.getElementById('quiz_kelas').value,
        topik: topikLengkap,
        jumlah_soal: parseInt(document.getElementById('quiz_jumlah').value),
        jenis_soal: document.getElementById('quiz_jenis').value,
        kesulitan: document.getElementById('quiz_kesulitan').value
    };
    
    if(!topikInput || !mapelFinal) {
        alert("Mohon pilih Mapel dan isi Topik Soal!");
        return;
    }

    document.getElementById('result-title').innerHTML = `<i class="fa-solid fa-list-check text-blue"></i> Soal Kuis (${mapelFinal})`;
    sendRequest('generate-quiz', data);
}

// FITUR COPY TEXT
function copyToClipboard() {
    const text = document.getElementById('markdown-output').innerText;
    navigator.clipboard.writeText(text).then(() => alert("Teks berhasil disalin!"));
}

// --- INISIALISASI SAAT LOAD ---
// Isi dropdown kelas saat halaman pertama kali dibuka
setTimeout(() => {
    updateKelas('rpp');
    updateKelas('quiz');
}, 100);