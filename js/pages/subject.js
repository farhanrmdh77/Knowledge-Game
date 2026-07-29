// File: js/pages/subject.js
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// === PANGKALAN DATA ANTARMUKA PELAJARAN (4 Stage termasuk Boss) ===
const subjectData = {
    mathematics: {
        title: "Matematika", icon: "calculate", color: "#00B0FF",
        desc: "Kuasai angka dan logika untuk menyelesaikan masalah kompleks.",
        challenges: [
            { id: "math_1", title: "Aritmatika Dasar", xp: 1500, diamond: 100, req: 0 },
            { id: "math_2", title: "Aljabar & Persamaan", xp: 1500, diamond: 150, req: 1 },
            { id: "math_3", title: "Geometri & Lanjut", xp: 2000, diamond: 250, req: 2 },
            { id: "math_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    science: {
        title: "Sains Angkasa", icon: "science", color: "#00C853",
        desc: "Jelajahi keajaiban alam semesta, tata surya, dan ilmu bumi.",
        challenges: [
            { id: "sci_1", title: "Tata Surya & Bumi", xp: 1500, diamond: 100, req: 0 },
            { id: "sci_2", title: "Geologi & Bencana", xp: 1500, diamond: 150, req: 1 },
            { id: "sci_3", title: "Fisika Antariksa", xp: 2000, diamond: 250, req: 2 },
            { id: "sci_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    technology: {
        title: "Teknologi", icon: "computer", color: "#E040FB",
        desc: "Pelajari perangkat keras, perangkat lunak, dan internet.",
        challenges: [
            { id: "tech_1", title: "Dasar Komputer", xp: 1500, diamond: 100, req: 0 },
            { id: "tech_2", title: "Internet & Jaringan", xp: 1500, diamond: 150, req: 1 },
            { id: "tech_3", title: "Software & Sistem", xp: 2000, diamond: 250, req: 2 },
            { id: "tech_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    history: {
        title: "Sejarah", icon: "history_edu", color: "#FF9100",
        desc: "Jelajahi mesin waktu sejarah Nusantara hingga peradaban dunia.",
        challenges: [
            { id: "hist_1", title: "Kemerdekaan Indonesia", xp: 1500, diamond: 100, req: 0 },
            { id: "hist_2", title: "Kerajaan Nusantara", xp: 1500, diamond: 150, req: 1 },
            { id: "hist_3", title: "Perang & Dunia", xp: 2000, diamond: 250, req: 2 },
            { id: "hist_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    english: {
        title: "Bahasa Inggris", icon: "language", color: "#7986CB",
        desc: "Kuasai tata bahasa dan kosakata bahasa Inggris internasional.",
        challenges: [
            { id: "eng_1", title: "Tata Bahasa Dasar", xp: 1500, diamond: 100, req: 0 },
            { id: "eng_2", title: "Kosakata & Tenses", xp: 1500, diamond: 150, req: 1 },
            { id: "eng_3", title: "Struktur Lanjut", xp: 2000, diamond: 250, req: 2 },
            { id: "eng_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    indonesian: {
        title: "Bahasa Indonesia", icon: "menu_book", color: "#EF5350",
        desc: "Pahami struktur kalimat, EYD, dan kekayaan sastra Indonesia.",
        challenges: [
            { id: "indo_1", title: "Kata & Kalimat", xp: 1500, diamond: 100, req: 0 },
            { id: "indo_2", title: "Teks & Sastra", xp: 1500, diamond: 150, req: 1 },
            { id: "indo_3", title: "Majas & Gaya Bahasa", xp: 2000, diamond: 250, req: 2 },
            { id: "indo_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    arabic: {
        title: "Bahasa Arab", icon: "translate", color: "#26A69A",
        desc: "Pelajari kosakata dasar dan tata bahasa Arab.",
        challenges: [
            { id: "arab_1", title: "Kosakata Dasar", xp: 1500, diamond: 100, req: 0 },
            { id: "arab_2", title: "Tata Bahasa Dasar", xp: 1500, diamond: 150, req: 1 },
            { id: "arab_3", title: "Nahwu & Sharaf", xp: 2000, diamond: 250, req: 2 },
            { id: "arab_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    ips: {
        title: "Ilmu Sosial", icon: "public", color: "#BCAAA4",
        desc: "Pelajari interaksi manusia, geografi, dan sistem ekonomi.",
        challenges: [
            { id: "ips_1", title: "Geografi Dasar", xp: 1500, diamond: 100, req: 0 },
            { id: "ips_2", title: "Sosiologi & Interaksi", xp: 1500, diamond: 150, req: 1 },
            { id: "ips_3", title: "Ekonomi Makro", xp: 2000, diamond: 250, req: 2 },
            { id: "ips_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    },
    ipa: {
        title: "Ilmu Alam", icon: "biotech", color: "#66BB6A",
        desc: "Jelajahi keajaiban biologi, fisika, dan reaksi kimia alam.",
        challenges: [
            { id: "ipa_1", title: "Biologi Organisme", xp: 1500, diamond: 100, req: 0 },
            { id: "ipa_2", title: "Fisika & Lingkungan", xp: 1500, diamond: 150, req: 1 },
            { id: "ipa_3", title: "Kimia & Reaksi", xp: 2000, diamond: 250, req: 2 },
            { id: "ipa_4", title: "Ujian Akhir (Boss)", xp: 10000, diamond: 2500, req: 3 }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        await loadSubjectDetail(user.uid);
    });
});

async function loadSubjectDetail(uid) {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('id') || 'mathematics';
    const data = subjectData[subjectId];

    if (!data) {
        window.location.href = 'learn.html';
        return;
    }

    // Header UI Mapping
    document.getElementById('subject-header-title').textContent = data.title;
    document.getElementById('subject-title').textContent = data.title;
    document.querySelector('#subject-icon-container').style.backgroundColor = data.color;
    document.getElementById('subject-icon').textContent = data.icon;
    document.querySelector('p.text-xs.text-textDim.leading-relaxed').textContent = data.desc;

    // ==========================================
    // SISTEM AUTO-HEALING & ANTI-BUG TIPE DATA
    // ==========================================
    let completedCount = 0;
    let currentXp = 0;

    try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const userData = snap.data();
            const dbSubjects = userData.subjects || {};
            
            if (dbSubjects[subjectId]) {
                // Tarik angka asli, hindari string
                currentXp = Number(dbSubjects[subjectId].xp) || 0;
                let dbCompleted = Number(dbSubjects[subjectId].completed);

                // Auto-Healing: Sinkron dengan learn.js agar tidak ada gap progress
                if (isNaN(dbCompleted) || (dbCompleted === 0 && currentXp > 0)) {
                    if (currentXp >= 5000) dbCompleted = 3;
                    else if (currentXp >= 3000) dbCompleted = 2;
                    else if (currentXp > 0) dbCompleted = 1;
                    else dbCompleted = 0;
                }
                
                completedCount = dbCompleted > 4 ? 4 : dbCompleted;
            }
        }
    } catch (error) {
        console.error("Gagal mengambil progress subjek:", error);
        // Fallback jika offline/gagal
        const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
        const myProgress = userProgress[subjectId] || {};
        completedCount = Number(myProgress.completed) || 0;
        currentXp = Number(myProgress.totalXp) || 0;
    }

    // PAKSA menjadi tipe angka (Number) seutuhnya
    completedCount = Number(completedCount);

    // Update UI Persentase Total
    const progressPercent = Math.round((completedCount / data.challenges.length) * 100);
    const percentEl = document.querySelector('.text-success');
    if (percentEl) percentEl.textContent = `${progressPercent}%`;

    // Total XP max subjek
    const maxSubjectXP = data.challenges.reduce((total, ch) => total + ch.xp, 0);
    const maxXpEl = document.querySelector('.text-primary');
    if (maxXpEl) maxXpEl.textContent = maxSubjectXP.toLocaleString('id-ID');

    renderChallenges(data.challenges, completedCount, subjectId, data.color);
}

function renderChallenges(challenges, completedCount, subjectId, themeColor) {
    const container = document.getElementById('challenge-list');
    if (!container) return;
    container.innerHTML = ''; 

    challenges.forEach((ch, index) => {
        let timePerQuestion = 15; 
        let xpPerQuestion = 100;

        if (index === 1) timePerQuestion = 25; 
        if (index === 2) timePerQuestion = 30; 
        if (index === 3) { 
            timePerQuestion = 40; 
            xpPerQuestion = 500;  
        }

        const totalQuestions = ch.xp / xpPerQuestion; 
        const totalSeconds = totalQuestions * timePerQuestion; 
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const displayTime = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`;

        // 🔥 LOGIKA KUNCI ANTI-BUG TIPE DATA 🔥
        let status = 'locked';
        let idx = Number(index); // Paksa ke Number
        
        if (idx < completedCount) {
            status = 'done';
        } else if (idx === completedCount) { 
            status = 'available';
        }

        let statusBadge = '';
        let buttonUI = '';
        let opacityClass = status === 'locked' ? 'opacity-60 grayscale' : '';
        let difficultyBadge = '';

        if (idx === 0) {
            difficultyBadge = `<span class="bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">Easy</span>`;
        } else if (idx === 1) {
            difficultyBadge = `<span class="bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">Medium</span>`;
        } else if (idx === 2) {
            difficultyBadge = `<span class="bg-[#EF5350]/10 text-[#EF5350] border border-[#EF5350]/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">Hard</span>`;
        } else if (idx === 3) {
            difficultyBadge = `<span class="bg-[#D500F9]/10 text-[#D500F9] border border-[#D500F9]/30 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(213,0,249,0.3)]"><span class="material-symbols-outlined text-[10px] icon-filled">local_fire_department</span> EPIC</span>`;
        }

        if (status === 'done') {
            statusBadge = `<div class="bg-success/10 text-success px-2 py-1 rounded border border-success/20 text-[10px] font-bold uppercase flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">check_circle</span> Done</div>`;
            buttonUI = `<button onclick="startQuiz('${ch.id}', '${subjectId}', 'replay')" class="bg-card border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 active:scale-95 transition-all">Replay</button>`;
        } else if (status === 'available') {
            statusBadge = `<div class="bg-primary/10 text-primaryLight px-2 py-1 rounded border border-primary/20 text-[10px] font-bold uppercase">Available</div>`;
            buttonUI = `<button onclick="startQuiz('${ch.id}', '${subjectId}', 'start')" class="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-[0_4px_10px_rgba(124,92,255,0.4)] hover:bg-primaryLight active:scale-95 transition-all">Start</button>`;
        } else if (status === 'locked') {
            statusBadge = `<div class="bg-white/5 text-textDim px-2 py-1 rounded border border-white/10 text-[10px] font-bold uppercase flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">lock</span> Locked</div>`;
            buttonUI = `<button disabled class="bg-black/40 text-textDim px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">Locked</button>`;
        }

        const card = document.createElement('div');
        card.className = `bg-card p-4 rounded-[24px] border border-white/5 flex flex-col gap-3 ${opacityClass} transition-all`;
        
        if (idx === 3 && status !== 'locked') {
            card.classList.add('border-[#D500F9]/30', 'shadow-[0_4px_20px_rgba(213,0,249,0.1)]');
        }

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: ${idx === 3 ? '#D500F933' : themeColor + '33'}; color: ${idx === 3 ? '#D500F9' : themeColor};">
                        <span class="font-black text-sm">${idx === 3 ? '☠️' : idx + 1}</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-white">${ch.title}</h4>
                        <p class="text-[10px] text-textDim flex items-center gap-2 mt-1">
                            <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">schedule</span> ${displayTime}</span>
                            <span class="flex items-center gap-0.5 text-primaryLight"><span class="material-symbols-outlined text-[12px]">stars</span> ${ch.xp.toLocaleString('id-ID')} XP</span>
                            <span class="flex items-center gap-0.5 text-[#00E5FF]"><span class="material-symbols-outlined text-[12px] icon-filled">diamond</span> ${ch.diamond.toLocaleString('id-ID')}</span>
                        </p>
                    </div>
                </div>
                ${difficultyBadge}
            </div>
            <div class="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
                ${statusBadge}
                ${buttonUI}
            </div>
        `;
        container.appendChild(card);
    });
}

window.startQuiz = (challengeId, subjectId, mode) => {
    localStorage.setItem('quizMode', mode);
    localStorage.setItem('currentChallengeId', challengeId);
    localStorage.setItem('currentSubjectId', subjectId);
    
    document.body.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => { window.location.href = 'play.html'; }, 300);
};

const style = document.createElement('style');
style.innerHTML = `@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`;
document.head.appendChild(style);