const axios = require('axios');

class WilayahService {

    static cache = {
        provinces: null,
        regencies: {},
        districts: {},
        villages: {}
    };

    static BASE_URL = 'https://wilayah.id/api';

    // ================= PROVINCES =================
    static async getProvinces() {
        try {
            if (this.cache.provinces) {
                return this.cache.provinces;
            }

            const res = await axios.get(`${this.BASE_URL}/provinces.json`);
            const data = res.data.data || [];

            this.cache.provinces = data;
            return data;

        } catch (error) {
            console.error('Error getProvinces:', error.message);
            throw new Error('Gagal mengambil data provinsi');
        }
    }

    // ================= REGENCIES =================
    static async getRegencies(provinceCode) {
        try {
            if (this.cache.regencies[provinceCode]) {
                return this.cache.regencies[provinceCode];
            }

            const res = await axios.get(
                `${this.BASE_URL}/regencies/${provinceCode}.json`
            );

            const data = res.data.data || [];

            this.cache.regencies[provinceCode] = data;
            return data;

        } catch (error) {
            console.error('Error getRegencies:', error.message);
            throw new Error('Gagal mengambil data kabupaten/kota');
        }
    }

    // ================= DISTRICTS =================
    static async getDistricts(regencyCode) {
        try {
            if (this.cache.districts[regencyCode]) {
                return this.cache.districts[regencyCode];
            }

            const res = await axios.get(
                `${this.BASE_URL}/districts/${regencyCode}.json`
            );

            const data = res.data.data || [];

            this.cache.districts[regencyCode] = data;
            return data;

        } catch (error) {
            console.error('Error getDistricts:', error.message);
            throw new Error('Gagal mengambil data kecamatan');
        }
    }

    // ================= VILLAGES =================
    static async getVillages(districtCode) {
        try {
            if (this.cache.villages[districtCode]) {
                return this.cache.villages[districtCode];
            }

            const res = await axios.get(
                `${this.BASE_URL}/villages/${districtCode}.json`
            );

            const data = res.data.data || [];

            this.cache.villages[districtCode] = data;
            return data;

        } catch (error) {
            console.error('Error getVillages:', error.message);
            throw new Error('Gagal mengambil data kelurahan');
        }
    }

    // ================= MAPPING =================
    static async mapWilayah(data) {
        try {
            const provinces = data.kode_provinsi
                ? await this.getProvinces()
                : [];

            const regencies = data.kode_kbp_kota
                ? await this.getRegencies(data.kode_provinsi)
                : [];

            const districts = data.kode_kecamatan
                ? await this.getDistricts(data.kode_kbp_kota)
                : [];

            const villages = data.kode_kelurahan
                ? await this.getVillages(data.kode_kecamatan)
                : [];

            return {
                ...data,
                nama_provinsi: provinces.find(p => p.code === data.kode_provinsi)?.name || '',
                nama_kota: regencies.find(r => r.code === data.kode_kbp_kota)?.name || '',
                nama_kecamatan: districts.find(d => d.code === data.kode_kecamatan)?.name || '',
                nama_kelurahan: villages.find(v => v.code === data.kode_kelurahan)?.name || ''
            };

        } catch (error) {
            console.error('Error mapWilayah:', error.message);

            return {
                ...data,
                nama_provinsi: '',
                nama_kota: '',
                nama_kecamatan: '',
                nama_kelurahan: ''
            };
        }
    }
}

module.exports = WilayahService;