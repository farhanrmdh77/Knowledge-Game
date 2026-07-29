// File: js/services/authService.js
import { auth, db } from '../config/firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function clearAppCache() {
    localStorage.removeItem('userProgress');
    localStorage.removeItem('currentSubjectId');
    localStorage.removeItem('currentChallengeId');
    localStorage.removeItem('cachedAvatar');
    localStorage.removeItem('quizMode');
}

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

let selectedAvatarGlobal = avatarOptions[0]; 

export function renderAvatarSlider() {
    const sliderContainer = document.getElementById('avatar-slider');
    const inputHidden = document.getElementById('selected-avatar-url');
    if (!sliderContainer) return; 

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
            selectedAvatarGlobal = url;
            if (document.getElementById('selected-avatar-url')) {
                document.getElementById('selected-avatar-url').value = url;
            }
            window.__LAST_CHOSEN_AVATAR__ = url;
            renderAvatarSlider(); 
        });
        sliderContainer.appendChild(avatarDiv);
    });
}

export function getActiveAvatarUrl() {
    if (window.__LAST_CHOSEN_AVATAR__) return window.__LAST_CHOSEN_AVATAR__;
    const hiddenInput = document.getElementById('selected-avatar-url');
    if (hiddenInput && hiddenInput.value) return hiddenInput.value;
    return selectedAvatarGlobal;
}

export async function registerUser(email, password, username, avatarUrl) {
    try {
        clearAppCache(); 
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const finalAvatarUrl = avatarUrl || getActiveAvatarUrl();

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
        
        // 🔥 FIX MUTLAK: Logout paksa dan BERI WAKTU 500ms agar memori browser benar-benar bersih!
        await signOut(auth);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        return { success: true }; 
    } catch (error) {
        if (auth.currentUser) await signOut(auth);
        return { success: false, error: error.message };
    }
}

export async function loginUser(email, password) {
    try {
        clearAppCache(); 
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function logoutUser() {
    try {
        clearAppCache(); 
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {}
}

export function checkAuth(onLoggedIn, onLoggedOut) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (onLoggedIn) onLoggedIn(user);
        } else {
            if (onLoggedOut) onLoggedOut();
        }
    });
}