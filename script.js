const BASE_URL = "https://reihanmursyidi-guru-ai.hf.space";

let authToken = localStorage.getItem('eduplan_token'); 

function toggleAuthModal(show) {
    const modal = document.getElementById('auth-modal');
    if(show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function switchAuthMode(mode) {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    formLogin.classList.remove('form-animate');
    formRegister.classList.remove('form-animate');

    if (mode === 'login') {
        formLogin.classList.remove('hidden');
        void formLogin.offsetWidth; // TRICK: Force browser 'reflow' agar animasi restart mulus
        formLogin.classList.add('form-animate'); // Jalankan animasi
        
        // Sembunyikan Register
        formRegister.classList.add('hidden');
        
        // Update Tab Active
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        // Tampilkan Register
        formRegister.classList.remove('hidden');
        void formRegister.offsetWidth; // TRICK: Force browser 'reflow'
        formRegister.classList.add('form-animate'); // Jalankan animasi
        
        // Sembunyikan Login
        formLogin.classList.add('hidden');
        
        // Update Tab Active
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

// --- FUNGSI TOMBOL "MULAI SEKARANG" ---
function handleStartAction() {
    // 1. Cek apakah user punya token?
    const token = localStorage.getItem('eduplan_token');
    
    if (token) {
        // JIKA SUDAH LOGIN: Langsung masuk ke Dashboard
        window.location.href = 'app.html';
    } else {
        // JIKA BELUM LOGIN: Buka Modal
        toggleAuthModal(true);
        
        // Tips UX: Karena tombolnya "Mulai Sekarang" (bukan "Masuk"), 
        // biasanya lebih cocok diarahkan langsung ke tab "Daftar" (Register).
        switchAuthMode('register'); 
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login_email').value;
    const password = document.getElementById('login_password').value;
    const btn = event.target.querySelector('button');
    
    btn.innerHTML = 'Masuk...'; btn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        
        if(response.ok) {
            authToken = result.access_token;
            localStorage.setItem('eduplan_token', authToken);
            localStorage.setItem('eduplan_user', JSON.stringify(result.user_info));
            updateUserUI(result.user_info);
            toggleAuthModal(false);
            alert("Login Berhasil!");
        } else {
            alert("Gagal: " + result.detail);
        }
    } catch (err) { alert("Error koneksi server."); } 
    finally { btn.innerHTML = 'Masuk'; btn.disabled = false; }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg_name').value;
    const email = document.getElementById('reg_email').value;
    const password = document.getElementById('reg_password').value;
    const btn = event.target.querySelector('button');

    btn.innerHTML = 'Mendaftar...'; btn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: name, email, password })
        });
        const result = await response.json();
        if(response.ok) {
            alert("Registrasi Berhasil! Silakan Login.");
            switchAuthMode('login');
        } else {
            alert("Gagal: " + result.detail);
        }
    } catch (err) { alert("Error koneksi."); } 
    finally { btn.innerHTML = 'Daftar Sekarang'; btn.disabled = false; }
}

function handleLogout() {
    if(confirm("Yakin ingin keluar?")) {
        localStorage.removeItem('eduplan_token');
        localStorage.removeItem('eduplan_user');
        authToken = null;
        updateUserUI(null);
    }
}

function updateUserUI(userData) {
    // --- LOGIKA HALAMAN APLIKASI (app.html) ---
    const appGuest = document.getElementById('guest-view');
    const appUser = document.getElementById('user-view');
    
    // Cek dulu: Apakah kita sedang di app.html? (Elemennya ada gak?)
    if (appGuest && appUser) {
        if (userData) {
            appGuest.classList.add('hidden');
            appUser.classList.remove('hidden'); 
            appUser.style.display = 'block';
            
            document.getElementById('display-name').innerText = userData.full_name;
            document.getElementById('display-coins').innerText = userData.coins;
            
            const initial = userData.full_name.charAt(0).toUpperCase();
            const avatarEl = document.getElementById('user-avatar');
            if(avatarEl) avatarEl.innerText = initial;
        } else {
            appGuest.classList.remove('hidden');
            appUser.classList.add('hidden'); 
            appUser.style.display = 'none';
        }
    }

    // --- LOGIKA HALAMAN LANDING (index.html) ---
    const navGuest = document.getElementById('nav-guest');
    const navUser = document.getElementById('nav-user');
    
    // Cek dulu: Apakah kita sedang di index.html?
    if (navGuest && navUser) {
        if (userData) {
            // Sembunyikan tombol Login, Munculkan Profil
            navGuest.classList.add('hidden');
            navUser.classList.remove('hidden');
            
            // Update Nama di Navbar
            const navName = document.getElementById('nav-username');
            if(navName) navName.innerText = userData.full_name.split(' ')[0]; // Ambil nama depan saja
            
            // Update Avatar Navbar
            const navAvatar = document.getElementById('nav-avatar');
            if(navAvatar) navAvatar.innerText = userData.full_name.charAt(0).toUpperCase();
            
        } else {
            // Kembali ke tampilan tamu
            navGuest.classList.remove('hidden');
            navUser.classList.add('hidden');
        }
    }
}

