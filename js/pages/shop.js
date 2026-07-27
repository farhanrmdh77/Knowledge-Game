// File: js/pages/shop.js
import CustomAlert from '../utils/CustomAlert.js';
import { auth, db } from '../config/firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// === KATALOG KOSMETIK ===
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
        'title_default': { name: 'Pemula', price: 0, color: 'text-textDim' },
        'title_scholar': { name: 'Sang Pelajar', price: 300, color: 'text-[#43A047]' },
        'title_genius': { name: 'Si Jenius', price: 600, color: 'text-[#00E5FF]' },
        'title_legend': { name: 'Legenda Hidup', price: 1500, color: 'text-[#FFD600] drop-shadow-[0_0_5px_rgba(255,214,0,0.8)]' }
    }
};

// State Data User
let userRef = null;
let userDiamond = 0;
let inventory = []; 
let equippedBorder = 'border_default';
let equippedTitle = 'title_default';
let avatarUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        userRef = doc(db, "users", user.uid);
        await loadUserData(user);
    });
});

async function loadUserData(user) {
    try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            userDiamond = data.diamond || 0;
            
            // Baca Inventaris dari database
            inventory = data.inventory || ['border_default', 'title_default'];
            equippedBorder = data.equippedBorder || 'border_default';
            equippedTitle = data.equippedTitle || 'title_default';
            avatarUrl = data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.username || 'User')}&backgroundColor=7C5CFF`;

            document.getElementById('shop-diamond').textContent = userDiamond.toLocaleString('id-ID');
            
            renderShop();
        }
    } catch (e) {
        console.error("Gagal memuat data toko:", e);
    }
}

function renderShop() {
    const bordersContainer = document.getElementById('shop-borders');
    const titlesContainer = document.getElementById('shop-titles');
    
    bordersContainer.innerHTML = '';
    titlesContainer.innerHTML = '';

    // =====================================
    // RENDER BINGKAI (BORDERS)
    // =====================================
    for (const [key, item] of Object.entries(cosmeticsData.borders)) {
        const isOwned = inventory.includes(key) || item.price === 0; 
        const isEquipped = equippedBorder === key;
        
        let frameHtml = '';
        let avatarClass = 'w-full h-full rounded-full object-cover z-0 bg-background transition-all ';
        
        if (item.type === 'css') {
            avatarClass += item.value;
        } else if (item.type === 'image') {
            // KUNCI PERBAIKAN: Menggunakan Inline Style dan max-w-none
            frameHtml = `<img src="${item.url}" style="width: ${item.scale}%; height: ${item.scale}%;" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none z-10">`;
        }

        bordersContainer.innerHTML += `
            <div class="bg-card p-4 rounded-[24px] border ${isEquipped ? 'border-primary shadow-[0_0_15px_rgba(124,92,255,0.3)]' : 'border-white/5'} flex flex-col items-center text-center gap-3 relative transition-all duration-300">
                ${isEquipped ? '<span class="absolute top-2 right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md z-20">EQUIPPED</span>' : ''}
                
                <div class="relative w-16 h-16 mt-4 flex items-center justify-center flex-shrink-0">
                    <img src="${avatarUrl}" class="${avatarClass}">
                    ${frameHtml}
                </div>
                
                <div class="mt-2 w-full h-10 flex items-center justify-center">
                    <h4 class="font-bold text-xs sm:text-sm text-white">${item.name}</h4>
                </div>
                
                <div class="w-full mt-auto">
                    ${generateButtonHTML(key, item, isOwned, isEquipped, 'border')}
                </div>
            </div>
        `;
    }

    // =====================================
    // RENDER GELAR (TITLES)
    // =====================================
    for (const [key, item] of Object.entries(cosmeticsData.titles)) {
        const isOwned = inventory.includes(key) || item.price === 0;
        const isEquipped = equippedTitle === key;

        titlesContainer.innerHTML += `
            <div class="bg-card p-4 rounded-[20px] border ${isEquipped ? 'border-primary shadow-[0_0_15px_rgba(124,92,255,0.2)]' : 'border-white/5'} flex justify-between items-center transition-all">
                <div>
                    <h4 class="font-black text-sm tracking-widest uppercase ${item.color}">${item.name}</h4>
                </div>
                <div class="w-1/3 min-w-[80px]">
                    ${generateButtonHTML(key, item, isOwned, isEquipped, 'title')}
                </div>
            </div>
        `;
    }

    attachButtonListeners();
}

