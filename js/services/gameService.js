// File: js/services/gameService.js
import { db, auth } from '../config/firebaseConfig.js';
import { collection, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Mengambil Soal dari Firestore
export async function getQuestions() {
    try {
        const qRef = collection(db, "questions");
        const snapshot = await getDocs(qRef);
        let questions = [];
        
        snapshot.forEach(doc => {
            questions.push({ id: doc.id, ...doc.data() });
        });

        // JIKA FIRESTORE KOSONG: Gunakan Soal Cadangan agar game tetap jalan
        if (questions.length === 0) {
            console.warn("Firestore kosong, menggunakan soal cadangan...");
            return [
                { questionText: "Berapa hasil dari 5 x 5?", options: ["10", "20", "25", "30"], correctAnswer: "25", timeLimit: 15 },
                { questionText: "Ibukota negara Indonesia adalah?", options: ["Jakarta", "Bandung", "Surabaya", "Medan"], correctAnswer: "Jakarta", timeLimit: 15 },
                { questionText: "Siapa penemu lampu pijar?", options: ["Nikola Tesla", "Thomas Edison", "Albert Einstein", "Isaac Newton"], correctAnswer: "Thomas Edison", timeLimit: 15 },
                { questionText: "Planet terbesar di tata surya kita?", options: ["Bumi", "Mars", "Saturnus", "Jupiter"], correctAnswer: "Jupiter", timeLimit: 15 }
            ];
        }

        return questions;
    } catch (error) {
        console.error("Gagal mengambil soal:", error);
        return [];
    }
}

// 2. Menyimpan Hasil Akhir ke Firestore
export async function saveGameResult(score, correctAnswers, wrongAnswers) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const xpEarned = score; // Contoh sederhana: 1 skor = 1 XP
        const isPerfect = wrongAnswers === 0;

        // A. Tambahkan XP ke profil user
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            xp: increment(xpEarned)
        });

        // B. Catat Riwayat Permainan (Untuk halaman Profil)
        await addDoc(collection(db, "activity_history"), {
            userId: user.uid,
            challengeTitle: "Kuis Cepat",
            score: score,
            earnedXp: xpEarned,
            isPerfect: isPerfect,
            playedAt: serverTimestamp()
        });

        console.log("Hasil berhasil disimpan ke database!");
    } catch (error) {
        console.error("Gagal menyimpan hasil:", error);
    }
}