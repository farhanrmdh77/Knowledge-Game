// File: js/app.js

// (KITA HAPUS IMPORT THEMEMANAGER KARENA MENYEBABKAN ERROR 404)

// Import Fungsi Auth dari Firebase Service Anda
import { loginUser, registerUser, checkAuth } from './services/authService.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Cek status login, jika sudah masuk, arahkan otomatis ke home.html
    if (typeof checkAuth === 'function') {
        checkAuth((user) => {
            window.location.href = 'home.html';
        }, null);
    }

    // ==========================================
    // LOGIKA HALAMAN LOGIN & REGISTER
    // ==========================================
    const authForm = document.getElementById('auth-form');

    // Pastikan skrip ini hanya berjalan jika ada elemen auth-form (sedang di halaman login.html)
    if (authForm) {
        let isLoginMode = true;
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const usernameField = document.getElementById('username-field');
        const avatarField = document.getElementById('avatar-field');
        const submitBtn = document.getElementById('submit-btn');
        const toggleText = document.getElementById('toggle-text');
        const toggleModeBtn = document.getElementById('toggle-mode');
        const usernameInput = document.getElementById('username');

        // Elemen Avatar
        const avatarOptions = document.querySelectorAll('.avatar-option');
        const avatarInput = document.getElementById('input-avatar-url');
        const avatarError = document.getElementById('avatar-error');

        // A. Logika Interaksi Pilih Avatar
        if (avatarOptions.length > 0) {
            avatarOptions.forEach(opt => {
                opt.addEventListener('click', () => {
                    // Hapus highlight dari semua avatar
                    avatarOptions.forEach(a => {
                        a.classList.remove('border-[#2edcd7]', 'opacity-100', 'scale-110');
                        a.classList.add('border-transparent', 'opacity-50');
                    });
                    // Tambahkan highlight dan animasi ke avatar yang diklik
                    opt.classList.remove('border-transparent', 'opacity-50');
                    opt.classList.add('border-[#2edcd7]', 'opacity-100', 'scale-110');
                    
                    // Simpan URL avatar
                    avatarInput.value = opt.getAttribute('data-url');
                    avatarError.classList.add('hidden');
                });
            });
        }

        // B. Logika Toggle antara Login dan Register
        if (toggleModeBtn) {
            toggleModeBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Mencegah browser refresh saat tombol diklik
                isLoginMode = !isLoginMode;
                
                if (isLoginMode) {
                    formTitle.textContent = "Selamat Datang";
                    formSubtitle.textContent = "Masuk untuk melanjutkan permainan";
                    usernameField.classList.add('hidden');
                    avatarField.classList.add('hidden'); 
                    if (usernameInput) usernameInput.removeAttribute('required'); // Hapus wajib isi
                    submitBtn.textContent = "Masuk";
                    toggleText.textContent = "Belum punya akun?";
                    toggleModeBtn.textContent = "Daftar sekarang";
                } else {
                    formTitle.textContent = "Buat Akun Baru";
                    formSubtitle.textContent = "Bergabunglah dengan kelompok belajar Anda";
                    usernameField.classList.remove('hidden');
                    avatarField.classList.remove('hidden'); 
                    if (usernameInput) usernameInput.setAttribute('required', 'true'); // Wajib isi username
                    submitBtn.textContent = "Daftar";
                    toggleText.textContent = "Sudah punya akun?";
                    toggleModeBtn.textContent = "Masuk di sini";
                }
            });
        }

        // C. Eksekusi Submit Form (Kirim ke Firebase)
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Cegah halaman refresh
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const username = usernameInput ? usernameInput.value.trim() : '';
            const avatarUrl = avatarInput ? avatarInput.value : '';

            // Validasi khusus untuk Mode Daftar
            if (!isLoginMode) {
                if (!username) {
                    alert("Nama pengguna wajib diisi!");
                    return;
                }
                if (!avatarUrl) {
                    avatarError.classList.remove('hidden');
                    return;
                }
            }

            // Kunci tombol agar tidak diklik dua kali
            submitBtn.disabled = true;
            submitBtn.textContent = "Memproses...";

            if (isLoginMode) {
                // Proses Login
                const res = await loginUser(email, password);
                if (res.success) {
                    window.location.href = 'home.html';
                } else {
                    alert("Gagal Masuk: Cek kembali Email dan Password Anda.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Masuk";
                }
            } else {
                // Proses Daftar
                const res = await registerUser(email, password, username, avatarUrl);
                if (res.success) {
                    window.location.href = 'home.html';
                } else {
                    // Terjemahkan error Firebase agar mudah dipahami
                    let errorMsg = res.error;
                    if (errorMsg.includes("weak-password")) errorMsg = "Password minimal harus 6 karakter.";
                    else if (errorMsg.includes("email-already-in-use")) errorMsg = "Email ini sudah terdaftar. Silakan login.";
                    else if (errorMsg.includes("invalid-email")) errorMsg = "Format email tidak valid.";
                    
                    alert("Gagal Daftar: " + errorMsg);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Daftar";
                }
            }
        });
    }
});