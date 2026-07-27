// File: js/pages/play.js
import { auth } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { quizData } from '../data/quizData.js'; 

// === STATE PERMAINAN ===
let questions = [];
let currentIndex = 0;
let score = 0;
let lives = 3; // (Combo sudah dihapus dari sini)

// STATE HADIAH 
let earnedXP = 0; 
let earnedDiamond = 0;
let correctAnswers = 0;
let wrongAnswers = 0;

let timeLeft = 15; 
let timerInterval;
let isAnsweringAllowed = false;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = 'login.html';
        else initGame();
    });

    document.getElementById('btn-exit').addEventListener('click', () => {
        if (confirm("Keluar dari kuis? Progres ini tidak akan disimpan.")) {
            window.location.href = 'learn.html';
        }
    });
});

function initGame() {
    const subjectId = localStorage.getItem('currentSubjectId') || 'mathematics';
    const challengeId = localStorage.getItem('currentChallengeId') || 'math_1';
    
    const subjectData = quizData[subjectId];

    if (!subjectData) {
        alert("Oops! Soal untuk pelajaran ini belum tersedia.");
        window.location.href = 'learn.html';
        return;
    }

    const challengeIndex = parseInt(challengeId.split('_')[1]) - 1 || 0; 

    // === MESIN CERDAS: DETEKSI FORMAT DATA ===
    if (subjectData.challenges) {
        const challenge = subjectData.challenges[challengeIndex] || subjectData.challenges[0];
        
        questions = challenge.questions.map(q => ({
            question: q.question, 
            options: q.options, 
            correct: q.correctAnswer, 
            explanation: q.explanation
        }));

    } else if (Array.isArray(subjectData)) {
        let rawQuestions = [];
        if (challengeIndex === 0) {
            rawQuestions = subjectData.slice(0, 3); 
        } else if (challengeIndex === 1) {
            rawQuestions = subjectData.slice(3, 6); 
        } else {
            rawQuestions = subjectData.slice(6, 10); 
        }

        questions = rawQuestions.map(q => ({
            question: q.q, 
            options: q.o, 
            correct: q.a, 
            explanation: q.exp
        }));
    }

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
            void countText.offsetWidth; // Reflow
            countText.classList.add('animate-pop');
        } else if (count === 0) {
            countText.textContent = "GO!";
            countText.classList.add('text-success');
        } else {
            clearInterval(countInterval);
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.classList.add('hidden');
                loadQuestion();
            }, 300);
        }
    }, 1000);
}

function loadQuestion() {
    if (currentIndex >= questions.length || lives <= 0) {
        endQuiz();
        return;
    }

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
            <div class="w-10 h-10 rounded-xl bg-background border border-white/10 flex-shrink-0 flex items-center justify-center font-bold text-textDim option-letter">
                ${alphabet[index]}
            </div>
            <span class="font-bold text-white text-[15px]">${opt}</span>
        `;
        
        btn.addEventListener('click', () => handleAnswer(index, btn));
        optionsContainer.appendChild(btn);
    });

    isAnsweringAllowed = true;
    startTimer();
}

function startTimer() {
    timeLeft = 15;
    const timerText = document.getElementById('timer-text');
    timerText.textContent = timeLeft;
    timerText.classList.remove('text-danger', 'animate-pulse');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;

        if (timeLeft <= 3 && timeLeft > 0) {
            timerText.classList.add('text-danger', 'animate-pulse');
        } else if (timeLeft <= 5) {
            timerText.classList.add('text-danger'); 
        }

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
        
        score += 100;
        earnedXP += 100;
        earnedDiamond += 5;
        correctAnswers++;

        // (Animasi UI Combo sudah dihapus bersih dari sini)
        
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
        
        // (Reset UI Combo sudah dihapus bersih dari sini)
        
        showExplanation(false, q.explanation);
    }

    document.getElementById('score-text').textContent = score;

    setTimeout(() => {
        currentIndex++;
        loadQuestion();
    }, 2000);
}

function showExplanation(isCorrect, text) {
    const explBox = document.getElementById('explanation-box');
    const explIcon = document.getElementById('explanation-icon');
    const explTitle = document.getElementById('explanation-title');
    
    explBox.classList.remove('hidden');
    
    setTimeout(() => {
        explBox.classList.remove('translate-y-4', 'opacity-0');
    }, 50);

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
        if (i < lives) {
            livesContainer.innerHTML += `<span class="material-symbols-outlined icon-filled text-lg">favorite</span>`;
        } else {
            livesContainer.innerHTML += `<span class="material-symbols-outlined text-lg text-white/20">favorite</span>`;
        }
    }
}

function endQuiz() {
    localStorage.setItem('q_score', score);
    localStorage.setItem('q_xp', earnedXP);
    localStorage.setItem('q_diamond', earnedDiamond); 
    localStorage.setItem('q_correct', correctAnswers);
    localStorage.setItem('q_wrong', wrongAnswers);
    localStorage.setItem('q_total', questions.length);

    window.location.href = 'result.html';
}