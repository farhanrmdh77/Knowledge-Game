// File: js/pages/dashboard.js
import CustomAlert from '../utils/CustomAlert.js';
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const cosmeticsData = {
    borders: {
        'border_default': { type: 'css', value: 'border-white/10 border-2', name: 'Tanpa Bingkai', price: 0 },
        'frame_1': { type: 'image', url: 'assets/frames/Frame1.png', scale: 115, name: 'Abyssal Eye', price: 500 },
        'frame_2': { type: 'image', url: 'assets/frames/Frame2.png', scale: 135, name: 'Eternal Frost', price: 800 },
        'frame_3': { type: 'image', url: 'assets/frames/Frame3.png', scale: 135, name: 'Venomous Jaw', price: 1000 },
        'frame_4': { type: 'image', url: 'assets/frames/Frame4.png', scale: 105, name: 'Crimson Star', price: 1000 },
        'frame_5': { type: 'image', url: 'assets/frames/Frame5.png', scale: 120, name: 'Chill Seal', price: 1200 },
        'frame_6': { type: 'image', url: 'assets/frames/Frame6.png', scale: 110, name: 'Rubber Duck', price: 1200 },
        'frame_7': { type: 'image', url: 'assets/frames/Frame7.png', scale: 110, name: 'Lantern Festival', price: 1500 },
        'frame_8': { type: 'image', url: 'assets/frames/Frame8.png', scale: 115, name: 'Golden Glory', price: 1500 },
        'frame_9': { type: 'image', url: 'assets/frames/Frame9.png', scale: 200, name: 'Ocean Whisper', price: 2000 }
    },
    titles: {
        'title_default': { name: '', color: 'hidden' },
        'title_scholar': { name: 'Sang Pelajar', color: 'text-[#43A047]' },
        'title_genius': { name: 'Si Jenius', color: 'text-[#00E5FF]' },
        'title_legend': { name: 'Legenda Hidup', color: 'text-[#FFD600] drop-shadow-[0_0_5px_rgba(255,214,0,0.8)]' }
    }
};

