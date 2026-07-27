// File: js/pages/settings.js
import { auth } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifikasi Keamanan (Pastikan hanya user login yang bisa masuk)
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // 2. Hubungkan Elemen UI (Checkbox Toggle)
    const toggleSound = document.getElementById('toggle-sound');
    const toggleMusic = document.getElementById('toggle-music');
    
    // 3. Muat Preferensi Awal dari localStorage (Memori Browser)
    // Jika tidak ada data sebelumnya, default: Sound ON, Music OFF
    let savedSettings = JSON.parse(localStorage.getItem('appSettings')) || {
        sound: true,
        music: false
    };
    
    // Setel tampilan tombol toggle sesuai dengan memori
    if (toggleSound) toggleSound.checked = savedSettings.sound;
    if (toggleMusic) toggleMusic.checked = savedSettings.music;
    
    // 4. Logika Perubahan Sound Effects (Efek Suara Klik)
    if (toggleSound) {
        toggleSound.addEventListener('change', (e) => {
            savedSettings.sound = e.target.checked;
            localStorage.setItem('appSettings', JSON.stringify(savedSettings));
            
            // Beri tahu sistem Audio Manager bahwa ada perubahan pengaturan
            if (window.audioManager) window.audioManager.updateSettings(savedSettings);
        });
    }
    
    // 5. Logika Perubahan Background Music (Musik Latar)
    if (toggleMusic) {
        toggleMusic.addEventListener('change', (e) => {
            savedSettings.music = e.target.checked;
            localStorage.setItem('appSettings', JSON.stringify(savedSettings));
            
            // Beri tahu sistem Audio Manager untuk memutar/menghentikan musik
            if (window.audioManager) window.audioManager.updateSettings(savedSettings);
        });
    }

    // 6. Navigasi Halaman About (TOS & Privacy Policy)
    const menuTos = document.getElementById('menu-tos');
    const menuPrivacy = document.getElementById('menu-privacy');

    if (menuTos) {
        menuTos.addEventListener('click', () => { window.location.href = 'tos.html'; });
    }
    
    if (menuPrivacy) {
        menuPrivacy.addEventListener('click', () => { window.location.href = 'privacy.html'; });
    }
});