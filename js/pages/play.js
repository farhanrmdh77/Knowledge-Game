// File: js/pages/play.js
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { quizData } from '../data/quizData.js'; 

// === STATE PERMAINAN ===
let questions = [];
let currentIndex = 0;
let score = 0;
let lives = 3; 
let isQuizEnded = false; 

// === SISTEM EKONOMI ===
let earnedXP = 0; 
let earnedDiamond = 0; 
let startingDiamonds = 0; 
let maxDiamondsForChallenge = 100;
let xpPerQuestion = 100; 

const REVIVE_COST = 50;
let correctAnswers = 0;
let wrongAnswers = 0;

let questionTimeLimit = 15; 
let timeLeft; 
let timerInterval;
let isAnsweringAllowed = false;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) window.location.href = 'login.html';
        else {
            try {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) startingDiamonds = snap.data().diamond || 0;
            } catch (error) { console.error(error); }
            initGame();
        }
    });

    document.getElementById('btn-exit').addEventListener('click', () => {
        document.getElementById('exit-modal').classList.remove('hidden');
    });
});

window.closeExitModal = () => document.getElementById('exit-modal').classList.add('hidden');
window.confirmExit = () => window.location.href = 'learn.html';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initGame() {
    const subjectId = localStorage.getItem('currentSubjectId') || 'mathematics';
    const challengeId = localStorage.getItem('currentChallengeId') || 'math_1';
    
    const subjectData = quizData[subjectId];
    if (!subjectData) { window.location.href = 'learn.html'; return; }

    const challengeIndex = parseInt(challengeId.split('_')[1]) - 1 || 0; 
    
    // 🔥 PENGATURAN KESULITAN TERMASUK EPIC STAGE (INDEX 3) 🔥
    if (challengeIndex === 0) {
        questionTimeLimit = 15; maxDiamondsForChallenge = 100; xpPerQuestion = 100;
    } else if (challengeIndex === 1) {
        questionTimeLimit = 25; maxDiamondsForChallenge = 150; xpPerQuestion = 100;
    } else if (challengeIndex === 2) {
        questionTimeLimit = 30; maxDiamondsForChallenge = 250; xpPerQuestion = 100;
    } else if (challengeIndex === 3) {
        questionTimeLimit = 40; maxDiamondsForChallenge = 2500; xpPerQuestion = 500; // THE BOSS
    }

    let rawQuestions = [];
    if (subjectData.challenges && subjectData.challenges[challengeIndex]) {
        rawQuestions = subjectData.challenges[challengeIndex].questions.map(q => ({
            question: q.question, options: q.options, correct: q.correctAnswer, explanation: q.explanation
        }));
    } else {
        alert("Soal untuk Epic Stage sedang dibuat! Kembali ke menu.");
        window.location.href = 'learn.html';
        return;
    }

    questions = shuffleArray(rawQuestions);
    startCountdown();
}

function startCountdown() {
    const overlay = document.getElementById('countdown-overlay');
    const countText = document.getElementById('countdown-number');
    const titleEl = document.querySelector('#countdown-overlay h2');

    if (titleEl) titleEl.textContent = "GET READY";
    
    let count = 3;
    countText.textContent = count;
    countText.classList.add('animate-pop');

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countText.textContent = count;
            countText.classList.remove('animate-pop');
            void countText.offsetWidth; 
            countText.classList.add('animate-pop');
        } else if (count === 0) {
            countText.textContent = "GO!";
            countText.classList.add('text-success');
        } else {
            clearInterval(countInterval);
            overlay.classList.add('opacity-0');
            setTimeout(() => { overlay.classList.add('hidden'); loadQuestion(); }, 300);
        }
    }, 1000);
}

function loadQuestion() {
    if (currentIndex >= questions.length || lives <= 0) { endQuiz(); return; }

    const q = questions[currentIndex];
    const explBox = document.getElementById('explanation-box');
    explBox.classList.add('hidden', 'translate-y-4', 'opacity-0');

    const progressPercent = (currentIndex / questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `${currentIndex + 1} / ${questions.length}`;
    document.getElementById('question-text').textContent = q.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    const alphabet = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = "option-btn w-full bg-card p-4 rounded-[20px] border border-white/5 flex items-center gap-4 hover:bg-white/5 active:scale-95 text-left";
        btn.innerHTML = `
            <div class="w-10 h-10 rounded-xl bg-background border border-white/10 flex-shrink-0 flex items-center justify-center font-bold text-textDim option-letter">${alphabet[index]}</div>
            <span class="font-bold text-white text-[15px]">${opt}</span>
        `;
        btn.addEventListener('click', () => handleAnswer(index, btn));
        optionsContainer.appendChild(btn);
    });

    isAnsweringAllowed = true;
    startTimer();
}

