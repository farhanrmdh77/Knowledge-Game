// File: js/pages/subject.js
import { auth } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// === PANGKALAN DATA ANTARMUKA PELAJARAN ===
const subjectData = {
    mathematics: {
        title: "Mathematics", icon: "calculate", color: "#00B0FF",
        desc: "Kuasai angka dan logika untuk menyelesaikan masalah kompleks.",
        challenges: [
            { id: "math_1", title: "Aritmatika Dasar", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "math_2", title: "Aljabar & Persamaan", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "math_3", title: "Geometri & Lanjut", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    science: {
        title: "Science", icon: "science", color: "#00C853",
        desc: "Jelajahi keajaiban alam semesta, fisika, dan biologi.",
        challenges: [
            { id: "sci_1", title: "Tata Surya & Bumi", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "sci_2", title: "Biologi & Alam", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "sci_3", title: "Fisika & Kimia Dasar", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    technology: {
        title: "Technology", icon: "computer", color: "#E040FB",
        desc: "Pelajari perangkat keras, perangkat lunak, dan internet.",
        challenges: [
            { id: "tech_1", title: "Dasar Komputer", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "tech_2", title: "Internet & Jaringan", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "tech_3", title: "Software & Pemrograman", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    history: {
        title: "History", icon: "history_edu", color: "#FF9100",
        desc: "Jelajahi mesin waktu sejarah Nusantara hingga peradaban dunia.",
        challenges: [
            { id: "hist_1", title: "Kemerdekaan Indonesia", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "hist_2", title: "Kerajaan Nusantara", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "hist_3", title: "Perang Dunia", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    english: {
        title: "English", icon: "language", color: "#7986CB",
        desc: "Kuasai tata bahasa dan kosakata bahasa Inggris internasional.",
        challenges: [
            { id: "eng_1", title: "Basic Tenses", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "eng_2", title: "Vocabulary & Synonyms", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "eng_3", title: "Reading Comprehension", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    indonesian: {
        title: "Bahasa Indonesia", icon: "menu_book", color: "#EF5350",
        desc: "Pahami struktur kalimat, EYD, dan kekayaan sastra Indonesia.",
        challenges: [
            { id: "indo_1", title: "Ejaan & Tanda Baca", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "indo_2", title: "Majas & Gaya Bahasa", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "indo_3", title: "Jenis Teks", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    arabic: {
        title: "Bahasa Arab", icon: "translate", color: "#26A69A",
        desc: "Pelajari kosakata dasar dan percakapan sehari-hari bahasa Arab.",
        challenges: [
            { id: "arab_1", title: "Kosakata Dasar", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "arab_2", title: "Kata Tunjuk (Isyarah)", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "arab_3", title: "Percakapan (Hiwar)", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    ips: {
        title: "Ilmu Sosial", icon: "public", color: "#BCAAA4",
        desc: "Pelajari interaksi manusia, geografi, dan sistem ekonomi.",
        challenges: [
            { id: "ips_1", title: "Geografi Indonesia", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "ips_2", title: "Ekonomi Dasar", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "ips_3", title: "Sosiologi", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    },
    ipa: {
        title: "Ilmu Alam", icon: "biotech", color: "#66BB6A",
        desc: "Jelajahi keajaiban fisika, biologi, dan reaksi kimia alam semesta.",
        challenges: [
            { id: "ipa_1", title: "Biologi Manusia", duration: "15 min", xp: 1500, diamond: 75, req: 0 },
            { id: "ipa_2", title: "Fisika Dasar", duration: "15 min", xp: 1500, diamond: 75, req: 1 },
            { id: "ipa_3", title: "Reaksi Kimia", duration: "20 min", xp: 2000, diamond: 100, req: 2 }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = 'login.html';
        else loadSubjectDetail();
    });
});

function loadSubjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('id') || 'mathematics';
    const data = subjectData[subjectId];

    if (!data) {
        window.location.href = 'learn.html';
        return;
    }

    document.getElementById('subject-header-title').textContent = data.title;
    document.getElementById('subject-title').textContent = data.title;
    document.querySelector('#subject-icon-container').style.backgroundColor = data.color;
    document.getElementById('subject-icon').textContent = data.icon;
    document.querySelector('p.text-xs.text-textDim.leading-relaxed').textContent = data.desc;

    const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
    const myProgress = userProgress[subjectId] || { completed: 0, totalXp: 0 };
    
    // Update persentase Progress
    const progressPercent = Math.round((myProgress.completed / data.challenges.length) * 100) || 0;
    document.querySelector('.text-success').textContent = `${progressPercent}%`;

    // === LOGIKA BARU: HITUNG TOTAL XP KESELURUHAN ===
    // Sistem akan menjumlahkan semua XP dari tantangan (Contoh: 1500 + 1500 + 2000 = 5000)
    const maxSubjectXP = data.challenges.reduce((total, ch) => total + ch.xp, 0);
    document.querySelector('.text-primary').textContent = maxSubjectXP.toLocaleString('id-ID');

    renderChallenges(data.challenges, myProgress.completed, subjectId, data.color);
}

function renderChallenges(challenges, completedCount, subjectId, themeColor) {
    const container = document.getElementById('challenge-list');
    container.innerHTML = ''; 

    challenges.forEach((ch, index) => {
        // Tentukan Status Logika
        let status = 'locked';
        if (index < completedCount) status = 'done';
        else if (index === completedCount) status = 'available';

        let statusBadge = '';
        let buttonUI = '';
        let opacityClass = status === 'locked' ? 'opacity-60 grayscale' : '';

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
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: ${themeColor}33; color: ${themeColor};">
                        <span class="font-black text-sm">${index + 1}</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-white">${ch.title}</h4>
                        <p class="text-[10px] text-textDim flex items-center gap-2 mt-1">
                            <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">schedule</span> ${ch.duration}</span>
                            <span class="flex items-center gap-0.5 text-primaryLight"><span class="material-symbols-outlined text-[12px]">stars</span> ${ch.xp} XP</span>
                            <span class="flex items-center gap-0.5 text-[#00E5FF]"><span class="material-symbols-outlined text-[12px] icon-filled">diamond</span> ${ch.diamond}</span>
                        </p>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
                ${statusBadge}
                ${buttonUI}
            </div>
        `;
        container.appendChild(card);
    });
}

// === FUNGSI EKSEKUTIF MENUJU KUIS ===
window.startQuiz = (challengeId, subjectId, mode) => {
    // Menyimpan ID dan Mode dengan sangat aman sebelum melompat ke kuis
    localStorage.setItem('quizMode', mode);
    localStorage.setItem('currentChallengeId', challengeId);
    localStorage.setItem('currentSubjectId', subjectId);
    
    document.body.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => { window.location.href = 'play.html'; }, 300);
};

const style = document.createElement('style');
style.innerHTML = `@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`;
document.head.appendChild(style);