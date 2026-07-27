// File: js/utils/audioManager.js

const BGM_PATH = 'assets/audio/bgm.mp3'; 
const CORRECT_PATH = 'assets/audio/correct.mp3'; 
const WRONG_PATH = 'assets/audio/wrong.mp3';   
const TICK_PATH = 'assets/audio/tick.mp3';     
const READY_PATH = 'assets/audio/ready.mp3';   

class AudioManager {
    constructor() {
        this.bgm = new Audio(BGM_PATH);
        this.bgm.loop = true;
        this.bgm.volume = 0.5;
        
        this.correctSfx = new Audio(CORRECT_PATH);
        this.wrongSfx = new Audio(WRONG_PATH);
        this.tickSfx = new Audio(TICK_PATH);
        this.readySfx = new Audio(READY_PATH);
        
        // Ambil pengaturan, atau berikan default menyala semua
        this.settings = JSON.parse(localStorage.getItem('appSettings')) || { sound: true, music: false };
        
        // FIX: Jika variabel 'sound' di pengaturan kebetulan kosong/undefined, paksa jadi true
        if (typeof this.settings.sound === 'undefined') {
            this.settings.sound = true;
        }

        this.init();
    }

    init() {
        const isPlayingQuiz = window.location.pathname.includes('play.html');

        if (this.settings.music && !isPlayingQuiz) {
            const savedTime = localStorage.getItem('bgm_time') || 0;
            this.bgm.currentTime = parseFloat(savedTime);
            this.bgm.play().catch(e => console.log("BGM menunggu interaksi..."));
            
            window.addEventListener('beforeunload', () => {
                localStorage.setItem('bgm_time', this.bgm.currentTime);
            });
        } else {
            this.bgm.pause();
        }
    }

    playCorrect() {
        console.log("Mencoba memutar: Benar");
        if (this.settings.sound) { 
            this.correctSfx.currentTime = 0; 
            this.correctSfx.play().catch(e => console.error("GAGAL MEMUTAR 'correct.mp3':", e)); 
        }
    }

    playWrong() {
        console.log("Mencoba memutar: Salah");
        if (this.settings.sound) { 
            this.wrongSfx.currentTime = 0; 
            this.wrongSfx.play().catch(e => console.error("GAGAL MEMUTAR 'wrong.mp3':", e)); 
        }
    }

    playTick() {
        console.log("Mencoba memutar: Tick");
        if (this.settings.sound) { 
            this.tickSfx.currentTime = 0; 
            this.tickSfx.play().catch(e => console.error("GAGAL MEMUTAR 'tick.mp3':", e)); 
        }
    }

    playReady() {
        console.log("Mencoba memutar: Ready GO!");
        if (this.settings.sound) { 
            this.readySfx.currentTime = 0; 
            this.readySfx.play().catch(e => console.error("GAGAL MEMUTAR 'ready.mp3':", e)); 
        }
    }

    updateSettings(newSettings) {
        this.settings = newSettings;
        if (this.settings.music && !window.location.pathname.includes('play.html')) {
            this.bgm.play().catch(e => {});
        } else {
            this.bgm.pause();
        }
    }
}

window.audioManager = new AudioManager();