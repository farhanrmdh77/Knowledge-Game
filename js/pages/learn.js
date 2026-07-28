// File: js/pages/learn.js
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// === DATABASE 9 MATA PELAJARAN (Total 4 Stage termasuk EPIC) ===
const subjectsData = [
    { id: "mathematics", title: "Mathematics", icon: "calculate", color: "#00B0FF" },
    { id: "science", title: "Science", icon: "science", color: "#00C853" },
    { id: "technology", title: "Technology", icon: "computer", color: "#E040FB" },
    { id: "history", title: "History", icon: "history_edu", color: "#FF9100" },
    { id: "english", title: "English", icon: "language", color: "#7986CB" },
    { id: "indonesian", title: "Bahasa Indonesia", icon: "menu_book", color: "#EF5350" },
    { id: "arabic", title: "Bahasa Arab", icon: "translate", color: "#26A69A" },
    { id: "ips", title: "Ilmu Sosial", icon: "public", color: "#BCAAA4" },
    { id: "ipa", title: "Ilmu Alam", icon: "biotech", color: "#66BB6A" }
];

let globalUserProgress = {};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // ========================================================
        // 1. SISTEM ANTI-BOCOR LOKAL
        // ========================================================
        const cachedUid = localStorage.getItem('activeUid');
        globalUserProgress = JSON.parse(localStorage.getItem('userProgress')) || {};

        if (cachedUid !== user.uid) {
            globalUserProgress = {}; 
            localStorage.setItem('activeUid', user.uid);
            localStorage.setItem('userProgress', JSON.stringify(globalUserProgress));
        }

        // ========================================================
        // 2. SINKRONISASI & SISTEM AUTO-HEALING DARI FIRESTORE
        // ========================================================
        try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
                const userData = snap.data();
                const dbSubjects = userData.subjects || {};
                
                for (const subj in dbSubjects) {
                    if (!globalUserProgress[subj]) globalUserProgress[subj] = { completed: 0, totalXp: 0 };
                    
                    // Tarik XP Asli
                    let currentXp = parseInt(dbSubjects[subj].xp, 10) || 0;
                    globalUserProgress[subj].totalXp = currentXp;
                    
                    // Tarik level completed yang ada di DB
                    let dbCompleted = parseInt(dbSubjects[subj].completed, 10);
                    
                    // 🔥 SISTEM AUTO-HEALING (Solusi Bug 0%) 🔥
                    // Karena di kuis XP=0 jika gagal, maka jika XP > 0, pemain PASTI sudah lulus minimal stage 1!
                    if (isNaN(dbCompleted) || (dbCompleted === 0 && currentXp > 0)) {
                        if (currentXp >= 5000) dbCompleted = 3;         // Lulus sampai Hard
                        else if (currentXp >= 3000) dbCompleted = 2;    // Lulus sampai Medium
                        else if (currentXp > 0) dbCompleted = 1;        // Lulus Stage 1
                        else dbCompleted = 0;
                    }
                    
                    // Kunci batas maksimal agar tidak tembus dari 4 Stage
                    globalUserProgress[subj].completed = dbCompleted > 4 ? 4 : dbCompleted; 
                }
                localStorage.setItem('userProgress', JSON.stringify(globalUserProgress));
            }
        } catch (error) {
            console.error("Gagal sinkronisasi data dari Firestore:", error);
        }

        // ========================================================
        // 3. Render Kartu Dinamis & Aktifkan Fitur Search
        // ========================================================
        renderSubjects(globalUserProgress);
        setupSearch();
    });
});

// ========================================================
// FUNGSI RENDER DINAMIS (Desain Vertikal Premium)
// ========================================================
function renderSubjects(progressData, searchTerm = "") {
    const container = document.getElementById('subjects-container');
    if (!container) return;
    
    // Hapus animasi loading spinner
    container.innerHTML = ''; 

    const filteredSubjects = subjectsData.filter(sub => 
        sub.title.toLowerCase().includes(searchTerm)
    );

    if (filteredSubjects.length === 0) {
        container.innerHTML = `
            <div id="empty-search-state" class="text-center py-10 animate-pop">
                <span class="material-symbols-outlined text-4xl text-textDim mb-2">search_off</span>
                <p class="text-textDim font-bold">No subjects found.</p>
            </div>
        `;
        return;
    }

    filteredSubjects.forEach((sub, index) => {
        const myProgress = progressData[sub.id] || { completed: 0, totalXp: 0 };
        
        let completedCount = parseInt(myProgress.completed, 10) || 0;
        const xp = parseInt(myProgress.totalXp, 10) || 0;
        
        const TOTAL_STAGES = 4; // Mengakomodasi Epic Boss Stage
        
        if (completedCount > TOTAL_STAGES) completedCount = TOTAL_STAGES; 
        const progressPercent = Math.round((completedCount / TOTAL_STAGES) * 100);
        
        const card = document.createElement('a');
        card.href = `subject.html?id=${sub.id}`;
        card.className = "block bg-card p-6 rounded-[28px] border border-white/5 hover:border-white/20 active:scale-95 transition-all relative overflow-hidden animate-pop subject-card mb-5 shadow-lg";
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <div class="flex flex-col relative z-10">
                <div class="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 shadow-lg" style="background-color: ${sub.color}; box-shadow: 0 8px 20px ${sub.color}40;">
                    <span class="material-symbols-outlined icon-filled text-white text-3xl">${sub.icon}</span>
                </div>
                
                <h3 class="font-extrabold text-white text-xl subject-title mb-1">${sub.title}</h3>
                <p class="text-xs text-textDim mb-6">${completedCount} of ${TOTAL_STAGES} challenges completed</p>
                
                <div class="mb-6">
                    <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-2">
                        <span class="text-textDim">Progress</span>
                        <span style="color: ${sub.color}; font-weight: 900;">${progressPercent}%</span>
                    </div>
                    <div class="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-1000 ease-out" style="width: ${progressPercent}%; background-color: ${sub.color}; box-shadow: 0 0 10px ${sub.color}80;"></div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center border-t border-white/5 pt-5">
                    <div>
                        <p class="text-[10px] font-black text-textDim uppercase tracking-widest mb-1">Total XP</p>
                        <p class="text-sm font-extrabold text-primaryLight">${xp.toLocaleString('id-ID')} XP</p>
                    </div>
                    
                    <div class="px-6 py-3 rounded-[16px] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg" style="background: linear-gradient(135deg, ${sub.color}, #5a3cc7); box-shadow: 0 4px 15px ${sub.color}50;">
                        ${completedCount === 0 ? 'Start' : 'Continue'} <span class="material-symbols-outlined text-[16px] icon-filled">arrow_forward</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        renderSubjects(globalUserProgress, searchTerm);
    });
}