function checkSession() {
    const savedToken = localStorage.getItem('eduplan_token');
    const savedUser = localStorage.getItem('eduplan_user');
    if(savedToken && savedUser) {
        // authToken = savedToken;
        try {
            const userData = JSON.parse(savedUser);
            
            // Update Tampilan UI (Navbar/Sidebar/Avatar)
            updateUserUI(userData);
            
            console.log("Session restored for:", userData.full_name);
        } catch (e) {
            console.error("Gagal restore session:", e);
            // Jika data rusak, paksa logout biar aman
            handleLogout(); 
        }
    } else {
        // Jika tidak ada data, pastikan UI dalam mode Guest
        updateUserUI(null);
    }
}

// LOGIKA NAVIGASI
function switchTab(tabName) {
    // Ambil elemen form dan tombol
    const formRPP = document.getElementById('form-rpp');
    const formQuiz = document.getElementById('form-quiz');
    const formRapor = document.getElementById('form-rapor');
    const btns = document.querySelectorAll('.tab-btn');

    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('result-content').classList.add('hidden');
    
    // Reset Tampilan Hasil (Kembali ke layar sambutan saat pindah tab)
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('result-content').classList.add('hidden');

    [formRPP, formQuiz, formRapor].forEach(f => {
        f.classList.add('hidden-form'); f.classList.remove('active-form');
    });
    btns.forEach(b => b.classList.remove('active'));

    if (tabName === 'rpp') {
        // Tampilkan Form RPP
        formRPP.classList.remove('hidden-form');
        formRPP.classList.add('active-form');
    
        // Highlight Tombol RPP
        btns[0].classList.add('active');
        updateMapel('rpp');
    } else if (tabName === 'quiz') {
        // Tampilkan Form Quiz
        formQuiz.classList.remove('hidden-form');
        formQuiz.classList.add('active-form');

        // Highlight Tombol Quiz
        btns[1].classList.add('active');
        updateMapel('quiz');
    } else if (tabName === 'rapor') {
        formRapor.classList.remove('hidden-form');
        formRapor.classList.add('active-form');
        btns[2].classList.add('active');
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

    // Matikan tombol
    allButtons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    });

    const token = localStorage.getItem('eduplan_token');

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(dataPayload)
        });
        const result = await response.json();

        if (response.ok) {
            resultContent.classList.remove('hidden');
            outputDiv.innerHTML = marked.parse(result.data);

            // UPDATE KOIN JIKA ADA
            if (result.meta && result.meta.remaining_coins !== undefined) {
                const userSpan = document.getElementById('display-coins');
                if (userSpan) userSpan.innerText = result.meta.remaining_coins;
                
                let currentUser = JSON.parse(localStorage.getItem('eduplan_user'));
                currentUser.coins = result.meta.remaining_coins;
                localStorage.setItem('eduplan_user', JSON.stringify(currentUser));
            }

        } else {
            alert("Gagal: " + result.detail); // Tampilkan pesan error dari backend (misal: Koin kurang)
        }
    } catch (error) {
        alert("Gagal terhubung ke server.");
        console.error(error);
    } finally {
        loader.classList.add('hidden');
        // Matikan tombol agar tidak di-spam klik
        allButtons.forEach(btn => {
            btn.disabled = false;
            if(btn.classList.contains('btn-purple')) btn.innerHTML = '<i class="fa-solid fa-feather"></i> Buat Sekarang';
            else btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
        });
    }
}

// TRIGGER TOMBOL GENERATE RPP
function generateRPP() {
    if (!checkLoginRequirement()) return;

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
    if(!data.materi || !mapelFinal) { alert("Lengkapi data!"); return; }
    
    // Ubah judul hasil & Panggil API
    document.getElementById('result-title').innerHTML = `<i class="fa-solid fa-book-open text-blue"></i> Modul Ajar (${data.mapel})`;
    sendRequest('generate-rpp', data);
}

// TRIGGER TOMBOL GENERATE QUIZ
function generateQuiz() {
    if (!checkLoginRequirement()) return;

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

function generateRapor() {
    if (!checkLoginRequirement()) return;

    const nama = document.getElementById('rapor_nama').value;
    const kelas = document.getElementById('rapor_kelas').value;
    let nilaiRaw = document.getElementById('rapor_nilai').value;
    const sikap = document.getElementById('rapor_sikap').value;
    const catatan = document.getElementById('rapor_catatan').value;

    if (!nama || !nilaiRaw) {
        alert("Mohon isi Nama Siswa dan Nilai Rata-rata!");
        return;
    }

    const nilaiFinal = parseFloat(nilaiRaw.replace(',', '.'));

    if (isNaN(nilaiFinal)) {
        alert("Nilai harus berupa angka!");
        return;
    }

    const data = {
        nama_siswa: nama,
        kelas: kelas,
        nilai_rata: nilaiFinal,
        sikap: sikap,
        catatan_guru: catatan
    };

    document.getElementById('result-title').innerHTML = `<i class="fa-solid fa-pen-nib text-blue"></i> Catatan Rapor (${nama})`;

    sendRequest('generate-rapor', data);
}

// TOGGLE DROPDOWN HISTORY
function toggleHistoryDropdown() {
    const dropdown = document.getElementById('history-dropdown');
    const arrow = document.getElementById('history-arrow');
    
    // Toggle Class Hidden
    dropdown.classList.toggle('hidden');
    
    // Toggle Animasi Panah
    arrow.classList.toggle('rotate-180');

    // Jika dropdown dibuka, langsung muat data
    if (!dropdown.classList.contains('hidden')) {
        dropdown.classList.add('dropdown-animate'); // Efek animasi
        loadHistoryDataDropdown(); // Panggil fungsi load data
    }
}

// Tutup dropdown jika klik di luar area
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('history-dropdown');
    const button = event.target.closest('button'); // Cek apakah yang diklik itu tombol history
    
    // Jika yang diklik BUKAN dropdown DAN BUKAN tombol pemicunya
    if (!event.target.closest('#history-dropdown') && (!button || !button.contains(document.getElementById('history-arrow')))) {
        if(dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
            const arrow = document.getElementById('history-arrow');
            if(arrow) arrow.classList.remove('rotate-180');
        }
    }
});

