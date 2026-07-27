// File: js/utils/CustomAlert.js

class CustomAlert {
    static create(options) {
        return new Promise((resolve) => {
            // Hapus pop-up lama jika ada yang menumpuk
            const existing = document.getElementById('custom-alert-overlay');
            if (existing) existing.remove();

            // Buat Latar Belakang Gelap (Overlay)
            const overlay = document.createElement('div');
            overlay.id = 'custom-alert-overlay';
            overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0';

            // Tema Warna dan Ikon
            const typeColors = {
                success: 'text-success drop-shadow-[0_0_10px_rgba(0,230,118,0.6)]',
                error: 'text-danger drop-shadow-[0_0_10px_rgba(255,23,68,0.6)]',
                warning: 'text-[#FFD600] drop-shadow-[0_0_10px_rgba(255,214,0,0.6)]',
                info: 'text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]'
            };
            const typeIcons = { success: 'check_circle', error: 'cancel', warning: 'warning', info: 'info' };

            const color = typeColors[options.type || 'info'];
            const icon = typeIcons[options.type || 'info'];
            const showCancel = options.showCancel || false;

            // Template HTML Pop-up
            overlay.innerHTML = `
                <div class="bg-card border border-white/10 p-6 rounded-[28px] w-[85%] max-w-sm shadow-[0_15px_40px_rgba(0,0,0,0.5)] transform scale-95 transition-all duration-300 text-center relative" id="custom-alert-box">
                    <span class="material-symbols-outlined icon-filled text-6xl mb-2 ${color}">${icon}</span>
                    <h3 class="text-xl font-extrabold text-white mb-2">${options.title || 'Pemberitahuan'}</h3>
                    <p class="text-sm text-textDim mb-6 leading-relaxed">${options.text || ''}</p>
                    
                    <div class="flex justify-center gap-3 w-full">
                        ${showCancel ? `<button id="custom-alert-cancel" class="flex-1 py-3 rounded-[16px] font-bold text-sm bg-white/5 border border-white/5 text-white hover:bg-white/10 active:scale-95 transition-all">Batal</button>` : ''}
                        <button id="custom-alert-confirm" class="flex-1 py-3 rounded-[16px] font-bold text-sm bg-primary text-white shadow-[0_4px_15px_rgba(124,92,255,0.4)] hover:bg-primaryLight active:scale-95 transition-all">${options.confirmText || 'OK'}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Animasi Masuk (Pop-in)
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                const box = document.getElementById('custom-alert-box');
                box.classList.remove('scale-95');
                box.classList.add('scale-100');
            }, 10);

            // Logika Menutup Pop-up
            const closeAlert = (result) => {
                overlay.classList.add('opacity-0');
                const box = document.getElementById('custom-alert-box');
                box.classList.remove('scale-100');
                box.classList.add('scale-95');
                setTimeout(() => overlay.remove(), 300);
                resolve(result); // Kembalikan nilai (true = OK, false = Batal)
            };

            document.getElementById('custom-alert-confirm').addEventListener('click', () => closeAlert(true));
            if (showCancel) {
                document.getElementById('custom-alert-cancel').addEventListener('click', () => closeAlert(false));
            }
        });
    }

    // Fungsi Pintasan (Shortcut)
    static success(title, text) { return this.create({ type: 'success', title, text }); }
    static error(title, text) { return this.create({ type: 'error', title, text }); }
    static info(title, text) { return this.create({ type: 'info', title, text }); }
    static confirm(title, text, confirmText = 'Yakin') { 
        return this.create({ type: 'warning', title, text, showCancel: true, confirmText }); 
    }
}

export default CustomAlert;