'use strict';

jest.mock('axios');

const axios = require('axios');
const WilayahService = require('../../services/wilayahService');

describe('WilayahService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // reset cache
    WilayahService.cache = {
      provinces: null,
      regencies: {},
      districts: {},
      villages: {}
    };
  });

  // ======================================================
  // PROVINCES
  // ======================================================
  describe('getProvinces', () => {

    test('mengambil data dari API dan menyimpan cache', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '32', name: 'Jawa Barat' }]
        }
      });

      const result = await WilayahService.getProvinces();

      expect(axios.get).toHaveBeenCalledWith(
        'https://wilayah.id/api/provinces.json'
      );

      expect(result).toEqual([
        { code: '32', name: 'Jawa Barat' }
      ]);

      expect(WilayahService.cache.provinces).toBeTruthy();
    });

    test('menggunakan cache jika sudah ada', async () => {
      WilayahService.cache.provinces = [{ code: '11', name: 'Aceh' }];

      const result = await WilayahService.getProvinces();

      expect(axios.get).not.toHaveBeenCalled();
      expect(result).toEqual([{ code: '11', name: 'Aceh' }]);
    });

    test('error handling getProvinces', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(WilayahService.getProvinces())
        .rejects.toThrow('Gagal mengambil data provinsi');
    });

    // 🔥 FIX BRANCH: fallback data || []
    test('fallback jika res.data.data undefined', async () => {
      axios.get.mockResolvedValue({
        data: {}
      });

      const result = await WilayahService.getProvinces();

      expect(result).toEqual([]);
    });

    // 🔥 FIX BRANCH: API dipanggil saat cache null
    test('mengambil data jika cache masih null', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '32', name: 'Jawa Barat' }]
        }
      });

      WilayahService.cache.provinces = null;

      const result = await WilayahService.getProvinces();

      expect(axios.get).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

  });


  // ======================================================
  // REGENCIES
  // ======================================================
  describe('getRegencies', () => {

    test('ambil data kabupaten dari API', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '3201', name: 'Bandung' }]
        }
      });

      const result = await WilayahService.getRegencies('32');

      expect(axios.get).toHaveBeenCalledWith(
        'https://wilayah.id/api/regencies/32.json'
      );

      expect(result).toEqual([
        { code: '3201', name: 'Bandung' }
      ]);
    });

    test('pakai cache regencies', async () => {
      WilayahService.cache.regencies['32'] = [
        { code: '3201', name: 'Bandung' }
      ];

      const result = await WilayahService.getRegencies('32');

      expect(axios.get).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    test('error handling regencies', async () => {
      axios.get.mockRejectedValue(new Error('fail'));

      await expect(
        WilayahService.getRegencies('32')
      ).rejects.toThrow('Gagal mengambil data kabupaten/kota');
    });

  });


  // ======================================================
  // DISTRICTS
  // ======================================================
  describe('getDistricts', () => {

    test('ambil data kecamatan', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '320101', name: 'Cicendo' }]
        }
      });

      const result = await WilayahService.getDistricts('3201');

      expect(result[0].name).toBe('Cicendo');
    });

    test('pakai cache districts', async () => {
      WilayahService.cache.districts['3201'] = [
        { code: '1', name: 'Cached' }
      ];

      const result = await WilayahService.getDistricts('3201');

      expect(axios.get).not.toHaveBeenCalled();
      expect(result[0].name).toBe('Cached');
    });

    test('error getDistricts', async () => {
      axios.get.mockRejectedValue(new Error('fail'));

      await expect(
        WilayahService.getDistricts('3201')
      ).rejects.toThrow('Gagal mengambil data kecamatan');
    });

  });


  // ======================================================
  // VILLAGES
  // ======================================================
  describe('getVillages', () => {

    test('ambil data kelurahan', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '3201011', name: 'Sukajadi' }]
        }
      });

      const result = await WilayahService.getVillages('320101');

      expect(result[0].name).toBe('Sukajadi');
    });

    test('pakai cache villages', async () => {
      WilayahService.cache.villages['320101'] = [
        { code: '1', name: 'Cached Village' }
      ];

      const result = await WilayahService.getVillages('320101');

      expect(axios.get).not.toHaveBeenCalled();
      expect(result[0].name).toBe('Cached Village');
    });

    test('error getVillages', async () => {
      axios.get.mockRejectedValue(new Error('fail'));

      await expect(
        WilayahService.getVillages('320101')
      ).rejects.toThrow('Gagal mengambil data kelurahan');
    });

  });


  // ======================================================
  // MAP WILAYAH
  // ======================================================
  describe('mapWilayah', () => {

    test('mapping wilayah lengkap', async () => {

      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '32', name: 'Jawa Barat' }]
        }
      });

      const input = {
        kode_provinsi: '32',
        kode_kbp_kota: '3201',
        kode_kecamatan: '320101',
        kode_kelurahan: '3201011'
      };

      const result = await WilayahService.mapWilayah(input);

      expect(result.nama_provinsi).toBe('Jawa Barat');
    });

    test('fallback jika mapWilayah error', async () => {

      axios.get.mockRejectedValue(new Error('API down'));

      const input = {
        kode_provinsi: '32'
      };

      const result = await WilayahService.mapWilayah(input);

      expect(result.nama_provinsi).toBe('');
      expect(result.nama_kota).toBe('');
      expect(result.nama_kecamatan).toBe('');
      expect(result.nama_kelurahan).toBe('');
    });

    // 🔥 FIX BRANCH: hanya provinsi
    test('mapWilayah hanya provinsi saja', async () => {

      axios.get.mockResolvedValue({
        data: {
          data: [{ code: '32', name: 'Jawa Barat' }]
        }
      });

      const input = {
        kode_provinsi: '32'
      };

      const result = await WilayahService.mapWilayah(input);

      expect(result.nama_provinsi).toBe('Jawa Barat');
      expect(result.nama_kota).toBe('');
      expect(result.nama_kecamatan).toBe('');
      expect(result.nama_kelurahan).toBe('');
    });

    // 🔥 FIX BRANCH: find() tidak menemukan data
    test('find tidak menemukan data → fallback kosong', async () => {

      axios.get.mockResolvedValue({
        data: {
          data: []
        }
      });

      const input = {
        kode_provinsi: '32'
      };

      const result = await WilayahService.mapWilayah(input);

      expect(result.nama_provinsi).toBe('');
    });

  });

});