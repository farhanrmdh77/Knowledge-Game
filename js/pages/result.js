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
    // 1. Ambil Data dari LocalStorage
    const score = parseInt(localStorage.getItem('q_score')) || 0;
    const correct = parseInt(localStorage.getItem('q_correct')) || 0;
    const wrong = parseInt(localStorage.getItem('q_wrong')) || 0;
    const total = parseInt(localStorage.getItem('q_total')) || 1;
    let earnedXP = parseInt(localStorage.getItem('q_xp')) || 0;
    
    const quizMode = localStorage.getItem('quizMode') || 'start'; 
    const subjectId = localStorage.getItem('currentSubjectId') || 'mathematics';
    const challengeId = localStorage.getItem('currentChallengeId') || 'math_1';

    // 2. Kalkulasi Dinamis
    const accuracy = Math.round((correct / total) * 100);
    let earnedDiamond = (correct * 5);
    if (wrong === 0) earnedDiamond += 20;

    // Jika Mode Replay, nol-kan hadiah
    if (quizMode === 'replay') {
        earnedXP = 0;
        earnedDiamond = 0;
        document.getElementById('replay-alert').classList.remove('hidden');
        document.getElementById('level-progress-section').classList.add('hidden');
    }

    // 3. Render ke UI Dasar
    document.getElementById('res-score').textContent = score.toLocaleString('id-ID');
    document.getElementById('res-accuracy').textContent = `${accuracy}%`;
    document.getElementById('res-correct').textContent = correct;
    document.getElementById('res-wrong').textContent = wrong;
    document.getElementById('res-xp').textContent = `+${earnedXP}`;
    document.getElementById('res-diamond').textContent = `+${earnedDiamond}`;

    // 4. Update Database
    if (quizMode === 'start') {
        let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
        if (!userProgress[subjectId]) userProgress[subjectId] = { completed: 0, totalXp: 0 };
        
        // === PERBAIKAN BUG PROGRESS ===
        // Daripada "+1", kita mencocokkan nomor challenge agar progress tidak kebablasan (anti-farming)
        const challengeNumber = parseInt(challengeId.split('_')[1]) || 1;
        if (challengeNumber > userProgress[subjectId].completed) {
            userProgress[subjectId].completed = challengeNumber;
        }
        
        userProgress[subjectId].totalXp += earnedXP;
        localStorage.setItem('userProgress', JSON.stringify(userProgress));
        // ==============================
        
        try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const userData = snap.data();
                const currentXP = userData.xp || 0;
                const newTotalXP = currentXP + earnedXP;
                const currentLevel = userData.level || 1;
                const calculatedLevel = Math.floor(newTotalXP / 1000) + 1;
                
                const updatePayload = {
                    xp: increment(earnedXP),
                    diamond: increment(earnedDiamond),
                    level: calculatedLevel
                };
                
                updatePayload[`subjects.${subjectId}.xp`] = increment(earnedXP);
                updatePayload[`subjects.${subjectId}.diamond`] = increment(earnedDiamond);
                
                await updateDoc(userRef, updatePayload);

                const formattedSubject = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
                
                await addDoc(collection(db, "activity_history"), {
                    userId: user.uid,
                    challengeTitle: `${formattedSubject} - Challenge ${challengeNumber}`,
                    score: score,
                    earnedXp: earnedXP,
                    accuracy: accuracy,
                    playedAt: serverTimestamp()
                });

                document.getElementById('res-level-text').textContent = `Level ${calculatedLevel}`;
                const xpInLevel = newTotalXP % 1000;
                const progressPercent = (xpInLevel / 1000) * 100;
                
                setTimeout(() => {
                    document.getElementById('res-xp-bar').style.width = `${progressPercent}%`;
                }, 500);
                
                if (calculatedLevel > currentLevel) {
                    document.getElementById('res-xp-bar').classList.replace('bg-success', 'bg-warning');
                    document.getElementById('res-xp-bar').classList.replace('shadow-[0_0_10px_rgba(0,230,118,0.5)]', 'shadow-[0_0_15px_rgba(255,214,0,0.6)]');
                }
            }
        } catch (error) {
            console.error("Gagal menyimpan hasil ke server:", error);
        }
    }

    // 5. Logika Navigasi "Back to Subject"
    const btnBackSubject = document.getElementById('btn-back-subject');
    if (btnBackSubject) {
        btnBackSubject.addEventListener('click', () => {
            const currentSubject = localStorage.getItem('currentSubjectId') || 'mathematics';
            window.location.href = `subject.html?id=${currentSubject}`;
        });
    }

    // 6. PERBAIKAN BUG "PLAY AGAIN" (Mencegah Farming)
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            // Paksa mode 'replay' agar ketika selesai, tidak menambah XP atau melompatkan progress
            localStorage.setItem('quizMode', 'replay');
            window.location.href = 'play.html';
        });
    }
}