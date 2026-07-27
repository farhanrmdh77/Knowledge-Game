// Import SDK Firebase yang diperlukan dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase Anda (Ganti dengan kredensial dari project Firebase Anda)
const firebaseConfig = {
  apiKey: "AIzaSyDKJttypCFj_Qq--Otx8F0uNQAH6sxCZXQ",
  authDomain: "friendship-wheel-game.firebaseapp.com",
  projectId: "friendship-wheel-game",
  storageBucket: "friendship-wheel-game.firebasestorage.app",
  messagingSenderId: "330027530341",
  appId: "1:330027530341:web:c7b6ec702dc727ca29ee8c",
  measurementId: "G-1W00YLBM86"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);