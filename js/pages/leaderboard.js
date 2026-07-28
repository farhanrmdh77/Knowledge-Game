// File: js/pages/leaderboard.js
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 🔥 OPTIMASI: Tambahkan query, orderBy, dan limit pada import Firestore 🔥
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        'frame_9': { type: 'image', url: 'assets/frames/Frame9.png', scale: 115, name: 'Ocean Whisper', price: 2000 }
    },
    titles: {
        'title_default': { name: '', color: 'hidden' },
        'title_scholar': { name: 'Sang Pelajar', color: 'text-[#43A047]' },
        'title_genius': { name: 'Si Jenius', color: 'text-[#00E5FF]' },
        'title_legend': { name: 'Legenda Hidup', color: 'text-[#FFD600] drop-shadow-[0_0_5px_rgba(255,214,0,0.8)]' }
    }
};

// State Global Leaderboard
let allPlayers = [];
let currentUserUid = null;
let currentTab = 'global'; 
let currentSubject = 'all';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUserUid = user.uid;
        setupTabs();
        await fetchLeaderboardData();
    });
});

async function fetchLeaderboardData() {
    try {
        const usersRef = collection(db, "users");
        
        // 🔥 OPTIMASI: Tarik HANYA 20 orang teratas berdasarkan XP Global tertinggi 🔥
        // Jika sedang berada di tab subject, Firebase akan meload manual semuanya di memory JS bawah, 
        // tapi secara default query global ditarik seefisien mungkin!
        const q = query(usersRef, orderBy("xp", "desc"), limit(20));
        const snap = await getDocs(q);
        
        allPlayers = [];
        snap.forEach(doc => {
            const data = doc.data();
            allPlayers.push({
                id: doc.id,
                username: data.username || "Pemain",
                level: data.level || 1,
                globalXp: data.xp || 0,
                globalPoints: data.diamond || 0,
                subjectStats: data.subjects || {}, 
                avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.username || 'Pemain')}&backgroundColor=7C5CFF`,
                equippedBorder: data.equippedBorder || 'border_default',
                equippedTitle: data.equippedTitle || 'title_default'
            });
        });

        // 🔥 WAJIB: Masukkan data current user (diri sendiri) secara manual jika ternyata dia tidak masuk ke dalam Top 20 Global
        // Tujuannya agar kartu sticky "My Ranking" di bagian bawah layar tidak kosong.
        const isMeInTop20 = allPlayers.find(p => p.id === currentUserUid);
        if (!isMeInTop20 && currentUserUid) {
            const myUserRef = doc(db, "users", currentUserUid);
            const mySnap = await getDoc(myUserRef);
            if (mySnap.exists()) {
                const myData = mySnap.data();
                allPlayers.push({
                    id: currentUserUid,
                    username: myData.username || "Pemain",
                    level: myData.level || 1,
                    globalXp: myData.xp || 0,
                    globalPoints: myData.diamond || 0,
                    subjectStats: myData.subjects || {}, 
                    avatarUrl: myData.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(myData.username || 'Pemain')}&backgroundColor=7C5CFF`,
                    equippedBorder: myData.equippedBorder || 'border_default',
                    equippedTitle: myData.equippedTitle || 'title_default',
                    isForced: true // Tandai bahwa user ini dimasukkan paksa karena tidak masuk Top 20
                });
            }
        }

        renderLeaderboard();
    } catch (error) {
        console.error("Gagal mengambil data peringkat:", error);
        document.getElementById('podium-container').innerHTML = '<p class="text-danger text-center w-full">Gagal terhubung ke server.</p>';
    }
}

