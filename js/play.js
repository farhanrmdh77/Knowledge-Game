import GameManager from './core/GameManager.js';
import ThemeManager from './core/ThemeManager.js';
import SoundManager from './core/SoundManager.js'; 

// ==========================================
// MESIN AUDIO MANDIRI KHUSUS PLAY.JS
// ==========================================
const tickAudio = new Audio('assets/audio/tick.mp3');
const readyAudio = new Audio('assets/audio/ready.mp3');
const appSettings = JSON.parse(localStorage.getItem('appSettings')) || { sound: true };

// Fungsi putar audio yang kebal dari error
function playLocalSound(audioElement) {
    if (appSettings.sound) {
        audioElement.currentTime = 0;
        audioElement.play().catch(err => console.log("Menunggu interaksi layar..."));
    }
}
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    ThemeManager.init();
    SoundManager.init(); 

    const game = new GameManager();
    
    // FUNGSI BARU: Tombol Kembali (Silang) di Pojok Kiri Atas
    const btnExit = document.getElementById('btn-exit');
    if (btnExit) {
        btnExit.addEventListener('click', () => {
            if (confirm("Yakin ingin keluar? Progres permainan ini tidak akan disimpan.")) {
                window.location.href = 'home.html'; 
            }
        });
    }

    // 1. Eksekusi Layar Hitungan Mundur
    await runStartCountdown();

    // 2. Inisialisasi game baru dipanggil SETELAH hitungan mundur selesai
    await game.init(
        (action) => updateUI(action, game), 
        () => { window.location.href = 'result.html'; } // Jika game selesai, pindah ke result
    );
});

// FUNGSI BARU: Membuat overlay hitungan mundur dengan Tombol "Mulai Kuis"
async function runStartCountdown() {
    return new Promise(resolve => {
        // Buat elemen overlay pembeku layar
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-300 flex-col gap-6';
        
        // Buat Tombol Mulai (Ini kunci untuk membuka blokir suara dari browser!)
        const startBtn = document.createElement('button');
        startBtn.className = 'bg-primary text-white px-8 py-4 rounded-3xl font-extrabold text-xl shadow-[0_10px_30px_rgba(124,92,255,0.4)] active:scale-95 transition-all flex items-center gap-2 border border-white/10';
        startBtn.innerHTML = `Mulai Kuis <span class="material-symbols-outlined">play_arrow</span>`;
        
        // Buat elemen teks (Angka 3, 2, 1)
        const textEl = document.createElement('div');
        textEl.className = 'text-[120px] font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-300 transform scale-50 opacity-0 hidden';
        
        overlay.appendChild(startBtn);
        overlay.appendChild(textEl);
        document.body.appendChild(overlay);

        // Saat tombol diklik, audio diizinkan menyala dan hitungan mundur dimulai
        startBtn.addEventListener('click', () => {
            
            // PANCING AUDIO: Unlock sistem Autoplay Browser
            if (appSettings.sound) {
                tickAudio.play().then(() => { tickAudio.pause(); tickAudio.currentTime = 0; }).catch(()=>{});
                readyAudio.play().then(() => { readyAudio.pause(); readyAudio.currentTime = 0; }).catch(()=>{});
            }

            // Sembunyikan tombol, munculkan teks hitungan mundur
            startBtn.style.display = 'none';
            textEl.classList.remove('hidden');

            const steps = [3, 2, 1, 'GO!!!'];
            let i = 0;

            function nextStep() {
                if (i >= steps.length) {
                    // Selesai, hilangkan overlay
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        if (document.body.contains(overlay)) document.body.removeChild(overlay);
                        resolve(); // Lanjutkan ke inisialisasi game
                    }, 300);
                    return;
                }

                const current = steps[i];
                textEl.textContent = current;
                
                // Reset animasi pop-up
                textEl.style.transform = 'scale(0.5)';
                textEl.style.opacity = '0';
                
                // Paksa browser membaca ulang DOM (Reflow)
                void textEl.offsetWidth; 

                // Terapkan animasi pop-up
                textEl.style.transform = 'scale(1)';
                textEl.style.opacity = '1';

                // Logika Suara langsung dipanggil ke variabel lokal
                if (current === 'GO!!!') {
                    playLocalSound(readyAudio);
                    textEl.classList.replace('text-white', 'text-success');
                    textEl.classList.replace('drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]', 'drop-shadow-[0_0_40px_rgba(0,255,0,0.8)]');
                } else {
                    playLocalSound(tickAudio);
                }

                i++;
                setTimeout(nextStep, 1000);
            }

            // Mulai langkah pertama
            nextStep();
        });
    });
}

