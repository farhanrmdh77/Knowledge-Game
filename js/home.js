import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // 1. Tarik Kebenaran Absolut dari Firestore Database
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const data = snap.data();
                
                // Pastikan kita mengambil field yang benar
                const realPoints = data.diamond || 0; // Diamond adalah Pts
                const realXp = data.xp || 0;
                const realName = data.username || "Pemain";
                
                // 2. Terapkan ke elemen UI di Dashboard Anda
                // (Ganti 'id-elemen-...' dengan ID yang Anda gunakan di file home.html)
                
                const pointsElement = document.getElementById('dashboard-points'); // Contoh ID Pts
                if (pointsElement) {
                    pointsElement.textContent = realPoints.toLocaleString('id-ID');
                }

                const xpElement = document.getElementById('dashboard-xp'); // Contoh ID XP
                if (xpElement) {
                    xpElement.textContent = realXp.toLocaleString('id-ID');
                }

                const nameElement = document.getElementById('dashboard-name'); // Contoh ID Nama
                if (nameElement) {
                    nameElement.textContent = realName;
                }
                
                const avatarElement = document.getElementById('dashboard-avatar'); // Contoh ID Avatar
                if (avatarElement) {
                    avatarElement.src = data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(realName)}&backgroundColor=7C5CFF`;
                }
            }
        } catch (error) {
            console.error("Gagal menyinkronkan data dashboard:", error);
        }
    });
});