export default class StorageManager {
    // --- MANAJEMEN PEMAIN ---
    static savePlayerName(name) {
        localStorage.setItem('playerName', name);
    }

    static getPlayerName() {
        return localStorage.getItem('playerName');
    }

    static getPlayerData() {
        return {
            name: this.getPlayerName() || 'Guest',
            level: parseInt(localStorage.getItem('playerLevel')) || 1,
            xp: parseInt(localStorage.getItem('playerXP')) || 0
        };
    }

    // --- MANAJEMEN KATEGORI ---
    static saveCurrentCategory(category) {
        localStorage.setItem('currentCategory', category);
    }

    static getCurrentCategory() {
        return localStorage.getItem('currentCategory');
    }

    // --- MANAJEMEN MODE GAME ---
    static saveCurrentMode(mode) {
        localStorage.setItem('currentMode', mode);
    }

    // INI DIA FUNGSI YANG SEBELUMNYA HILANG!
    static getCurrentMode() {
        return localStorage.getItem('currentMode');
    }
}