// Fungsi ini akan dieksekusi setiap kali GameManager mengirim sinyal
function updateUI(action, game) {
    if (action.type === 'time') {
        const timeText = document.getElementById('timer-text');
        if (timeText) timeText.textContent = action.value;
        
        const circle = document.querySelector('.timer-circle circle:last-child');
        if (circle) {
            const totalTime = 15; // Asumsi waktu standar 15 detik
            const percent = action.value / totalTime;
            const offset = 125.6 - (125.6 * percent);
            circle.style.strokeDashoffset = offset;
        }

        // --- LOGIKA AUDIO & VISUAL 3 DETIK TERAKHIR ---
        if (action.value <= 3 && action.value > 0) {
            
            // Panggil Suara Detak
            playLocalSound(tickAudio);
            
            // Ubah Teks menjadi Merah (Danger) & Berkedip
            if (timeText) {
                timeText.classList.add('text-danger', 'animate-pulse');
            }
            if (circle) circle.style.stroke = '#FF1744'; 
        } else {
            // Kembalikan ke normal
            if (timeText) {
                timeText.classList.remove('text-danger', 'animate-pulse');
            }
            if (circle) circle.style.stroke = ''; 
        }
    } 
    else if (action.type === 'question') {
        renderQuestion(action.data, game);
    } 
    else if (action.type === 'feedback') {
        handleFeedback(action.data);
    }
}

function renderQuestion(data, game) {
    if (!data) return; 

    const progressText = document.getElementById('progress-text');
    if (progressText) progressText.textContent = `${data.currentIndex}/${data.totalQuestions}`;
    
    const scoreText = document.getElementById('score-text');
    if (scoreText) scoreText.textContent = data.score;
    
    const progressPercent = (data.currentIndex / data.totalQuestions) * 100;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    const imageEl = document.getElementById('question-image');
    if (imageEl) {
        if (data.image) {
            imageEl.src = data.image;
            imageEl.style.display = 'block';
        } else {
            imageEl.style.display = 'none';
        }
    }

    const questionText = document.getElementById('question-text');
    if (questionText) questionText.textContent = data.question;

    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = ''; 
    
    const alphabet = ['A', 'B', 'C', 'D'];
    
    data.options.forEach((optionText, index) => {
        const button = document.createElement('button');
        button.className = 'w-full bg-card p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/5 active:scale-95 transition-all option-btn';
        
        button.innerHTML = `
            <div class="pointer-events-none flex items-center w-full gap-4">
                <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-background text-textDim border border-white/5 font-bold option-letter transition-colors">
                    ${alphabet[index] || '•'}
                </div>
                <span class="answer-text font-bold text-sm sm:text-base w-full text-left">${optionText}</span>
            </div>
        `;
        
        button.addEventListener('click', () => {
            if (button.disabled) return;
            button.classList.add('selected-by-player'); 
            game.handleAnswer(optionText);
        });

        optionsContainer.appendChild(button);
    });
}

function handleFeedback(feedbackData) {
    const buttons = document.querySelectorAll('#options-container button');
    
    const scoreText = document.getElementById('score-text');
    if (scoreText) scoreText.textContent = feedbackData.score;
    
    buttons.forEach(button => {
        button.disabled = true; 
        
        const answerSpan = button.querySelector('.answer-text');
        const buttonText = answerSpan ? answerSpan.textContent : '';
        
        if (buttonText === feedbackData.correctAnswer) {
            button.classList.replace('bg-card', 'bg-success/20');
            button.classList.replace('border-white/5', 'border-success');
            button.querySelector('.option-letter').classList.replace('bg-background', 'bg-success');
            button.querySelector('.option-letter').classList.replace('text-textDim', 'text-black');
        } 
        else if (button.classList.contains('selected-by-player') && !feedbackData.isCorrect) {
            button.classList.replace('bg-card', 'bg-danger/20');
            button.classList.replace('border-white/5', 'border-danger');
            button.querySelector('.option-letter').classList.replace('bg-background', 'bg-danger');
            button.querySelector('.option-letter').classList.replace('text-textDim', 'text-white');
        }
    });
}