// LOAD DATA KE DROPDOWN
async function loadHistoryDataDropdown() {
    const listContainer = document.getElementById('history-list-dropdown');
    const token = localStorage.getItem('eduplan_token');

    if (!token) {
        listContainer.innerHTML = '<p class="text-xs text-center py-2 text-red-400">Login diperlukan.</p>';
        return;
    }

    listContainer.innerHTML = '<p class="text-xs text-center py-4 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat...</p>';

    try {
        const response = await fetch(`${BASE_URL}/api/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            let html = '';
            result.data.forEach(item => {
                // Ikon beda tiap tipe
                let iconClass = 'fa-file-lines text-blue-400';
                if(item.type === 'quiz') iconClass = 'fa-list-check text-purple-400';
                if(item.type === 'rapor') iconClass = 'fa-pen-nib text-green-400';

                html += `
                <div onclick="restoreHistory('${encodeURIComponent(item.title)}', '${encodeURIComponent(item.content)}')" 
                     class="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 cursor-pointer transition border border-transparent hover:border-slate-600">
                    
                    <div class="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-600 transition">
                        <i class="fa-solid ${iconClass} text-xs"></i>
                    </div>
                    
                    <div class="overflow-hidden">
                        <p class="text-xs font-medium text-gray-300 group-hover:text-white truncate">${item.title}</p>
                        <p class="text-[10px] text-gray-500 group-hover:text-gray-400">${item.date_display}</p>
                    </div>
                </div>
                `;
            });
            listContainer.innerHTML = html;
        } else {
            listContainer.innerHTML = '<p class="text-xs text-center py-4 text-gray-500">Belum ada riwayat.</p>';
        }
    } catch (e) {
        console.error(e);
        listContainer.innerHTML = '<p class="text-xs text-center py-2 text-red-400">Gagal memuat.</p>';
    }
}

// FUNGSI SAAT ITEM DIKLIK
function restoreHistory(encodedTitle, encodedContent) {
    const title = decodeURIComponent(encodedTitle);
    const content = decodeURIComponent(encodedContent);

    // 1. Tampilkan Judul & Konten
    document.getElementById('result-title').innerText = title;
    document.getElementById('markdown-output').innerHTML = marked.parse(content);

    // 2. Tutup Dropdown otomatis
    toggleHistoryDropdown();
}

// --- FUNGSI BUKA HISTORY DARI WELCOME SCREEN ---
function openHistoryMode() {
    // 1. Ambil Elemen
    const welcome = document.getElementById('welcome-screen');
    const resultContent = document.getElementById('result-content');
    
    // 2. Cek Login Dulu
    const token = localStorage.getItem('eduplan_token');
    if (!token) {
        toggleAuthModal(true);
        return;
    }

    // 3. Switch Tampilan
    if(welcome) welcome.classList.add('hidden');
    if(resultContent) resultContent.classList.remove('hidden');

    // 4. Reset Tampilan Result Panel (Kosongkan isinya dulu biar rapi)
    document.getElementById('result-title').innerText = "Riwayat Generate";
    document.getElementById('markdown-output').innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-gray-500">
            <i class="fa-solid fa-arrow-up text-2xl mb-2 animate-bounce"></i>
            <p>Pilih salah satu riwayat di atas untuk menampilkannya kembali.</p>
        </div>
    `;

    // 5. Buka Dropdown Otomatis
    toggleHistoryDropdown();
}

// FITUR COPY TEXT
function copyToClipboard() {
    const text = document.getElementById('markdown-output').innerText;
    navigator.clipboard.writeText(text).then(() => alert("Teks berhasil disalin!"));
}

// --- INISIALISASI SAAT LOAD ---
// Isi dropdown kelas saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', () => {
    checkSession(); 

    const jenjangSelect = document.getElementById('rpp_jenjang');
    if (jenjangSelect) {
        updateKelas('rpp');
        updateKelas('quiz');
    }
    
    // 3. Log untuk memastikan script jalan
    console.log("EduPlan AI Ready 🚀");
    
});
