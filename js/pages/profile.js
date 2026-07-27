// File: js/pages/profile.js
import CustomAlert from '../utils/CustomAlert.js';
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const cosmeticsData = {
    borders: {
        'border_default': { type: 'css', value: 'border-white/10 border-2', name: 'Tanpa Bingkai', price: 0 },
        
        // SISTEM KALIBRASI BARU: Cukup tulis angka persentasenya (tanpa persen atau w-). 
        // 100 = pas dengan foto. Jika longgar turunkan ke 95, jika kekecilan naikkan ke 115, 120, dst.
        'frame_1': { type: 'image', url: 'assets/frames/Frame1.png', scale: 115, name: 'Bebek Laut', price: 500 },
        'frame_2': { type: 'image', url: 'assets/frames/Frame2.png', scale: 135, name: 'Sayap Naga', price: 800 },
        'frame_3': { type: 'image', url: 'assets/frames/Frame3.png', scale: 135, name: 'Frame 3', price: 1000 },
        'frame_4': { type: 'image', url: 'assets/frames/Frame4.png', scale: 105, name: 'Frame 4', price: 1000 },
        'frame_5': { type: 'image', url: 'assets/frames/Frame5.png', scale: 120, name: 'Frame 5', price: 1200 },
        'frame_6': { type: 'image', url: 'assets/frames/Frame6.png', scale: 110, name: 'Frame 6', price: 1200 },
        'frame_7': { type: 'image', url: 'assets/frames/Frame7.png', scale: 110, name: 'Frame 7', price: 1500 },
        'frame_8': { type: 'image', url: 'assets/frames/Frame8.png', scale: 115, name: 'Frame 8', price: 1500 },
        'frame_9': { type: 'image', url: 'assets/frames/Frame9.png', scale: 115, name: 'Mahkota Raja', price: 2000 }
    },  
    titles: {
        'title_default': { name: '', color: 'hidden' },
        'title_scholar': { name: 'Sang Pelajar', color: 'text-[#43A047]' },
        'title_genius': { name: 'Si Jenius', color: 'text-[#00E5FF]' },
        'title_legend': { name: 'Legenda Hidup', color: 'text-[#FFD600] drop-shadow-[0_0_5px_rgba(255,214,0,0.8)]' }
    }
};

// Variabel Global Data User
let currentUserRef = null; 
let currentUsername = "";
let totalQuizzesCompleted = 0;
let totalPerfects = 0;
let userXP = 0;
let currentAvatarUrl = "";
let newAvatarBase64 = null; 
let claimedAchievements = []; 

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUserRef = doc(db, "users", user.uid); 

        await loadUserProfile(user);
        await loadUserStatistics(user.uid);
        
        setupModals(user);
        updateAchievementBadge(); 
    });

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            const konfirmasi = await CustomAlert.confirm(
                "Keluar dari Akun?", 
                "Sesi belajar Anda akan diakhiri. Yakin ingin keluar?", 
                "Ya, Keluar"
            );
            
            if (konfirmasi) {
                try {
                    localStorage.clear(); 
                    await signOut(auth);
                    window.location.href = 'login.html';
                } catch (error) {
                    CustomAlert.error("Gagal!", "Terjadi kesalahan saat logout.");
                }
            }
        });
    }
});

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval >= 1) {
        if (Math.floor(interval) === 1) return "Yesterday";
        return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}

function getLeague(xp) {
    if (xp >= 20000) return { name: "Diamond League", icon: "diamond", color: "text-[#00E5FF]", border: "border-[#00E5FF]/30", bg: "bg-[#00E5FF]/10" };
    if (xp >= 10000) return { name: "Gold League", icon: "workspace_premium", color: "text-warning", border: "border-warning/30", bg: "bg-warning/10" };
    if (xp >= 5000) return { name: "Silver League", icon: "military_tech", color: "text-textDim", border: "border-textDim/30", bg: "bg-white/5" };
    return { name: "Bronze League", icon: "shield", color: "text-[#CD7F32]", border: "border-[#CD7F32]/30", bg: "bg-[#CD7F32]/10" };
}

