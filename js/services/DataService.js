export default class DataService {
    /**
     * Mengambil file JSON berdasarkan nama kategori
     * @param {string} categoryName - Nama kategori (misal: 'math', 'science')
     * @returns {Promise<Array>} - Array berisi objek soal
     */
    static async fetchQuestions(categoryName) {
        try {
            // Mengambil file dari folder assets/data/
            const response = await fetch(`assets/data/${categoryName}.json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Gagal mengambil data soal:", error);
            // Kembalikan array kosong jika gagal agar game tidak crash total
            return []; 
        }
    }
}