function renderLeaderboard() {
    let displayPlayers = allPlayers.map(p => {
        let displayXp = p.globalXp;
        let displayPoints = p.globalPoints;

        if (currentTab === 'subject' && currentSubject !== 'all') {
            displayXp = p.subjectStats[currentSubject]?.xp || 0;
            displayPoints = p.subjectStats[currentSubject]?.diamond || 0;
        }

        return {
            id: p.id,
            username: p.username,
            level: p.level,
            points: displayPoints, 
            xp: displayXp,
            avatarUrl: p.avatarUrl,
            equippedBorder: p.equippedBorder, 
            equippedTitle: p.equippedTitle,
            isForced: p.isForced
        };
    });

    if (currentTab === 'subject' && currentSubject !== 'all') {
        displayPlayers = displayPlayers.filter(p => p.xp > 0);
    }

    // URUTKAN BERDASARKAN XP LALU DIAMOND
    displayPlayers.sort((a, b) => {
        if (b.xp !== a.xp) return b.xp - a.xp; 
        return b.points - a.points;            
    });

    // Karena user kita yang dimasukkan paksa (Forced) mungkin berada di peringkat >20, 
    // Kita harus memisahkannya dari list utama (agar list murni hanya 20 orang).
    const top20Players = displayPlayers.filter((p, index) => index < 20 || p.isForced === undefined);

    const podiumContainer = document.getElementById('podium-container');
    const listContainer = document.getElementById('list-container');
    const stickyContainer = document.querySelector('.fixed.bottom-\\[96px\\]');

    if (top20Players.length === 0) {
        podiumContainer.innerHTML = '';
        listContainer.innerHTML = `
            <div class="bg-card p-8 rounded-[24px] text-center border border-white/5 flex flex-col items-center mx-6">
                <span class="material-symbols-outlined text-4xl text-textDim mb-3">sentiment_dissatisfied</span>
                <p class="font-bold text-white mb-1">No rankings available.</p>
                <p class="text-xs text-textDim mb-4">Be the first to conquer this subject!</p>
                <button onclick="window.location.href='learn.html'" class="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primaryLight transition-colors text-sm">
                    Start Learning
                </button>
            </div>
        `;
        if (stickyContainer) stickyContainer.innerHTML = ''; 
        return;
    }

    renderPodium(top20Players);
    renderList(top20Players);
    
    // Pass original displayPlayers array to current user render, so the rank is accurate!
    renderCurrentUser(displayPlayers); 
}