// === MEMUAT DATA UTAMA & KOSMETIK ===
async function loadUserProfile(user) {
    try {
        const snap = await getDoc(currentUserRef);

        if (snap.exists()) {
            const data = snap.data();
            currentUsername = data.username || "Pemain";
            userXP = data.xp || 0;
            claimedAchievements = data.claimedAchievements || []; 
            const currentLevel = data.level || 1;
            const xpInLevel = userXP % 1000;
            
            currentAvatarUrl = data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUsername)}&backgroundColor=7C5CFF`;
            
            const safeSetText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
            const safeSetClass = (id, className) => { const el = document.getElementById(id); if (el) el.className = className; };
            
            safeSetText('display-name', currentUsername);
            safeSetText('display-username', `@${currentUsername.replace(/\s+/g, '')}`);
            
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) profileAvatar.src = currentAvatarUrl;

            // ==========================================
            // LOGIKA RENDER BINGKAI & GELAR TERBARU
            // ==========================================
            const equippedBorder = data.equippedBorder || 'border_default';
            const equippedTitleKey = data.equippedTitle || 'title_default';

            const borderObj = cosmeticsData.borders[equippedBorder] || cosmeticsData.borders['border_default'];
            const titleObj = cosmeticsData.titles[equippedTitleKey] || cosmeticsData.titles['title_default'];

            const borderContainer = document.getElementById('avatar-border-container');
            if (borderContainer && profileAvatar) {
                // Hapus bingkai gambar lama jika ada
                const existingFrame = document.getElementById('profile-image-frame');
                if (existingFrame) existingFrame.remove();

                // Kembalikan class dasar avatar
                profileAvatar.className = "w-full h-full rounded-full object-cover z-0 transition-all";

                if (borderObj.type === 'css') {
                    profileAvatar.classList.add(...borderObj.value.split(' '));
                } else if (borderObj.type === 'image') {
                    const frameImg = document.createElement('img');
                    frameImg.id = 'profile-image-frame';
                    frameImg.src = borderObj.url;
                    frameImg.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${borderObj.scale} object-contain pointer-events-none z-10`;
                    borderContainer.appendChild(frameImg);
                }
            }

            const titleEl = document.getElementById('display-title');
            if (titleEl) {
                if (titleObj && titleObj.name) {
                    titleEl.textContent = titleObj.name;
                    titleEl.className = `text-[11px] font-black tracking-widest uppercase mb-1 ${titleObj.color} block`;
                } else {
                    titleEl.classList.add('hidden');
                }
            }
            
            // Render Liga
            const league = getLeague(userXP);
            safeSetText('league-icon', league.icon);
            safeSetClass('league-icon', `material-symbols-outlined text-[16px] icon-filled ${league.color}`);
            safeSetText('league-text', league.name);
            safeSetClass('league-text', `text-xs font-bold ${league.color}`);
            safeSetClass('league-container', `inline-flex items-center gap-1.5 border px-4 py-1.5 rounded-full mb-6 transition-colors ${league.bg} ${league.border}`);

            // Render Level & XP
            safeSetText('display-level', currentLevel);
            safeSetText('display-xp', `${xpInLevel} / 1000 XP`);

            setTimeout(() => {
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) progressBar.style.width = `${(xpInLevel / 1000) * 100}%`;
            }, 500);
        }
    } catch (e) { console.error("Gagal memuat profil:", e); }
}

