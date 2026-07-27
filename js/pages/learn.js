// File: js/pages/learn.js
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // ========================================================
        // 1. SISTEM ANTI-BOCOR (KUNCI MEMORI LOKAL KE UID AKUN)
        // ========================================================
        const cachedUid = localStorage.getItem('activeUid');
        let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};

        // Jika UID berubah (berarti login pakai akun berbeda/baru), hapus memori curian!
        if (cachedUid !== user.uid) {
            userProgress = {}; 
            localStorage.setItem('activeUid', user.uid);
            localStorage.setItem('userProgress', JSON.stringify(userProgress));
        }

        // ========================================================
        // 2. SINKRONISASI DARI FIRESTORE (Akurat Lintas Perangkat)
        // ========================================================
        try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
                const userData = snap.data();
                const dbSubjects = userData.subjects || {};
                
                for (const subj in dbSubjects) {
                    if (!userProgress[subj]) userProgress[subj] = { completed: 0, totalXp: 0 };
                    
                    // Timpa XP lokal dengan kebenaran absolut dari database
                    userProgress[subj].totalXp = dbSubjects[subj].xp || 0;
                    
                    // Pulihkan level challenge jika hilang di lokal tapi XP ada di database
                    if (userProgress[subj].completed === 0 && dbSubjects[subj].xp > 0) {
                        userProgress[subj].completed = 1;
                    }
                }
                localStorage.setItem('userProgress', JSON.stringify(userProgress));
            }
        } catch (error) {
            console.error("Gagal sinkronisasi data:", error);
        }

        // 3. Render UI berdasarkan data yang sudah divalidasi
        updateProgressUI();
    });

    // 4. Fitur Pencarian Subjek Sesuai PRD
    const searchInput = document.getElementById('search-input');
    const subjectCards = document.querySelectorAll('.subject-card');
    const container = document.getElementById('subjects-container');

    const emptyState = document.createElement('div');
    emptyState.id = 'empty-search-state';
    emptyState.className = 'hidden text-center py-10';
    emptyState.innerHTML = `
        <span class="material-symbols-outlined text-4xl text-textDim mb-2">search_off</span>
        <p class="text-textDim font-bold">No subjects found.</p>
    `;
    if (container) container.appendChild(emptyState);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            let hasVisibleCard = false;

            subjectCards.forEach(card => {
                const titleEl = card.querySelector('.subject-title');
                if (!titleEl) return;
                
                const title = titleEl.textContent.toLowerCase();
                
                if (title.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.3s ease-out forwards';
                    hasVisibleCard = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if (!hasVisibleCard) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        });
    }

    // 5. Interaksi Klik Kartu (Membuka Subject Detail)
    subjectCards.forEach(card => {
        card.addEventListener('click', () => {
            const titleEl = card.querySelector('.subject-title');
            if (titleEl) {
                const subjectName = titleEl.textContent.toLowerCase().trim();
                window.location.href = `subject.html?id=${subjectName}`;
            }
        });
    });
});

// Fungsi untuk memperbarui Progress Bar & Total XP pada Kartu Learn
function updateProgressUI() {
    const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
    const subjectCards = document.querySelectorAll('.subject-card');
    const totalChallengesPerSubject = 3; // Total tantangan per subjek

    subjectCards.forEach(card => {
        const titleEl = card.querySelector('.subject-title');
        if (!titleEl) return;

        const subjectId = titleEl.textContent.toLowerCase().trim();
        const myProgress = userProgress[subjectId] || { completed: 0, totalXp: 0 };
        
        // Hitung persentase progress
        const percent = Math.round((myProgress.completed / totalChallengesPerSubject) * 100);

        // Update teks persentase (%)
        const percentText = card.querySelector('.flex.justify-between.text-xs span:nth-child(2)');
        if (percentText) percentText.textContent = `${percent}%`;

        // Update lebar progress bar
        const progressBar = card.querySelector('.w-full.h-2\\.5.bg-black\\/40 .h-full');
        if (progressBar) progressBar.style.width = `${percent}%`;

        // Update total XP
        const xpText = card.querySelector('.text-sm.font-extrabold.text-primaryLight');
        if (xpText) xpText.textContent = `${myProgress.totalXp.toLocaleString('id-ID')} XP`;

        // Update teks keterangan tantangan selesai
        const challengeText = card.querySelector('p.text-xs.text-textDim');
        if (challengeText) {
            challengeText.textContent = `${myProgress.completed} of ${totalChallengesPerSubject} challenges completed`;
        }
    });
}