function startTimer() {
    timeLeft = questionTimeLimit;
    const timerText = document.getElementById('timer-text');
    timerText.textContent = timeLeft;
    timerText.classList.remove('text-danger', 'animate-pulse');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        if (timeLeft <= 3 && timeLeft > 0) timerText.classList.add('text-danger', 'animate-pulse');
        else if (timeLeft <= 5) timerText.classList.add('text-danger'); 

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerText.classList.remove('animate-pulse');
            handleAnswer(-1, null);
        }
    }, 1000);
}

function handleAnswer(selectedIndex, selectedBtn) {
    if (!isAnsweringAllowed) return;
    isAnsweringAllowed = false; 
    clearInterval(timerInterval);

    const timerText = document.getElementById('timer-text');
    if (timerText) timerText.classList.remove('animate-pulse'); 

    const q = questions[currentIndex];
    const isCorrect = selectedIndex === q.correct;
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.style.pointerEvents = 'none');

    if (isCorrect) {
        if (window.audioManager) window.audioManager.playCorrect();
        if (selectedBtn) {
            selectedBtn.classList.replace('bg-card', 'bg-success/20');
            selectedBtn.classList.replace('border-white/5', 'border-success');
            selectedBtn.querySelector('.option-letter').classList.replace('bg-background', 'bg-success');
            selectedBtn.querySelector('.option-letter').classList.replace('text-textDim', 'text-black');
        }
        
        score += xpPerQuestion;
        earnedXP += xpPerQuestion;
        correctAnswers++;

        let expectedTotalDiamond = Math.round((correctAnswers / questions.length) * maxDiamondsForChallenge);
        let addedDiamond = expectedTotalDiamond - earnedDiamond;
        earnedDiamond += addedDiamond; 
        
        const diamondTextUI = document.getElementById('diamond-text');
        if (diamondTextUI) {
            diamondTextUI.textContent = earnedDiamond;
            diamondTextUI.parentElement.classList.add('scale-110', 'border-[#00E5FF]');
            setTimeout(() => diamondTextUI.parentElement.classList.remove('scale-110', 'border-[#00E5FF]'), 300);
        }
        
        showExplanation(true, q.explanation);
    } else {
        if (window.audioManager) window.audioManager.playWrong();
        if (selectedBtn) {
            selectedBtn.classList.replace('bg-card', 'bg-danger/20');
            selectedBtn.classList.replace('border-white/5', 'border-danger');
            selectedBtn.querySelector('.option-letter').classList.replace('bg-background', 'bg-danger');
            selectedBtn.querySelector('.option-letter').classList.replace('text-textDim', 'text-white');
        }
        const correctBtn = allButtons[q.correct];
        if (correctBtn) {
            correctBtn.classList.replace('border-white/5', 'border-success');
            correctBtn.querySelector('.option-letter').classList.replace('text-textDim', 'text-success');
        }

        lives--;
        wrongAnswers++;
        updateLivesUI();
        showExplanation(false, q.explanation);
    }

    document.getElementById('score-text').textContent = score;

    if (lives <= 0) setTimeout(() => showReviveModal(), 1500);
    else setTimeout(() => { currentIndex++; loadQuestion(); }, 1500);
}

