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

// Fungsi Register
export async function registerUser(email, password, username, avatarUrl) {
    try {
        clearAppCache(); // Bilas cache sebelum mendaftar

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Buat dokumen user baru di Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            username: username,
            email: email,
            avatarUrl: avatarUrl,
            level: 1,
            xp: 0,
            diamond: 50,
            streak: 1,
            lastLogin: serverTimestamp(),
            badges: [],
            achievements: []
        });

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fungsi Login
export async function loginUser(email, password) {
    try {
        clearAppCache(); // Bilas cache sebelum masuk
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fungsi Logout Standar
export async function logoutUser() {
    try {
        clearAppCache(); // Bilas cache sebelum keluar
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Gagal logout:", error);
    }
}

// Proteksi Halaman (Cek apakah user sudah login)
export function checkAuth(onLoggedIn, onLoggedOut) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (onLoggedIn) onLoggedIn(user);
        } else {
            if (onLoggedOut) onLoggedOut();
        }
    });
}