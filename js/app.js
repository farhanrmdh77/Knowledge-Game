// File: js/app.js

// 🔥 PERHATIKAN: Kita sekarang mengimpor getActiveAvatarUrl, bukan getSelectedAvatar!
import { loginUser, registerUser, checkAuth, renderAvatarSlider, getActiveAvatarUrl } from './services/authService.js';

// KUNCI BUG FIX: Rem tangan agar tidak pindah halaman sebelum database tersimpan
let isProcessingAuth = false; 

document.addEventListener('DOMContentLoaded', () => {

    // 1. Cek status login
    if (typeof checkAuth === 'function') {
        checkAuth((user) => {
            // Hanya lempar ke home.html JIKA tidak sedang memproses form daftar/login
            if (!isProcessingAuth) {
                window.location.href = 'home.html';
            }
        }, null);
    }

    // ==========================================
    // LOGIKA HALAMAN LOGIN & REGISTER
    // ==========================================
    const authForm = document.getElementById('auth-form');

    if (authForm) {
        
        renderAvatarSlider();

        let isLoginMode = true;
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const usernameField = document.getElementById('username-field');
        const avatarField = document.getElementById('avatar-field');
        const submitBtn = document.getElementById('submit-btn');
        const toggleText = document.getElementById('toggle-text');
        const toggleModeBtn = document.getElementById('toggle-mode');
        const usernameInput = document.getElementById('username');

        // B. Logika Toggle antara Login dan Register
        if (toggleModeBtn) {
            toggleModeBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                isLoginMode = !isLoginMode;
                
                if (isLoginMode) {
                    formTitle.textContent = "Selamat Datang";
                    formSubtitle.textContent = "Masuk untuk melanjutkan permainan";
                    usernameField.classList.add('hidden');
                    avatarField.classList.add('hidden'); 
                    if (usernameInput) usernameInput.removeAttribute('required'); 
                    submitBtn.textContent = "Masuk";
                    toggleText.textContent = "Belum punya akun?";
                    toggleModeBtn.textContent = "Daftar sekarang";
                } else {
                    formTitle.textContent = "Buat Akun Baru";
                    formSubtitle.textContent = "Bergabunglah dengan kelompok belajar Anda";
                    usernameField.classList.remove('hidden');
                    avatarField.classList.remove('hidden'); 
                    if (usernameInput) usernameInput.setAttribute('required', 'true'); 
                    submitBtn.textContent = "Daftar";
                    toggleText.textContent = "Sudah punya akun?";
                    toggleModeBtn.textContent = "Masuk di sini";
                }
            });
        }

        // C. Eksekusi Submit Form
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const username = usernameInput ? usernameInput.value.trim() : '';
            
            // 🚨 AMBIL AVATAR DARI FUNGSI SAPU JAGAT DI AUTHSERVICE 🚨
            let avatarUrl = "";
            if (typeof getActiveAvatarUrl === 'function') {
                avatarUrl = getActiveAvatarUrl();
            }

            console.log("📸 URL AVATAR YANG DITANGKAP SEBELUM KE FIREBASE:", avatarUrl);

            // Validasi Khusus Pendaftaran (Daftar Akun)
            if (!isLoginMode) {
                if (!username) {
                    alert("Nama pengguna wajib diisi!");
                    return;
                }
                
                // JIKA AVATAR MASIH KOSONG, HENTIKAN PENDAFTARAN! 
                if (!avatarUrl || avatarUrl === "") {
                    alert("🚨 ERROR: Sistem gagal membaca avatar pilihan Anda!\n\nSolusi: Silakan REFRESH BERAT halaman ini (Tekan Ctrl + F5) lalu coba lagi.");
                    return;
                }
            }

            // Kunci tombol agar tidak dobel klik
            submitBtn.disabled = true;
            submitBtn.textContent = "Memproses...";

            // TARIK REM TANGAN: Jangan biarkan checkAuth memotong proses ini!
            isProcessingAuth = true; 

            if (isLoginMode) {
                const res = await loginUser(email, password);
                if (res.success) {
                    window.location.href = 'home.html';
                } else {
                    alert("Gagal Masuk: Cek kembali Email dan Password Anda.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Masuk";
                    isProcessingAuth = false; // Lepas rem
                }
            } else {
                // Proses Daftar
                const res = await registerUser(email, password, username, avatarUrl);
                if (res.success) {
                    window.location.href = 'home.html';
                } else {
                    let errorMsg = res.error;
                    if (errorMsg.includes("weak-password")) errorMsg = "Password minimal harus 6 karakter.";
                    else if (errorMsg.includes("email-already-in-use")) errorMsg = "Email ini sudah terdaftar. Silakan login.";
                    else if (errorMsg.includes("invalid-email")) errorMsg = "Format email tidak valid.";
                    
                    alert("Gagal Daftar: " + errorMsg);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Daftar";
                    isProcessingAuth = false; // Lepas rem
                }
            }
        });
    }
});