function showExplanation(isCorrect, text) {
    const explBox = document.getElementById('explanation-box');
    const explIcon = document.getElementById('explanation-icon');
    const explTitle = document.getElementById('explanation-title');
    explBox.classList.remove('hidden');
    setTimeout(() => explBox.classList.remove('translate-y-4', 'opacity-0'), 50);
    document.getElementById('explanation-text').textContent = text;

    if (isCorrect) {
        explBox.classList.replace('border-white/10', 'border-success/30');
        explBox.classList.replace('border-danger/30', 'border-success/30');
        explIcon.textContent = 'check_circle';
        explIcon.className = 'material-symbols-outlined icon-filled text-2xl mt-0.5 text-success';
        explTitle.textContent = 'Benar!';
        explTitle.className = 'font-bold text-sm mb-1 text-success';
    } else {
        explBox.classList.replace('border-white/10', 'border-danger/30');
        explBox.classList.replace('border-success/30', 'border-danger/30');
        explIcon.textContent = 'cancel';
        explIcon.className = 'material-symbols-outlined icon-filled text-2xl mt-0.5 text-danger';
        explTitle.textContent = 'Salah!';
        explTitle.className = 'font-bold text-sm mb-1 text-danger';
    }
}

function updateLivesUI() {
    const livesContainer = document.getElementById('lives-container');
    livesContainer.innerHTML = '';
    for(let i = 0; i < 3; i++) {
        if (i < lives) livesContainer.innerHTML += `<span class="material-symbols-outlined icon-filled text-lg text-danger">favorite</span>`;
        else livesContainer.innerHTML += `<span class="material-symbols-outlined text-lg text-white/20">favorite</span>`;
    }
}

function showReviveModal() {
    document.getElementById('revive-modal').classList.remove('hidden');
    const currentTotalDiamonds = startingDiamonds + earnedDiamond;
    document.getElementById('modal-current-diamond').textContent = currentTotalDiamonds.toLocaleString('id-ID');
}

window.acceptRevive = async () => {
    const currentTotalDiamonds = startingDiamonds + earnedDiamond;
    if (currentTotalDiamonds >= REVIVE_COST) {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const subjectId = localStorage.getItem('currentSubjectId') || 'mathematics';
            const userRef = doc(db, "users", user.uid);
            
            const updatePayload = { diamond: increment(-REVIVE_COST) };
            updatePayload[`subjects.${subjectId}.diamond`] = increment(-REVIVE_COST);
            await updateDoc(userRef, updatePayload);

            startingDiamonds -= REVIVE_COST; 
            lives = 1; 
            updateLivesUI();
            document.getElementById('revive-modal').classList.add('hidden');
            
            isAnsweringAllowed = true;
            loadQuestion();
        } catch (error) {
            console.error("Gagal transaksi revive:", error);
            alert("Koneksi gagal.");
        }
    } else {
        document.getElementById('insufficient-diamond-modal').classList.remove('hidden');
    }
};

window.declineRevive = () => { document.getElementById('revive-modal').classList.add('hidden'); endQuiz(); };
window.closeInsufficientModal = () => document.getElementById('insufficient-diamond-modal').classList.add('hidden');

function endQuiz() {
    if (isQuizEnded) return;
    isQuizEnded = true;

    let finalXP = earnedXP;
    let finalDiamond = earnedDiamond; 
    let finalScore = score;
    let passStatus = "lulus"; // 🔥 DEFAULT: Lulus asalkan bertahan hidup sampai akhir

    // 🔥 LOGIKA SESUAI PERMINTAAN: Mati di tengah jalan = Hangus & Gagal
    if (lives <= 0) {
        finalXP = 0; 
        finalScore = 0; 
        finalDiamond = 0; 
        passStatus = "gagal";
    }

    // 🔥 ANTI-EKSPLOITASI MODE REPLAY
    const quizMode = localStorage.getItem('quizMode') || 'start';
    if (quizMode === 'replay') {
        finalXP = 0; 
        finalDiamond = 0; 
    }

    const challengeId = localStorage.getItem('currentChallengeId') || 'math_1';
    const challengeIndex = parseInt(challengeId.split('_')[1]) - 1 || 0;
    
    // Simpan semua data permainan
    localStorage.setItem('q_played_index', challengeIndex);
    localStorage.setItem('q_pass_status', passStatus); 
    localStorage.setItem('q_score', finalScore);
    localStorage.setItem('q_xp', finalXP);
    localStorage.setItem('q_diamond', finalDiamond); 
    localStorage.setItem('q_correct', correctAnswers);
    localStorage.setItem('q_wrong', wrongAnswers);
    localStorage.setItem('q_total', questions.length);

    window.location.href = 'result.html';
}

const style = document.createElement('style');
style.innerHTML = `@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`;
document.head.appendChild(style);