async function loadUserStatistics(uid) {
    try {
        const historyRef = collection(db, "activity_history");
        const q = query(historyRef, where("userId", "==", uid));
        const snap = await getDocs(q);
        
        totalQuizzesCompleted = snap.size;
        totalPerfects = 0;
        let totalAccuracySum = 0;
        let allActivities = [];
        
        snap.forEach(doc => {
            const data = doc.data();
            totalAccuracySum += (data.accuracy || 0);
            if (data.accuracy === 100) totalPerfects++;
            allActivities.push(data);
        });

        allActivities.sort((a, b) => {
            const timeA = a.playedAt ? a.playedAt.toDate().getTime() : 0;
            const timeB = b.playedAt ? b.playedAt.toDate().getTime() : 0;
            return timeB - timeA; 
        });

        let avgAccuracy = 0;
        if (totalQuizzesCompleted > 0) {
            avgAccuracy = Math.round(totalAccuracySum / totalQuizzesCompleted);
        }

        document.getElementById('stat-challenges').textContent = totalQuizzesCompleted;
        document.getElementById('stat-perfects').textContent = totalPerfects;
        document.getElementById('stat-accuracy').textContent = `${avgAccuracy}%`;

        renderRecentActivity(allActivities.slice(0, 3));
        window.fullActivityHistory = allActivities;

    } catch (e) { 
        console.error("Gagal memuat statistik:", e); 
        document.getElementById('recent-activity-list').innerHTML = `<div class="p-6 text-center text-sm text-textDim">Gagal memuat riwayat kuis.</div>`;
    }
}

function renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity-list');
    if (activities.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-sm text-textDim">Belum ada riwayat kuis. Mulai belajar!</div>`;
        return;
    }
    let html = '';
    activities.forEach(data => {
        const xpEarned = data.earnedXp || 0;
        const dateObj = data.playedAt ? data.playedAt.toDate() : new Date();
        html += `
            <div class="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                <div>
                    <p class="font-bold text-sm text-white mb-0.5">${data.challengeTitle || 'Quiz'}</p>
                    <p class="text-[11px] text-textDim">Completed • ${timeAgo(dateObj)}</p>
                </div>
                <span class="font-extrabold text-primary text-sm">+${xpEarned} XP</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

// === LOGIKA JENDELA MODAL ===
function setupModals(user) {
    const btnEditAvatar = document.getElementById('btn-edit-avatar');
    const menuEdit = document.getElementById('menu-edit-profile');
    const menuHistory = document.getElementById('menu-history');
    const menuAchievements = document.getElementById('menu-achievements');

    const modalEdit = document.getElementById('modal-edit-profile');
    const modalHistory = document.getElementById('modal-history');
    const modalAchievements = document.getElementById('modal-achievements');

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modalEdit.classList.add('translate-y-full');
            modalHistory.classList.add('translate-y-full');
            modalAchievements.classList.add('translate-y-full');
        });
    });

    const openEdit = () => {
        document.getElementById('input-edit-username').value = currentUsername;
        document.getElementById('input-edit-password').value = "";
        const previewAvatar = document.getElementById('edit-preview-avatar');
        if (previewAvatar) previewAvatar.src = currentAvatarUrl;
        newAvatarBase64 = null; 
        document.getElementById('edit-msg').classList.add('hidden');
        modalEdit.classList.remove('translate-y-full');
    };
    if (btnEditAvatar) btnEditAvatar.addEventListener('click', openEdit);
    if (menuEdit) menuEdit.addEventListener('click', openEdit);

    if (menuHistory) {
        menuHistory.addEventListener('click', () => {
            renderFullHistory();
            modalHistory.classList.remove('translate-y-full');
        });
    }

    if (menuAchievements) {
        menuAchievements.addEventListener('click', () => {
            renderAchievements();
            modalAchievements.classList.remove('translate-y-full');
        });
    }

    const fileInput = document.getElementById('input-edit-photo');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert("Ukuran foto terlalu besar! Maksimal 2MB.");
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    newAvatarBase64 = event.target.result; 
                    const previewAvatar = document.getElementById('edit-preview-avatar');
                    if (previewAvatar) previewAvatar.src = newAvatarBase64;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            const newUsername = document.getElementById('input-edit-username').value.trim();
            const newPassword = document.getElementById('input-edit-password').value;
            const msg = document.getElementById('edit-msg');
            
            if (!newUsername) return;
            
            btnSaveProfile.textContent = "Menyimpan...";
            btnSaveProfile.disabled = true;

            try {
                let updates = {};
                let isChanged = false;

                if (newUsername !== currentUsername) {
                    updates.username = newUsername;
                    isChanged = true;
                }

                if (newAvatarBase64) {
                    updates.avatarUrl = newAvatarBase64;
                    isChanged = true;
                }

                if (isChanged) {
                    await updateDoc(doc(db, "users", user.uid), updates);
                    
                    if (updates.username) {
                        currentUsername = newUsername;
                        document.getElementById('display-name').textContent = newUsername;
                        document.getElementById('display-username').textContent = `@${newUsername.replace(/\s+/g, '')}`;
                    }
                    if (updates.avatarUrl) {
                        currentAvatarUrl = newAvatarBase64;
                        document.getElementById('profile-avatar').src = currentAvatarUrl;
                        localStorage.setItem('cachedAvatar', currentAvatarUrl); 
                    }
                }

                if (newPassword.length > 0) {
                    if (newPassword.length < 6) {
                        throw { code: 'auth/weak-password' }; 
                    }
                    await updatePassword(user, newPassword);
                }

                msg.textContent = "Profil berhasil diperbarui!";
                msg.className = "text-center text-xs mt-3 text-success block";
                setTimeout(() => { modalEdit.classList.add('translate-y-full'); }, 1500);

            } catch (error) {
                console.error("Error Edit Profile:", error);
                
                msg.className = "text-center text-[11px] mt-3 text-danger block";
                
                if (error.code === 'auth/requires-recent-login') {
                    msg.textContent = "Sistem Keamanan: Silakan Logout lalu Login kembali untuk mengubah password.";
                } else if (error.code === 'auth/weak-password') {
                    msg.textContent = "Gagal: Password baru harus minimal 6 karakter!";
                } else {
                    msg.textContent = "Gagal menyimpan perubahan. Coba lagi.";
                }
                
            } finally {
                btnSaveProfile.textContent = "Save Changes";
                btnSaveProfile.disabled = false;
            }
        });
    }
}

function renderFullHistory() {
    const container = document.getElementById('full-history-list');
    const activities = window.fullActivityHistory || [];

    if (activities.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-sm text-textDim">Belum ada riwayat kuis.</div>`;
        return;
    }

    let html = '';
    activities.forEach(data => {
        const xpEarned = data.earnedXp || 0;
        const score = data.score || 0;
        const dateObj = data.playedAt ? data.playedAt.toDate() : new Date();
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        html += `
            <div class="bg-card p-4 rounded-2xl border border-white/5 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                <div class="flex justify-between items-start border-b border-white/5 pb-2">
                    <h4 class="font-bold text-sm text-white">${data.challengeTitle || 'Quiz'}</h4>
                    <span class="font-bold text-primaryLight text-xs">${score} Pts</span>
                </div>
                <div class="flex justify-between items-center pt-1">
                    <span class="text-[10px] text-textDim">${dateStr}</span>
                    <span class="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] font-bold">+${xpEarned} XP</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateAchievementBadge() {
    const menuAchievements = document.getElementById('menu-achievements');
    if (!menuAchievements) return;

    const badges = [
        { id: 'first_quiz', req: totalQuizzesCompleted >= 1 },
        { id: 'perfect_score', req: totalPerfects >= 1 },
        { id: 'quiz_master', req: totalQuizzesCompleted >= 50 },
        { id: 'diamond_league', req: userXP >= 20000 }
    ];

    let claimableCount = 0;
    badges.forEach(b => {
        if (b.req && !claimedAchievements.includes(b.id)) {
            claimableCount++;
        }
    });

    let badgeEl = document.getElementById('achievements-badge');

    if (claimableCount > 0) {
        if (!badgeEl) {
            badgeEl = document.createElement('span');
            badgeEl.id = 'achievements-badge';
            badgeEl.className = 'bg-[#FF1744] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ml-auto shadow-[0_0_8px_rgba(255,23,68,0.6)] animate-pulse';
            menuAchievements.appendChild(badgeEl);
        }
        badgeEl.textContent = claimableCount;
    } else {
        if (badgeEl) {
            badgeEl.remove();
        }
    }
}

function renderAchievements() {
    const container = document.getElementById('achievements-grid');
    
    const badges = [
        { id: 'first_quiz', title: 'First Quiz', desc: 'Selesaikan kuis pertama Anda', icon: 'flag', req: totalQuizzesCompleted >= 1, reward: 50 },
        { id: 'perfect_score', title: 'Perfect Score', desc: 'Dapatkan akurasi 100% pada kuis', icon: 'verified', req: totalPerfects >= 1, reward: 150 },
        { id: 'quiz_master', title: 'Quiz Master', desc: 'Selesaikan 50 tantangan', icon: 'local_fire_department', req: totalQuizzesCompleted >= 50, reward: 1000 },
        { id: 'diamond_league', title: 'Diamond League', desc: 'Capai minimal 20.000 XP', icon: 'diamond', req: userXP >= 20000, reward: 2000 }
    ];

    let html = '';
    badges.forEach(b => {
        const isUnlocked = b.req;
        const isClaimed = claimedAchievements.includes(b.id); 

        let bgClass = 'bg-[#181824] border-white/5 opacity-60 grayscale';
        let iconColor = 'text-textDim';
        let actionHtml = `<span class="material-symbols-outlined absolute top-4 right-4 text-[16px] text-textDim">lock</span>`;

        if (isClaimed) {
            bgClass = 'bg-card border-white/10';
            iconColor = 'text-primary opacity-50';
            actionHtml = `<span class="absolute top-4 right-4 text-[11px] font-bold text-success flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">check_circle</span> Claimed</span>`;
        } else if (isUnlocked) {
            bgClass = 'bg-card border-primary/40 shadow-[0_4px_15px_rgba(124,92,255,0.15)]';
            iconColor = 'text-warning drop-shadow-[0_0_10px_rgba(255,214,0,0.5)]';
            actionHtml = `
                <button data-id="${b.id}" data-reward="${b.reward}" class="btn-claim-ach absolute top-3 right-3 bg-[#00E5FF] text-black font-extrabold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95 transition-transform">
                    CLAIM <span class="material-symbols-outlined text-[12px] icon-filled">diamond</span>${b.reward}
                </button>
            `;
        }

        html += `
            <div class="${bgClass} p-4 rounded-2xl border flex items-center gap-4 relative transition-all min-h-[80px]">
                ${actionHtml}
                <div class="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-white/5 flex-shrink-0">
                    <span class="material-symbols-outlined ${iconColor} text-2xl icon-filled">${b.icon}</span>
                </div>
                <div class="pr-16">
                    <h4 class="font-bold text-sm ${isUnlocked || isClaimed ? 'text-white' : 'text-textDim'}">${b.title}</h4>
                    <p class="text-[10px] text-textDim leading-tight mt-0.5">${b.desc}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    document.querySelectorAll('.btn-claim-ach').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const badgeId = e.currentTarget.getAttribute('data-id');
            const reward = parseInt(e.currentTarget.getAttribute('data-reward'));
            await processClaimReward(badgeId, reward, e.currentTarget);
        });
    });
}

async function processClaimReward(badgeId, reward, btnElement) {
    if (!currentUserRef) return;

    btnElement.disabled = true;
    btnElement.textContent = "Wait...";
    btnElement.classList.replace('bg-[#00E5FF]', 'bg-white/20');

    try {
        await updateDoc(currentUserRef, {
            diamond: increment(reward),
            claimedAchievements: arrayUnion(badgeId)
        });

        claimedAchievements.push(badgeId);

        renderAchievements();
        updateAchievementBadge(); 

        await CustomAlert.success("Hebat!", `Selamat! Anda mendapatkan ${reward} Diamond dari pencapaian ini!`);

    } catch (error) {
        console.error("Gagal klaim achievement:", error);
        
        CustomAlert.error("Gagal", "Gagal mengklaim hadiah. Periksa koneksi internet Anda dan coba lagi.");
        
        btnElement.disabled = false;
        btnElement.classList.replace('bg-white/20', 'bg-[#00E5FF]');
        btnElement.innerHTML = `CLAIM <span class="material-symbols-outlined text-[12px] icon-filled">diamond</span>${reward}`;
    }
}