// File: js/app.js
import { loginUser, registerUser, checkAuth, renderAvatarSlider, getActiveAvatarUrl } from './services/authService.js';

let isProcessingAuth = false; 

document.addEventListener('DOMContentLoaded', () => {

    if (typeof checkAuth === 'function') {
        checkAuth((user) => {
            if (!isProcessingAuth) {
                window.location.href = 'home.html';
            }
        }, null);
    }

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

        function switchMode(toLogin) {
            isLoginMode = toLogin;
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
        }

        if (toggleModeBtn) {
            toggleModeBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                switchMode(!isLoginMode);
            });
        }

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const username = usernameInput ? usernameInput.value.trim() : '';
            
            let avatarUrl = "";
            if (typeof getActiveAvatarUrl === 'function') avatarUrl = getActiveAvatarUrl();

            if (!isLoginMode) {
                if (!username) { alert("Nama pengguna wajib diisi!"); return; }
                if (!avatarUrl || avatarUrl === "") {
                    alert("🚨 ERROR: Sistem gagal membaca avatar pilihan Anda!\n\nSolusi: Silakan REFRESH BERAT halaman ini (Tekan Ctrl + F5) lalu coba lagi.");
                    return;
                }
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Memproses...";
            isProcessingAuth = true; 

            if (isLoginMode) {
                const res = await loginUser(email, password);
                if (res.success) {
                    window.location.href = 'home.html';
                } else {
                    alert("Gagal Masuk: Cek kembali Email dan Password Anda.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Masuk";
                    isProcessingAuth = false; 
                }
            } else {
                // 🔥 KUNCI UTAMA: Simpan nama dan avatar ke Memori Darurat HP sebelum dikirim!
                localStorage.setItem('pending_username', username);
                localStorage.setItem('pending_avatar', avatarUrl);

                const res = await registerUser(email, password, username, avatarUrl);
                
                if (res.success) {
                    alert("🎉 Registrasi Berhasil!\n\nSilakan Masuk (Login) menggunakan Email dan Password yang baru saja Anda daftarkan.");
                    submitBtn.disabled = false;
                    document.getElementById('password').value = ''; 
                    switchMode(true); 
                    isProcessingAuth = false; 
                } else {
                    let errorMsg = res.error;
                    if (errorMsg.includes("weak-password")) errorMsg = "Password minimal harus 6 karakter.";
                    else if (errorMsg.includes("email-already-in-use")) errorMsg = "Email ini sudah terdaftar. Silakan login.";
                    else if (errorMsg.includes("invalid-email")) errorMsg = "Format email tidak valid.";
                    
                    alert("Gagal Daftar: " + errorMsg);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Daftar";
                    isProcessingAuth = false;
                }
            }
        });
    }
});