function renderPodium(players) {
    const container = document.getElementById('podium-container');
    let html = '';

    // ================== RANK 2 ==================
    if (players[1]) {
        const p = players[1];
        const borderObj = cosmeticsData.borders[p.equippedBorder] || cosmeticsData.borders['border_default'];
        let frameHtml = ''; let avatarClass = 'w-16 h-16 rounded-full object-cover z-0 border-[3px] border-rank2 bg-card shadow-[0_0_15px_rgba(156,163,175,0.4)] ';
        
        if (borderObj.type === 'css') avatarClass += borderObj.value;
        else if (borderObj.type === 'image') frameHtml = `<img src="${borderObj.url}" style="width: ${borderObj.scale}%; height: ${borderObj.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;

        html += `
            <div class="flex flex-col items-center w-1/3 z-10" style="animation-delay: 0.1s;">
                <div class="relative mb-2 flex items-center justify-center w-16 h-16 animate-pop">
                    <img src="${p.avatarUrl}" class="${avatarClass}">
                    ${frameHtml}
                    <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20">2</div>
                </div>
                <p class="font-bold text-xs text-white truncate w-full text-center px-1">${p.username}</p>
                <p class="text-primaryLight text-[10px] font-extrabold mb-2">${p.xp.toLocaleString('id-ID')} XP</p>
                <div class="w-full h-[80px] bg-gradient-to-t from-gray-500/40 to-transparent rounded-t-2xl border-t border-gray-500/50 podium-bar"></div>
            </div>
        `;
    } else { html += `<div class="w-1/3"></div>`; }

    // ================== RANK 1 ==================
    if (players[0]) {
        const p = players[0];
        const borderObj = cosmeticsData.borders[p.equippedBorder] || cosmeticsData.borders['border_default'];
        let frameHtml = ''; let avatarClass = 'w-20 h-20 rounded-full object-cover z-0 border-[4px] border-warning/50 bg-warning shadow-[0_0_20px_rgba(255,214,0,0.4)] ';
        
        if (borderObj.type === 'css') avatarClass += borderObj.value;
        else if (borderObj.type === 'image') frameHtml = `<img src="${borderObj.url}" style="width: ${borderObj.scale}%; height: ${borderObj.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;

        html += `
            <div class="flex flex-col items-center w-1/3 z-20" style="animation-delay: 0.3s;">
                <div class="relative mb-2 flex items-center justify-center w-20 h-20 animate-pop z-20">
                    <span class="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-warning rounded-full flex items-center justify-center text-background font-black border-2 border-background z-20 shadow-[0_0_15px_rgba(255,214,0,0.6)]">
                        <span class="material-symbols-outlined text-[18px] icon-filled">stars</span>
                    </span>
                    <img src="${p.avatarUrl}" class="${avatarClass}">
                    ${frameHtml}
                    <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-warning text-black text-[12px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20">1</div>
                </div>
                <p class="font-bold text-sm text-white truncate w-full text-center px-1 mt-1">${p.username}</p>
                <p class="text-warning text-xs font-black mb-2">${p.xp.toLocaleString('id-ID')} XP</p>
                <div class="w-full h-[120px] bg-gradient-to-t from-warning/30 to-transparent rounded-t-[24px] border-t border-warning/50 podium-bar"></div>
            </div>
        `;
    }

    // ================== RANK 3 ==================
    if (players[2]) {
        const p = players[2];
        const borderObj = cosmeticsData.borders[p.equippedBorder] || cosmeticsData.borders['border_default'];
        let frameHtml = ''; let avatarClass = 'w-16 h-16 rounded-full object-cover z-0 border-[3px] border-[#CD7F32] bg-danger shadow-[0_0_15px_rgba(205,127,50,0.4)] ';
        
        if (borderObj.type === 'css') avatarClass += borderObj.value;
        else if (borderObj.type === 'image') frameHtml = `<img src="${borderObj.url}" style="width: ${borderObj.scale}%; height: ${borderObj.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;

        html += `
            <div class="flex flex-col items-center w-1/3 z-10" style="animation-delay: 0.2s;">
                <div class="relative mb-2 flex items-center justify-center w-16 h-16 animate-pop">
                    <img src="${p.avatarUrl}" class="${avatarClass}">
                    ${frameHtml}
                    <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20">3</div>
                </div>
                <p class="font-bold text-xs text-white truncate w-full text-center px-1">${p.username}</p>
                <p class="text-primaryLight text-[10px] font-extrabold mb-2">${p.xp.toLocaleString('id-ID')} XP</p>
                <div class="w-full h-[60px] bg-gradient-to-t from-[#CD7F32]/40 to-transparent rounded-t-2xl border-t border-[#CD7F32]/50 podium-bar"></div>
            </div>
        `;
    } else { html += `<div class="w-1/3"></div>`; }

    container.innerHTML = html;
}

function renderList(players) {
    const container = document.getElementById('list-container');
    let html = '';

    for (let i = 3; i < players.length; i++) {
        const p = players[i];
        
        // Skip user yang dimasukkan paksa karena tidak tembus top 20, biarkan dia tampil di "My Ranking" saja
        if (p.isForced) continue;

        const isMe = p.id === currentUserUid;
        
        const cardBorderClass = isMe ? 'border-primary shadow-[0_0_15px_rgba(124,92,255,0.3)] bg-primary/20' : 'border-white/5 bg-card hover:bg-white/5';
        const badgeYou = isMe ? `<div class="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">YOU</div>` : '';

        // Logika Bingkai untuk List
        const borderObj = cosmeticsData.borders[p.equippedBorder] || cosmeticsData.borders['border_default'];
        let frameHtml = '';
        let avatarClass = `w-12 h-12 rounded-full object-cover z-0 ${isMe ? 'border-2 border-primary bg-primary/30' : 'border border-white/10 bg-[#E0F7FA]'} `;
        
        if (borderObj.type === 'css') avatarClass += borderObj.value;
        else if (borderObj.type === 'image') frameHtml = `<img src="${borderObj.url}" style="width: ${borderObj.scale}%; height: ${borderObj.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;

        // Logika Gelar untuk List
        const titleObj = cosmeticsData.titles[p.equippedTitle] || cosmeticsData.titles['title_default'];
        const titleHtml = titleObj.name ? `<span class="block text-[9px] font-black uppercase tracking-widest ${titleObj.color} mt-0.5">${titleObj.name}</span>` : '';

        html += `
            <div class="${cardBorderClass} p-4 rounded-[20px] flex items-center gap-4 transition-all relative animate-pop" style="animation-delay: ${0.05 * (i-1)}s;">
                ${badgeYou}
                <span class="font-black text-textDim w-5 text-center text-sm">${i + 1}</span>
                
                <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img src="${p.avatarUrl}" class="${avatarClass}">
                    ${frameHtml}
                </div>
                
                <div class="flex-grow">
                    <p class="font-bold text-sm text-white">${p.username}</p>
                    ${titleHtml || `<p class="text-[10px] text-textDim">Level ${p.level}</p>`}
                </div>
                
                <div class="text-right">
                    <span class="font-black text-[#00E5FF] flex items-center justify-end gap-1 text-sm">
                        <span class="material-symbols-outlined text-[14px] icon-filled text-[#00E5FF]">diamond</span>${p.points.toLocaleString('id-ID')}
                    </span>
                    <span class="text-xs text-textDim mt-0.5 block">${p.xp.toLocaleString('id-ID')} XP</span>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderCurrentUser(players) {
    const stickyContainer = document.querySelector('.fixed.bottom-\\[96px\\]');
    if (!stickyContainer) return;

    // Temukan rank asli user dari array lengkap yang telah diurutkan
    const myIndex = players.findIndex(p => p.id === currentUserUid);
    
    if (myIndex === -1) {
        stickyContainer.innerHTML = '';
        return; 
    }

    const p = players[myIndex];
    
    // Tampilkan label rank: Jika tidak masuk 20 besar, tulis ">20"
    const rankLabel = myIndex < 20 ? (myIndex + 1) : ">20";
    
    const xpInLevel = p.xp % 1000;
    const progressPercent = (xpInLevel / 1000) * 100;

    // Logika Bingkai untuk Sticky Bar
    const borderObj = cosmeticsData.borders[p.equippedBorder] || cosmeticsData.borders['border_default'];
    let frameHtml = '';
    let avatarClass = 'w-12 h-12 rounded-full object-cover z-0 border-2 border-primary bg-card ';
    
    if (borderObj.type === 'css') avatarClass += borderObj.value;
    else if (borderObj.type === 'image') frameHtml = `<img src="${borderObj.url}" style="width: ${borderObj.scale}%; height: ${borderObj.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;

    stickyContainer.innerHTML = `
        <div class="bg-[#2a2940] p-4 rounded-[24px] flex items-center gap-4 border border-primary shadow-[0_0_25px_rgba(124,92,255,0.25)] relative overflow-hidden backdrop-blur-lg pointer-events-auto">
            <div class="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-widest uppercase shadow-md">YOU</div>
            
            <span class="font-black text-primary w-5 text-center text-base">${rankLabel}</span>
            
            <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                <img src="${p.avatarUrl}" class="${avatarClass}">
                ${frameHtml}
            </div>
            
            <div class="flex-grow">
                <p class="font-bold text-sm text-white">${p.username}</p>
                <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-bold text-textDim">Lvl ${p.level}</span>
                    <div class="w-14 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(124,92,255,0.6)]" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>
            </div>
            
            <div class="text-right pr-2">
                <span class="font-extrabold text-[#00E5FF] flex items-center justify-end gap-1 text-sm">
                    <span class="material-symbols-outlined text-[14px] icon-filled text-[#00E5FF]">diamond</span>${p.points.toLocaleString('id-ID')}
                </span>
                <span class="text-[9px] text-textDim font-bold mt-0.5 block">${p.xp.toLocaleString('id-ID')} XP</span>
            </div>
        </div>
    `;
}

// ... [Setup Tabs tetapkan tidak ada perubahan logika, hanya memastikan nama fungsi terpanggil]
import { getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; // <-- pastikan getDoc juga di-import di paling atas jika belum.
function setupTabs() {
    const tabGlobal = document.getElementById('tab-global');
    const tabSubject = document.getElementById('tab-subject');
    const subjectFilterContainer = document.getElementById('subject-filter-container');
    const selectSubject = subjectFilterContainer.querySelector('select');

    const activeClass = ['bg-[#38374A]', 'text-white', 'shadow-sm'];
    const inactiveClass = ['text-textDim', 'hover:text-white', 'bg-transparent'];

    tabGlobal.addEventListener('click', async () => {
        currentTab = 'global';
        tabGlobal.classList.add(...activeClass);
        tabGlobal.classList.remove(...inactiveClass);
        tabSubject.classList.remove(...activeClass);
        tabSubject.classList.add(...inactiveClass);
        subjectFilterContainer.classList.add('hidden');
        
        // Show loading spinner
        document.getElementById('podium-container').innerHTML = `
            <div class="animate-pulse text-primary text-center">
                 <span class="material-symbols-outlined text-4xl animate-spin">autorenew</span>
                 <p class="text-[10px] mt-2 font-bold uppercase tracking-widest text-primaryLight">Sinkronisasi Server...</p>
            </div>
        `;
        document.getElementById('list-container').innerHTML = '';
        
        await fetchLeaderboardData(); // Refetch with limit 20
    });

    tabSubject.addEventListener('click', async () => {
        currentTab = 'subject';
        tabSubject.classList.add(...activeClass);
        tabSubject.classList.remove(...inactiveClass);
        tabGlobal.classList.remove(...activeClass);
        tabGlobal.classList.add(...inactiveClass);
        subjectFilterContainer.classList.remove('hidden');
        
        // Show loading spinner
        document.getElementById('podium-container').innerHTML = `
            <div class="animate-pulse text-primary text-center">
                 <span class="material-symbols-outlined text-4xl animate-spin">autorenew</span>
                 <p class="text-[10px] mt-2 font-bold uppercase tracking-widest text-primaryLight">Sinkronisasi Server...</p>
            </div>
        `;
        document.getElementById('list-container').innerHTML = '';
        
        // Jika masuk tab subject, kita harus tarik ulang data HANYA untuk Top 20 subject tersebut!
        // Namun karena struktur DB Anda nyarang di "subjects.math.xp", Firebase tidak bisa "orderBy" field dinamis berlapis dengan sempurna tanpa index.
        // Solusi aman: tarik limit 50-100 orang saja khusus tab ini, lalu filter di javascript.
        try {
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef); // Mengambil keseluruhan secara aman
            allPlayers = [];
            snap.forEach(doc => {
                const data = doc.data();
                allPlayers.push({
                    id: doc.id,
                    username: data.username || "Pemain",
                    level: data.level || 1,
                    globalXp: data.xp || 0,
                    globalPoints: data.diamond || 0,
                    subjectStats: data.subjects || {}, 
                    avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.username || 'Pemain')}&backgroundColor=7C5CFF`,
                    equippedBorder: data.equippedBorder || 'border_default',
                    equippedTitle: data.equippedTitle || 'title_default'
                });
            });
            renderLeaderboard();
        } catch (error) { console.error(error); }
    });

    selectSubject.addEventListener('change', (e) => {
        currentSubject = e.target.value;
        renderLeaderboard();
    });
}