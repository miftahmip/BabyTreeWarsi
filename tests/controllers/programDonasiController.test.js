// programDonasiController.test.js

const ProgramDonasiController = require('../../controllers/programDonasiController');
const { ProgramDonasi, User } = require('../../models');
const { deleteFile } = require('../../utils/fileHelper');
const WilayahService = require('../../services/wilayahService');

// Mock semua dependency eksternal
jest.mock('../../models', () => ({
    ProgramDonasi: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
    },
    User: {},
}));

jest.mock('../../utils/fileHelper', () => ({
    deleteFile: jest.fn(),
}));

jest.mock('../../services/wilayahService', () => ({
    mapWilayah: jest.fn(),
    getProvinces: jest.fn(),
    getRegencies: jest.fn(),
    getDistricts: jest.fn(),
    getVillages: jest.fn(),
}));

// Helper untuk membuat mock res Express
function mockResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        render: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    // Diamkan console.error supaya output test bersih
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

describe('ProgramDonasiController', () => {

    // ============================================================
    // INDEX
    // ============================================================
    describe('index', () => {
        it('berhasil menampilkan daftar program dan update status menjadi "selesai" jika sudah lewat tanggal', async () => {
            const today = new Date().toISOString().split('T')[0];

            const fakeProgramSelesai = {
                toJSON: () => ({
                    id_program: 'PRG0001',
                    tanggal_selesai: '2020-01-01', // sudah lewat
                    status_program: 'aktif',
                }),
                status_program: 'aktif',
                update: jest.fn().mockResolvedValue(true),
            };

            const fakeProgramAktif = {
                toJSON: () => ({
                    id_program: 'PRG0002',
                    tanggal_selesai: null,
                    status_program: 'aktif',
                }),
                status_program: 'aktif',
                update: jest.fn().mockResolvedValue(true),
            };

            ProgramDonasi.findAll.mockResolvedValue([fakeProgramSelesai, fakeProgramAktif]);

            WilayahService.mapWilayah.mockImplementation(async (data) => ({
                ...data,
                wilayah_label: 'Mocked Wilayah',
            }));

            const req = {};
            const res = mockResponse();

            await ProgramDonasiController.index(req, res);

            expect(ProgramDonasi.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.any(Array),
                    order: [['createdAt', 'DESC']],
                })
            );

            // Program pertama harus berubah status menjadi 'selesai' karena tanggal_selesai sudah lewat
            expect(fakeProgramSelesai.update).toHaveBeenCalledWith({ status_program: 'selesai' });

            // Program kedua tidak diupdate karena tanggal_selesai null -> status tetap 'aktif'
            expect(fakeProgramAktif.update).not.toHaveBeenCalled();

            expect(WilayahService.mapWilayah).toHaveBeenCalledTimes(2);

            expect(res.render).toHaveBeenCalledWith('admin-pusat/kelola-program', expect.objectContaining({
                pageTitle: 'Kelola Program Donasi',
                activePage: 'program',
                user: req.user,
                programs: [
                    expect.objectContaining({ id_program: 'PRG0001', status_program: 'selesai', wilayah_label: 'Mocked Wilayah' }),
                    expect.objectContaining({ id_program: 'PRG0002', status_program: 'aktif', wilayah_label: 'Mocked Wilayah' }),
                ],
                today,
            }));
        });

        it('mengembalikan status 500 jika terjadi error', async () => {
            ProgramDonasi.findAll.mockRejectedValue(new Error('DB Error'));

            const req = {};
            const res = mockResponse();

            await ProgramDonasiController.index(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Terjadi kesalahan pada server');
        });
    });

    // ============================================================
    // API WILAYAH
    // ============================================================
    describe('getProvinces', () => {
        it('mengembalikan data provinsi sebagai JSON', async () => {
            const fakeData = [{ code: '32', name: 'Jawa Barat' }];
            WilayahService.getProvinces.mockResolvedValue(fakeData);

            const req = {};
            const res = mockResponse();

            await ProgramDonasiController.getProvinces(req, res);

            expect(WilayahService.getProvinces).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(fakeData);
        });

        it('mengembalikan status 500 jika WilayahService error', async () => {
            WilayahService.getProvinces.mockRejectedValue(new Error('Gagal fetch provinsi'));

            const req = {};
            const res = mockResponse();

            await ProgramDonasiController.getProvinces(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gagal fetch provinsi' });
        });
    });

    describe('getRegencies', () => {
        it('mengembalikan data kota/kabupaten berdasarkan provinceCode', async () => {
            const fakeData = [{ code: '3273', name: 'Kota Bandung' }];
            WilayahService.getRegencies.mockResolvedValue(fakeData);

            const req = { params: { provinceCode: '32' } };
            const res = mockResponse();

            await ProgramDonasiController.getRegencies(req, res);

            expect(WilayahService.getRegencies).toHaveBeenCalledWith('32');
            expect(res.json).toHaveBeenCalledWith(fakeData);
        });

        it('mengembalikan status 500 jika terjadi error', async () => {
            WilayahService.getRegencies.mockRejectedValue(new Error('Gagal fetch kota'));

            const req = { params: { provinceCode: '32' } };
            const res = mockResponse();

            await ProgramDonasiController.getRegencies(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gagal fetch kota' });
        });
    });

    describe('getDistricts', () => {
        it('mengembalikan data kecamatan berdasarkan regencyCode', async () => {
            const fakeData = [{ code: '3273010', name: 'Sukasari' }];
            WilayahService.getDistricts.mockResolvedValue(fakeData);

            const req = { params: { regencyCode: '3273' } };
            const res = mockResponse();

            await ProgramDonasiController.getDistricts(req, res);

            expect(WilayahService.getDistricts).toHaveBeenCalledWith('3273');
            expect(res.json).toHaveBeenCalledWith(fakeData);
        });

        it('mengembalikan status 500 jika terjadi error', async () => {
            WilayahService.getDistricts.mockRejectedValue(new Error('Gagal fetch kecamatan'));

            const req = { params: { regencyCode: '3273' } };
            const res = mockResponse();

            await ProgramDonasiController.getDistricts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gagal fetch kecamatan' });
        });
    });

    describe('getVillages', () => {
        it('mengembalikan data kelurahan/desa berdasarkan districtCode', async () => {
            const fakeData = [{ code: '3273010001', name: 'Gegerkalong' }];
            WilayahService.getVillages.mockResolvedValue(fakeData);

            const req = { params: { districtCode: '3273010' } };
            const res = mockResponse();

            await ProgramDonasiController.getVillages(req, res);

            expect(WilayahService.getVillages).toHaveBeenCalledWith('3273010');
            expect(res.json).toHaveBeenCalledWith(fakeData);
        });

        it('mengembalikan status 500 jika terjadi error', async () => {
            WilayahService.getVillages.mockRejectedValue(new Error('Gagal fetch kelurahan'));

            const req = { params: { districtCode: '3273010' } };
            const res = mockResponse();

            await ProgramDonasiController.getVillages(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gagal fetch kelurahan' });
        });
    });

    // ============================================================
    // STORE
    // ============================================================
    describe('store', () => {
        const baseBody = {
            judul_program: 'Tanam Pohon Bersama',
            deskripsi: 'Program penghijauan',
            harga_pohon: 50000,
            tanggal_selesai: '2026-12-31',
            kode_provinsi: '32',
            kode_kbp_kota: '3273',
            kode_kecamatan: '3273010',
            kode_kelurahan: '3273010001',
        };

        it('berhasil membuat program baru dengan id_program berurutan dan tanpa flyer', async () => {
            ProgramDonasi.count.mockResolvedValue(3);
            ProgramDonasi.create.mockResolvedValue({});

            const req = {
                body: baseBody,
                file: undefined,
                user: { id_user: 'USR0001' },
            };
            const res = mockResponse();

            await ProgramDonasiController.store(req, res);

            expect(ProgramDonasi.count).toHaveBeenCalled();
            expect(ProgramDonasi.create).toHaveBeenCalledWith(expect.objectContaining({
                id_program: 'PRG0004', // total (3) + 1, padded ke 4 digit
                created_by_user_id: 'USR0001',
                judul_program: baseBody.judul_program,
                flyer_program: null,
                deskripsi: baseBody.deskripsi,
                pohon_terkumpul: 0,
                harga_pohon: baseBody.harga_pohon,
                tanggal_selesai: baseBody.tanggal_selesai,
                status_program: 'aktif',
                kode_provinsi: baseBody.kode_provinsi,
                kode_kbp_kota: baseBody.kode_kbp_kota,
                kode_kecamatan: baseBody.kode_kecamatan,
                kode_kelurahan: baseBody.kode_kelurahan,
            }));
            expect(res.redirect).toHaveBeenCalledWith('/admin-pusat/kelola-program');
        });

        it('berhasil membuat program baru dengan flyer dari file upload', async () => {
            ProgramDonasi.count.mockResolvedValue(0);
            ProgramDonasi.create.mockResolvedValue({});

            const req = {
                body: baseBody,
                file: { filename: 'flyer-test.png' },
                user: { id_user: 'USR0001' },
            };
            const res = mockResponse();

            await ProgramDonasiController.store(req, res);

            expect(ProgramDonasi.create).toHaveBeenCalledWith(expect.objectContaining({
                id_program: 'PRG0001',
                flyer_program: 'flyer-test.png',
            }));
            expect(res.redirect).toHaveBeenCalledWith('/admin-pusat/kelola-program');
        });

        it('mengisi tanggal_selesai dengan null jika tidak dikirim', async () => {
            ProgramDonasi.count.mockResolvedValue(0);
            ProgramDonasi.create.mockResolvedValue({});

            const req = {
                body: { ...baseBody, tanggal_selesai: '' },
                file: undefined,
                user: { id_user: 'USR0001' },
            };
            const res = mockResponse();

            await ProgramDonasiController.store(req, res);

            expect(ProgramDonasi.create).toHaveBeenCalledWith(expect.objectContaining({
                tanggal_selesai: null,
            }));
        });

        it('mengembalikan status 500 jika gagal menyimpan', async () => {
            ProgramDonasi.count.mockResolvedValue(0);
            ProgramDonasi.create.mockRejectedValue(new Error('DB Error'));

            const req = {
                body: baseBody,
                file: undefined,
                user: { id_user: 'USR0001' },
            };
            const res = mockResponse();

            await ProgramDonasiController.store(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Gagal menyimpan data');
        });
    });

    // ============================================================
    // UPDATE
    // ============================================================
    describe('update', () => {
        const baseBody = {
            judul_program: 'Tanam Pohon Update',
            deskripsi: 'Deskripsi update',
            harga_pohon: 75000,
            tanggal_selesai: '2026-12-31',
            kode_provinsi: '32',
            kode_kbp_kota: '3273',
            kode_kecamatan: '3273010',
            kode_kelurahan: '3273010001',
        };

        it('mengembalikan 404 jika program tidak ditemukan', async () => {
            ProgramDonasi.findByPk.mockResolvedValue(null);

            const req = { params: { id: 'PRG9999' }, body: baseBody, file: undefined };
            const res = mockResponse();

            await ProgramDonasiController.update(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Program tidak ditemukan');
        });

        it('berhasil update program tanpa mengganti flyer', async () => {
            const fakeData = {
                flyer_program: 'old-flyer.png',
                status_program: 'aktif',
                update: jest.fn().mockResolvedValue(true),
            };
            ProgramDonasi.findByPk.mockResolvedValue(fakeData);

            const req = { params: { id: 'PRG0001' }, body: baseBody, file: undefined };
            const res = mockResponse();

            await ProgramDonasiController.update(req, res);

            expect(deleteFile).not.toHaveBeenCalled();
            expect(fakeData.update).toHaveBeenCalledWith(expect.objectContaining({
                judul_program: baseBody.judul_program,
                flyer_program: 'old-flyer.png',
                deskripsi: baseBody.deskripsi,
                harga_pohon: baseBody.harga_pohon,
                tanggal_selesai: baseBody.tanggal_selesai,
                status_program: 'aktif',
                kode_provinsi: baseBody.kode_provinsi,
                kode_kbp_kota: baseBody.kode_kbp_kota,
                kode_kecamatan: baseBody.kode_kecamatan,
                kode_kelurahan: baseBody.kode_kelurahan,
            }));
            expect(res.redirect).toHaveBeenCalledWith('/admin-pusat/kelola-program');
        });

        it('berhasil update program dengan mengganti flyer dan menghapus flyer lama', async () => {
            const fakeData = {
                flyer_program: 'old-flyer.png',
                status_program: 'aktif',
                update: jest.fn().mockResolvedValue(true),
            };
            ProgramDonasi.findByPk.mockResolvedValue(fakeData);

            const req = {
                params: { id: 'PRG0001' },
                body: baseBody,
                file: { filename: 'new-flyer.png' },
            };
            const res = mockResponse();

            await ProgramDonasiController.update(req, res);

            expect(deleteFile).toHaveBeenCalledWith('old-flyer.png', 'program');
            expect(fakeData.update).toHaveBeenCalledWith(expect.objectContaining({
                flyer_program: 'new-flyer.png',
            }));
            expect(res.redirect).toHaveBeenCalledWith('/admin-pusat/kelola-program');
        });

        it('mengisi tanggal_selesai dengan null jika tidak dikirim', async () => {
            const fakeData = {
                flyer_program: 'old-flyer.png',
                status_program: 'aktif',
                update: jest.fn().mockResolvedValue(true),
            };
            ProgramDonasi.findByPk.mockResolvedValue(fakeData);

            const req = {
                params: { id: 'PRG0001' },
                body: { ...baseBody, tanggal_selesai: '' },
                file: undefined,
            };
            const res = mockResponse();

            await ProgramDonasiController.update(req, res);

            expect(fakeData.update).toHaveBeenCalledWith(expect.objectContaining({
                tanggal_selesai: null,
            }));
        });

        it('mengembalikan status 500 jika terjadi error', async () => {
            ProgramDonasi.findByPk.mockRejectedValue(new Error('DB Error'));

            const req = { params: { id: 'PRG0001' }, body: baseBody, file: undefined };
            const res = mockResponse();

            await ProgramDonasiController.update(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Gagal update data');
        });
    });

    // ============================================================
    // DESTROY
    // ============================================================
    describe('destroy', () => {
        it('mengembalikan 404 jika program tidak ditemukan', async () => {
            ProgramDonasi.findByPk.mockResolvedValue(null);

            const req = { params: { id: 'PRG9999' } };
            const res = mockResponse();

            await ProgramDonasiController.destroy(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Program tidak ditemukan');
        });

        it('berhasil menghapus program beserta file flyer-nya', async () => {
            const fakeData = {
                flyer_program: 'flyer-to-delete.png',
                destroy: jest.fn().mockResolvedValue(true),
            };
            ProgramDonasi.findByPk.mockResolvedValue(fakeData);

            const req = { params: { id: 'PRG0001' } };
            const res = mockResponse();

            await ProgramDonasiController.destroy(req, res);

            expect(deleteFile).toHaveBeenCalledWith('flyer-to-delete.png', 'program');
            expect(fakeData.destroy).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/admin-pusat/kelola-program');
        });

        it('mengembalikan status 500 jika terjadi error', async () => {
            ProgramDonasi.findByPk.mockRejectedValue(new Error('DB Error'));

            const req = { params: { id: 'PRG0001' } };
            const res = mockResponse();

            await ProgramDonasiController.destroy(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Gagal menghapus data');
        });
    });
});