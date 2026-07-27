// File: js/services/authService.js
import { auth, db } from '../config/firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// === TAMBAHAN: Fungsi Pembilas Cache Browser ===
function clearAppCache() {
    localStorage.removeItem('userProgress');
    localStorage.removeItem('currentSubjectId');
    localStorage.removeItem('currentChallengeId');
    localStorage.removeItem('cachedAvatar');
    localStorage.removeItem('quizMode');
}

// === DAFTAR 10 AVATAR PILIHAN ===
const avatarOptions = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=7C5CFF",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=00E5FF",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper&backgroundColor=FFD600",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=FF3D00",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=43A047",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=E040FB",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=FF6D00",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=00B0FF",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=00C853",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Sam&backgroundColor=FF4081"
];

let selectedAvatarGlobal = avatarOptions[0]; // Default avatar pertama

// === FUNGSI RENDER AVATAR SLIDER ===
export function renderAvatarSlider() {
    const sliderContainer = document.getElementById('avatar-slider');
    const inputHidden = document.getElementById('selected-avatar-url');
    
    // Jika tidak ada form register di halaman, hentikan eksekusi
    if (!sliderContainer) return; 

    // Paksa tulis ke HTML saat render pertama kali
    if (inputHidden) inputHidden.value = selectedAvatarGlobal;
    window.__LAST_CHOSEN_AVATAR__ = selectedAvatarGlobal;

    sliderContainer.innerHTML = '';

    avatarOptions.forEach((url) => {
        const isSelected = url === selectedAvatarGlobal;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-full cursor-pointer transition-all snap-center relative border-[3px] ${isSelected ? 'border-[#2edcd7] shadow-[0_0_15px_rgba(46,220,215,0.6)] scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`;
        
        avatarDiv.innerHTML = `
            <img src="${url}" class="w-full h-full rounded-full object-cover bg-[#1b1b23]">
            ${isSelected ? '<span class="absolute -bottom-1 -right-1 bg-[#2edcd7] text-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#12121A]"><span class="material-symbols-outlined text-[12px] font-extrabold">check</span></span>' : ''}
        `;

        avatarDiv.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Simpan ke variabel global JS
            selectedAvatarGlobal = url;
            
            // 2. Paksa tulis ke HTML Tersembunyi
            if (document.getElementById('selected-avatar-url')) {
                document.getElementById('selected-avatar-url').value = url;
            }
            
            // 3. Paksa tulis ke memori terdalam Browser (Anti-Cache)
            window.__LAST_CHOSEN_AVATAR__ = url;

            renderAvatarSlider(); // Render ulang agar centangnya berpindah
        });

        sliderContainer.appendChild(avatarDiv);
    });
}

// === FUNGSI SAPU JAGAT UNTUK MENGAMBIL AVATAR ===
export function getActiveAvatarUrl() {
    // Coba ambil dari memori terdalam browser dulu
    if (window.__LAST_CHOSEN_AVATAR__) {
        return window.__LAST_CHOSEN_AVATAR__;
    }
    // Jika gagal, coba ambil dari input HTML
    const hiddenInput = document.getElementById('selected-avatar-url');
    if (hiddenInput && hiddenInput.value) {
        return hiddenInput.value;
    }
    // Jika gagal juga, ambil dari variabel lokal
    return selectedAvatarGlobal;
}

// Fungsi Register
// Fungsi Register dengan Pelacak Anti-Gagal
export async function registerUser(email, password, username, avatarUrl) {
    try {
        clearAppCache(); 
        console.log("⏳ 1. Memulai proses buat akun Auth...");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ 2. Akun Auth sukses! UID:", user.uid);

        const finalAvatarUrl = avatarUrl || getActiveAvatarUrl();
        console.log("🖼️ 3. URL Avatar yang disiapkan:", finalAvatarUrl);

        console.log("⏳ 4. Menulis data profil ke Firestore...");
        
        // Kita gunakan new Date() biasa untuk menghindari potensi error dari serverTimestamp()
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            username: username,
            email: email,
            avatarUrl: finalAvatarUrl,
            level: 1,
            xp: 0,
            diamond: 50,
            streak: 1,
            lastLogin: new Date(), 
            badges: [],
            achievements: [],
            inventory: ['border_default', 'title_default'], 
            equippedBorder: 'border_default', 
            equippedTitle: 'title_default'    
        });
        
        console.log("✅ 5. Data Firestore BERHASIL TERTULIS SEMPURNA!");

        return { success: true, user };
    } catch (error) {
        console.error("🚨 ERROR PENDAFTARAN:", error);
        
        // KUNCI PENTING: Jika error terjadi SETELAH akun terbuat, 
        // keluarkan user paksa agar tidak menjadi 'Akun Hantu' di browser.
        if (auth.currentUser) {
            await signOut(auth);
        }
        return { success: false, error: error.message };
    }
}

// Fungsi Login
export async function loginUser(email, password) {
    try {
        clearAppCache(); 
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fungsi Logout Standar
export async function logoutUser() {
    try {
        clearAppCache(); 
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Gagal logout:", error);
    }
}

// Proteksi Halaman
export function checkAuth(onLoggedIn, onLoggedOut) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (onLoggedIn) onLoggedIn(user);
        } else {
            if (onLoggedOut) onLoggedOut();
        }
    });
}