const safeSetText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
const safeSetHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            let data;
            
            // ==========================================
            // SISTEM AUTO-HEALING TAHAP 2 (ANTI-ZOMBIE ACCOUNT)
            // ==========================================
            // Ambil nama dari email jika nama asli kosong (misal: "farhan@gmail.com" jadi "farhan")
            const fallbackName = user.email ? user.email.split('@')[0] : "Player";

            if (userSnap.exists()) {
                data = userSnap.data();
                
                // Jika ini adalah akun lama yang rusak (namanya kosong / tidak ada avatar)
                let needsUpdate = false;
                if (!data.username || data.username === "Pemain") {
                    data.username = fallbackName;
                    needsUpdate = true;
                }
                if (!data.avatarUrl) {
                    data.avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fallbackName)}&backgroundColor=7C5CFF`;
                    needsUpdate = true;
                }
                
                // Tambal database secara diam-diam di latar belakang
                if (needsUpdate) {
                    await updateDoc(userRef, { username: data.username, avatarUrl: data.avatarUrl });
                }

            } else {
                console.warn("⚠️ Data tidak ditemukan! Sistem membuat profil baru otomatis...");
                data = {
                    uid: user.uid,
                    username: fallbackName,
                    email: user.email || "",
                    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fallbackName)}&backgroundColor=7C5CFF`,
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
                };
                await setDoc(userRef, data);
            }

            // Mulai Proses Render UI
            const username = data.username;
            let diamond = data.diamond || 0; 
            const xp = data.xp || 0;
            const level = data.level || 1;
            const avatarUrl = data.avatarUrl;

            // Logika Streak Harian
            let currentStreak = data.streak || 0;
            const lastLoginTimestamp = data.lastLogin; 
            const todayStr = new Date().toLocaleDateString('id-ID');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('id-ID');

            let lastLoginStr = lastLoginTimestamp && typeof lastLoginTimestamp.toDate === 'function' 
                                ? lastLoginTimestamp.toDate().toLocaleDateString('id-ID') : "";
            let isStreakUpdated = false;

            if (lastLoginStr === yesterdayStr) {
                currentStreak += 1;
                isStreakUpdated = true;
            } else if (lastLoginStr !== todayStr) {
                currentStreak = 1;
                isStreakUpdated = true;
            }

            if (isStreakUpdated) {
                updateDoc(userRef, { streak: currentStreak, lastLogin: new Date() }).catch(e => console.log(e));
            }

            // ==========================================
            // RENDER KOSMETIK & PROFIL DASAR
            // ==========================================
            const equippedBorder = data.equippedBorder || 'border_default';
            const equippedTitleKey = data.equippedTitle || 'title_default';
            
            const borderObj = cosmeticsData.borders[equippedBorder] || cosmeticsData.borders['border_default'];
            const titleObj = cosmeticsData.titles[equippedTitleKey] || cosmeticsData.titles['title_default'];

            const avatarContainer = document.getElementById('avatar-container');
            const avatarImg = document.getElementById('db-avatar');

            if (avatarContainer && avatarImg) {
                // Sapu bersih bingkai PNG lama
                const existingFrame = document.getElementById('custom-image-frame');
                if (existingFrame) existingFrame.remove();

                avatarImg.src = avatarUrl;
                avatarImg.className = "w-full h-full rounded-full object-cover z-0 transition-all";

                if (borderObj.type === 'css') {
                    avatarImg.classList.add(...borderObj.value.split(' '));
                } else if (borderObj.type === 'image') {
                    const frameImg = document.createElement('img');
                    frameImg.id = 'custom-image-frame';
                    frameImg.src = borderObj.url;
                    frameImg.style.width = `${borderObj.scale}%`;
                    frameImg.style.height = `${borderObj.scale}%`;
                    frameImg.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10`;
                    avatarContainer.appendChild(frameImg);
                }
            }

            if (titleObj.name) {
                safeSetHTML('db-username', `${username} <span class="block text-[9px] font-black uppercase tracking-widest mt-1 ${titleObj.color}">${titleObj.name}</span>`);
            } else {
                safeSetText('db-username', username);
            }
            
            safeSetText('db-streak', currentStreak); 
            safeSetText('db-diamond', diamond.toLocaleString('id-ID'));
            
            safeSetText('db-level-text', `Level ${level} • Keep going!`);
            safeSetText('db-xp-text', `${xp % 1000} / 1000 XP (Total: ${xp} XP)`);
            
            setTimeout(() => {
                const progressBar = document.getElementById('db-xp-bar');
                if (progressBar) progressBar.style.width = `${(xp % 1000) / 10}%`;
            }, 300);

            // Logika Daily Reward
            const btnClaim = document.getElementById('btn-claim-reward');
            if (btnClaim) {
                if (data.lastDailyReward === todayStr) {
                    btnClaim.textContent = "CLAIMED";
                    btnClaim.disabled = true;
                    btnClaim.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    const newBtnClaim = btnClaim.cloneNode(true);
                    btnClaim.parentNode.replaceChild(newBtnClaim, btnClaim);

                    newBtnClaim.addEventListener('click', async () => {
                        newBtnClaim.textContent = "Processing...";
                        newBtnClaim.disabled = true;
                        try {
                            await updateDoc(userRef, { diamond: increment(150), lastDailyReward: todayStr });
                            diamond += 150;
                            safeSetText('db-diamond', diamond.toLocaleString('id-ID'));
                            
                            await CustomAlert.success("Bonus Diklaim!", "150 Diamond harian telah ditambahkan ke akun Anda.");
                            
                            newBtnClaim.textContent = "CLAIMED";
                            newBtnClaim.classList.add('opacity-50', 'cursor-not-allowed');
                            await loadLeaderboardPreview(user.uid);
                        } catch (err) {
                            CustomAlert.error("Gagal Mengklaim", "Periksa koneksi internet Anda dan coba lagi.");
                            newBtnClaim.textContent = "CLAIM";
                            newBtnClaim.disabled = false;
                        }
                    });
                }
            }

            // Statistik Activity
            const historyRef = collection(db, "activity_history");
            const q = query(historyRef, where("userId", "==", user.uid));
            const historySnap = await getDocs(q);
            
            let totalChallenges = historySnap.size;
            let totalAccuracySum = 0;
            historySnap.forEach(doc => totalAccuracySum += (doc.data().accuracy || 0));

            safeSetText('stat-solved', totalChallenges);
            safeSetText('stat-accuracy', totalChallenges > 0 ? `${Math.round(totalAccuracySum / totalChallenges)}%` : '0%');

            await loadLeaderboardPreview(user.uid);

        } catch (error) {
            console.error("❌ Gagal memuat data dashboard:", error);
        }
    });

    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) btnContinue.addEventListener('click', () => window.location.href = 'learn.html');
});

async function loadLeaderboardPreview(currentUid) {
    const container = document.getElementById('leaderboard-preview-container');
    if (!container) return;

    try {
        const snap = await getDocs(collection(db, "users"));
        let players = [];
        snap.forEach(doc => {
            const d = doc.data();
            // Fallback nama menggunakan email jika tidak ada
            const fbName = d.email ? d.email.split('@')[0] : "Player";
            players.push({
                id: doc.id, 
                username: d.username && d.username !== "Pemain" ? d.username : fbName, 
                points: d.diamond || 0, 
                xp: d.xp || 0,
                avatarUrl: d.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fbName)}&backgroundColor=7C5CFF`,
                equippedBorder: d.equippedBorder || 'border_default', 
                equippedTitle: d.equippedTitle || 'title_default'
            });
        });

        players.sort((a, b) => b.xp !== a.xp ? b.xp - a.xp : b.points - a.points);
        const topPlayers = players.slice(0, 3);
        
        if (topPlayers.length === 0) {
            container.innerHTML = `<p class="text-center text-xs text-textDim py-4">Belum ada data peringkat.</p>`;
            return;
        }

        let html = '';
        topPlayers.forEach((p, index) => {
            const isMe = p.id === currentUid;
            const rank = index + 1;
            const rankColor = rank === 1 ? 'text-[#FFD600]' : rank === 2 ? 'text-[#C0C0C0]' : 'text-[#CD7F32]';
            const bgMe = isMe ? 'bg-primary/10 border border-primary/30' : '';
            
            const borderObj = cosmeticsData.borders[p.equippedBorder] || cosmeticsData.borders['border_default'];
            let frameHtml = '';
            let avatarClass = 'w-10 h-10 rounded-full object-cover z-0 ';
            
            if (borderObj.type === 'css') {
                avatarClass += borderObj.value;
            } else if (borderObj.type === 'image') {
                frameHtml = `<img src="${borderObj.url}" style="width: ${borderObj.scale}%; height: ${borderObj.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;
            }

            const titleObj = cosmeticsData.titles[p.equippedTitle] || cosmeticsData.titles['title_default'];
            const titleHtml = titleObj.name ? `<span class="block text-[8px] font-black uppercase tracking-widest ${titleObj.color} mt-0.5">${titleObj.name}</span>` : '';

            html += `
                <div class="flex items-center justify-between p-3 rounded-2xl ${bgMe} mb-1 transition-all">
                    <div class="flex items-center gap-3">
                        <span class="font-black text-sm w-5 text-center ${rankColor}">#${rank}</span>
                        
                        <div class="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <img src="${p.avatarUrl}" class="${avatarClass}">
                            ${frameHtml}
                        </div>
                        
                        <div>
                            <span class="font-bold text-sm text-white flex items-center">${p.username} ${isMe ? '<span class="text-primary text-[9px] font-black ml-1 bg-primary/20 px-1 py-0.5 rounded">YOU</span>' : ''}</span>
                            ${titleHtml}
                        </div>
                    </div>
                    <span class="font-extrabold text-primaryLight text-xs">${p.xp.toLocaleString('id-ID')} XP</span>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p class="text-center text-xs text-textDim py-4">Gagal memuat peringkat.</p>`;
    }
}