function generateButtonHTML(itemId, item, isOwned, isEquipped, type) {
    if (isEquipped) {
        return `<button disabled class="bg-white/10 text-white/50 w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed">In Use</button>`;
    }
    if (isOwned) {
        return `<button data-action="equip" data-id="${itemId}" data-type="${type}" class="shop-btn bg-card border border-primary text-primary hover:bg-primary hover:text-white active:scale-95 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all">Equip</button>`;
    }
    return `
        <button data-action="buy" data-id="${itemId}" data-price="${item.price}" data-name="${item.name}" class="shop-btn bg-[#00E5FF] text-black w-full px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            ${item.price} <span class="material-symbols-outlined text-[14px] icon-filled">diamond</span>
        </button>
    `;
}

function attachButtonListeners() {
    document.querySelectorAll('.shop-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            const itemId = e.currentTarget.getAttribute('data-id');

            if (action === 'buy') {
                const price = parseInt(e.currentTarget.getAttribute('data-price'));
                const itemName = e.currentTarget.getAttribute('data-name');
                await processPurchase(itemId, itemName, price, e.currentTarget);
            } else if (action === 'equip') {
                const type = e.currentTarget.getAttribute('data-type');
                await processEquip(itemId, type, e.currentTarget);
            }
        });
    });
}

// === LOGIKA PEMBELIAN ===
async function processPurchase(itemId, itemName, price, btnElement) {
    if (userDiamond < price) {
        await CustomAlert.error("Diamond Kurang!", `Anda membutuhkan ${price - userDiamond} Diamond lagi untuk membeli ${itemName}.`);
        return;
    }

    const confirmBuy = await CustomAlert.confirm(
        "Konfirmasi Pembelian", 
        `Yakin ingin membeli ${itemName} seharga ${price} Diamond?`,
        "Ya, Beli"
    );
    
    if (!confirmBuy) return;

    btnElement.disabled = true;
    btnElement.textContent = "Proses...";

    try {
        inventory.push(itemId);
        userDiamond -= price;

        await updateDoc(userRef, {
            diamond: increment(-price),
            inventory: inventory
        });

        await CustomAlert.success("Pembelian Berhasil!", `${itemName} telah ditambahkan ke koleksi Anda dan siap digunakan.`);
        
        document.getElementById('shop-diamond').textContent = userDiamond.toLocaleString('id-ID');
        renderShop(); 
    } catch (error) {
        console.error("Gagal membeli:", error);
        CustomAlert.error("Gagal", "Terjadi kesalahan sistem saat pembelian. Coba lagi.");
        btnElement.disabled = false;
    }
}

// === LOGIKA PEMASANGAN (EQUIP) ===
async function processEquip(itemId, type, btnElement) {
    btnElement.disabled = true;
    btnElement.textContent = "Equipping...";

    try {
        let updates = {};
        if (type === 'border') {
            updates.equippedBorder = itemId;
            equippedBorder = itemId;
        } else if (type === 'title') {
            updates.equippedTitle = itemId;
            equippedTitle = itemId;
        }

        await updateDoc(userRef, updates);
        
        // Refresh UI Toko secara instan agar tombol berubah jadi "In Use"
        renderShop(); 
    } catch (error) {
        console.error("Gagal memasang item:", error);
        CustomAlert.error("Gagal Memasang", "Periksa koneksi internet Anda dan coba lagi.");
        btnElement.disabled = false;
    }
}