// File: js/pages/result.js
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        await processQuizResult(user);
    });
});

async function processQuizResult(user) {
    const score = parseInt(localStorage.getItem('q_score')) || 0;
    const correct = parseInt(localStorage.getItem('q_correct')) || 0;
    const wrong = parseInt(localStorage.getItem('q_wrong')) || 0;
    const total = parseInt(localStorage.getItem('q_total')) || 1;
    let earnedXP = parseInt(localStorage.getItem('q_xp')) || 0;
    
    // finalDiamond ini BISA MINUS jika dia beli nyawa tapi berujung gagal!
    let finalDiamond = parseInt(localStorage.getItem('q_diamond')) || 0; 
    
    const quizMode = localStorage.getItem('quizMode') || 'start'; 
    const subjectId = localStorage.getItem('currentSubjectId') || 'mathematics';
    const challengeId = localStorage.getItem('currentChallengeId') || 'math_1';
    
    const passStatus = localStorage.getItem('q_pass_status') || 'lulus';
    const accuracy = Math.round((correct / total) * 100);

    // =========================================================
    // LOGIKA UI LULUS / GAGAL / REPLAY
    // =========================================================
    if (passStatus === 'gagal') {
        earnedXP = 0;
        
        const failAlert = document.getElementById('fail-alert');
        const titleEl = document.getElementById('res-title');
        const subtitleEl = document.getElementById('res-subtitle');
        
        failAlert.classList.remove('hidden');
        
        if (wrong >= 3) {
            failAlert.textContent = "GAME OVER: NYAWA HABIS! LEVEL BERIKUTNYA TETAP TERKUNCI.";
            titleEl.textContent = "Game Over!";
            subtitleEl.textContent = "Kamu terlalu banyak melakukan kesalahan. Coba lagi ya!";
        } else {
            failAlert.textContent = "NILAI DI BAWAH STANDAR (50%). LEVEL BELUM TERBUKA!";
            titleEl.textContent = "Gagal Lulus!";
            subtitleEl.textContent = "Skor kamu belum mencapai batas minimal (50%).";
        }
        
        titleEl.classList.add("text-danger");
        
        const iconContainer = document.getElementById('res-icon-container');
        iconContainer.className = "w-24 h-24 mx-auto bg-gradient-to-br from-danger to-[#b71c1c] rounded-full flex items-center justify-center mb-4 trophy-glow-danger transition-all duration-300";
        document.getElementById('res-icon').textContent = "sentiment_dissatisfied"; 
        
        document.getElementById('level-progress-section').classList.add('hidden');
        
    } else if (quizMode === 'replay') {
        earnedXP = 0;
        finalDiamond = 0; 
        document.getElementById('replay-alert').classList.remove('hidden');
        document.getElementById('level-progress-section').classList.add('hidden');
    }

    // Render ke UI Dasar
    document.getElementById('res-score').textContent = score.toLocaleString('id-ID');
    document.getElementById('res-accuracy').textContent = `${accuracy}%`;
    document.getElementById('res-correct').textContent = correct;
    document.getElementById('res-wrong').textContent = wrong;
    document.getElementById('res-xp').textContent = `+${earnedXP}`;
    
    document.getElementById('res-diamond').textContent = finalDiamond >= 0 ? `+${finalDiamond}` : finalDiamond;

    // =========================================================
    // UPDATE DATABASE (PROGRESS & XP)
    // =========================================================
    if (quizMode === 'start' || (passStatus === 'gagal' && finalDiamond < 0)) {
        
        let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
        if (!userProgress[subjectId]) userProgress[subjectId] = { completed: 0, totalXp: 0 };
        
        // 🔥 FIX PENCARIAN ANGKA: Mengambil angka murni dari ID (Misal "math_2" menjadi angka 2)
        const challengeNumber = parseInt(challengeId.replace(/\D/g, '')) || 1;
        
        if (passStatus === 'lulus' && challengeNumber > userProgress[subjectId].completed) {
            userProgress[subjectId].completed = challengeNumber;
        }
        
        userProgress[subjectId].totalXp += earnedXP;
        localStorage.setItem('userProgress', JSON.stringify(userProgress));
        
        try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const userData = snap.data();
                const currentXP = userData.xp || 0;
                const newTotalXP = currentXP + earnedXP;
                const currentLevel = userData.level || 1;
                const calculatedLevel = Math.floor(newTotalXP / 1000) + 1;
                
                // MENGIRIM TAGIHAN / HADIAH KE DATABASE
                const updatePayload = {
                    xp: increment(earnedXP),
                    diamond: increment(finalDiamond),
                    level: calculatedLevel
                };
                
                updatePayload[`subjects.${subjectId}.xp`] = increment(earnedXP);
                updatePayload[`subjects.${subjectId}.diamond`] = increment(finalDiamond);

                // 🔥 BUG FIX UTAMA: KITA WAJIB MENGIRIM STATUS "COMPLETED" (LULUS) KE FIREBASE! 🔥
                const dbCompleted = userData.subjects?.[subjectId]?.completed || 0;
                if (passStatus === 'lulus' && challengeNumber > dbCompleted) {
                    updatePayload[`subjects.${subjectId}.completed`] = challengeNumber;
                }
                
                await updateDoc(userRef, updatePayload);

                const formattedSubject = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
                await addDoc(collection(db, "activity_history"), {
                    userId: user.uid,
                    challengeTitle: `${formattedSubject} - Challenge ${challengeNumber} (${passStatus})`,
                    score: score,
                    earnedXp: earnedXP,
                    accuracy: accuracy,
                    playedAt: serverTimestamp()
                });

                if (passStatus === 'lulus') {
                    document.getElementById('res-level-text').textContent = `Level ${calculatedLevel}`;
                    const xpInLevel = newTotalXP % 1000;
                    const progressPercent = (xpInLevel / 1000) * 100;
                    
                    setTimeout(() => {
                        const xpBar = document.getElementById('res-xp-bar');
                        if(xpBar) xpBar.style.width = `${progressPercent}%`;
                    }, 500);
                    
                    if (calculatedLevel > currentLevel) {
                        const xpBar = document.getElementById('res-xp-bar');
                        if (xpBar) {
                            xpBar.classList.replace('bg-success', 'bg-warning');
                            xpBar.classList.replace('shadow-[0_0_10px_rgba(0,230,118,0.5)]', 'shadow-[0_0_15px_rgba(255,214,0,0.6)]');
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Gagal menyimpan hasil ke server:", error);
        }
    }

    const btnBackSubject = document.getElementById('btn-back-subject');
    if (btnBackSubject) {
        btnBackSubject.addEventListener('click', () => {
            const currentSubject = localStorage.getItem('currentSubjectId') || 'mathematics';
            window.location.href = `subject.html?id=${currentSubject}`;
        });
    }

    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            if (passStatus === 'lulus') {
                localStorage.setItem('quizMode', 'replay');
            }
            window.location.href = 'play.html';
        });
    }
}