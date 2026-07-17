const mockPohonFindAll = jest.fn();
const mockPohonFindByPk = jest.fn();
const mockPohonFindOne = jest.fn();
const mockPohonCreate = jest.fn();
const mockPenanamanFindByPk = jest.fn();
const mockProgramDonasiFindByPk = jest.fn();
const mockJenisPohonFindAll = jest.fn();
const mockJenisPohonFindByPk = jest.fn();
const mockMitraFindAll = jest.fn();
const mockDonasiFindAll = jest.fn();
const mockDonasiPohonCount = jest.fn();
const mockDonasiPohonCreate = jest.fn();
const mockDeleteFile = jest.fn();
const mockQrToFile = jest.fn();
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync
}));

jest.mock('qrcode', () => ({
  toFile: mockQrToFile
}));

jest.mock('../../models', () => ({
  Pohon: {
    findAll: mockPohonFindAll,
    findByPk: mockPohonFindByPk,
    findOne: mockPohonFindOne,
    create: mockPohonCreate
  },
  Penanaman: {
    findByPk: mockPenanamanFindByPk
  },
  ProgramDonasi: {
    findByPk: mockProgramDonasiFindByPk
  },
  JenisPohon: {
    findAll: mockJenisPohonFindAll,
    findByPk: mockJenisPohonFindByPk
  },
  Mitra: {
    findAll: mockMitraFindAll
  },
  DetailMonitoring: {},
  Monitoring: {},
  Donasi: {
    findAll: mockDonasiFindAll
  },
  DonasiPohon: {
    count: mockDonasiPohonCount,
    create: mockDonasiPohonCreate
  },
  User: {}
}));

jest.mock('../../utils/fileHelper', () => ({
  deleteFile: mockDeleteFile
}));

const PohonController = require('../../controllers/pohonController');

function createResponseMock() {
  const res = {
    render: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    download: jest.fn().mockReturnThis()
  };
  return res;
}

function createPohonInstance(overrides = {}) {
  return {
    id_pohon: 'POH-001',
    status_verifikasi: 'disetujui',
    detailMonitoring: [],
    toJSON: jest.fn().mockReturnValue({
      id_pohon: 'POH-001',
      status_verifikasi: 'disetujui',
      detailMonitoring: []
    }),
    update: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockExistsSync.mockReturnValue(false);
  mockMkdirSync.mockImplementation(() => {});
  mockQrToFile.mockResolvedValue(undefined);
  mockDeleteFile.mockImplementation(() => {});
});

describe('PohonController', () => {
  test('index renders daftar pohon dan data penanaman', async () => {
    const req = { params: { id_penanaman: 'PN-1' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_penanaman: 'PN-1', program: { id_program: 'PRG1' } });
    mockPohonFindAll.mockResolvedValue([createPohonInstance()]);
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.index(req, res);

    expect(mockPenanamanFindByPk).toHaveBeenCalledWith('PN-1', expect.any(Object));
    expect(mockPohonFindAll).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'petugas-lapangan/pohon/index',
      expect.objectContaining({
        title: 'Data Pohon',
        user: req.user
      })
    );
  });

  test('index menutup cabang status monitoring yang berbeda-beda', async () => {
    const req = { params: { id_penanaman: 'PN-1' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_penanaman: 'PN-1', program: { id_program: 'PRG1' } });
    mockPohonFindAll.mockResolvedValue([
      createPohonInstance({
        status_verifikasi: 'revisi',
        detailMonitoring: [{ status_verifikasi: 'revisi', monitoring: { tahap_monitoring: 2 } }]
      }),
      createPohonInstance({
        status_verifikasi: 'menunggu',
        detailMonitoring: [{ status_verifikasi: 'menunggu', monitoring: { tahap_monitoring: 3 } }]
      }),
      createPohonInstance({
        status_verifikasi: 'revisi',
        detailMonitoring: []
      }),
      createPohonInstance({
        status_verifikasi: 'menunggu',
        detailMonitoring: []
      }),
      createPohonInstance({
        status_verifikasi: 'disetujui',
        detailMonitoring: []
      }),
      createPohonInstance({
        status_verifikasi: 'disetujui',
        detailMonitoring: [{ status_verifikasi: 'disetujui', monitoring: { tahap_monitoring: 4 } }]
      }),
      createPohonInstance({
        status_verifikasi: 'ditolak',
        detailMonitoring: []
      }),
      createPohonInstance({
        status_verifikasi: 'disetujui',
        detailMonitoring: [{ status_verifikasi: 'ditolak' }]
      }),
      createPohonInstance({
        status_verifikasi: 'disetujui',
        detailMonitoring: [{ status_verifikasi: 'disetujui', monitoring: null }]
      })
    ]);
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.index(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test('index mengirim pesan saat terjadi error', async () => {
    const req = { params: { id_penanaman: 'PN-1' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockRejectedValue(new Error('DB error'));

    await PohonController.index(req, res);

    expect(res.send).toHaveBeenCalledWith('DB error');
  });

  test('index memproses sorting ketika monitoring tidak punya tahap', async () => {
    const req = { params: { id_penanaman: 'PN-1' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_penanaman: 'PN-1', program: { id_program: 'PRG1' } });
    mockPohonFindAll.mockResolvedValue([
      createPohonInstance({
        status_verifikasi: 'disetujui',
        detailMonitoring: [
          { status_verifikasi: 'revisi', monitoring: { tahap_monitoring: 3 } },
          { status_verifikasi: 'revisi' },
          { status_verifikasi: 'revisi', monitoring: null },
          { status_verifikasi: 'disetujui', monitoring: { tahap_monitoring: 2 } }
        ]
      })
    ]);
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.index(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test('index memakai array kosong ketika detailMonitoring tidak ada', async () => {
    const req = { params: { id_penanaman: 'PN-1' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_penanaman: 'PN-1', program: { id_program: 'PRG1' } });
    mockPohonFindAll.mockResolvedValue([
      createPohonInstance({
        status_verifikasi: 'disetujui',
        detailMonitoring: undefined
      })
    ]);
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.index(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test('index menandai status disetujui tanpa monitoring yang disetujui', async () => {
    const req = { params: { id_penanaman: 'PN-1' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_penanaman: 'PN-1', program: { id_program: 'PRG1' } });
    mockPohonFindAll.mockResolvedValue([
      createPohonInstance({
        status_verifikasi: 'revisi',
        detailMonitoring: [{ status_verifikasi: 'menunggu' }]
      })
    ]);
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.index(req, res);

    expect(res.render).toHaveBeenCalled();
  });

  test('create menyimpan pohon baru dan redirect ke halaman penanaman', async () => {
    const req = {
      body: {
        id_penanaman: 'PN-1',
        id_mitra: 'MIT-1',
        id_jenis_pohon: 'JNS-1',
        tgl_tanam: '2026-06-01',
        latitude: '-6.2',
        longitude: '106.8'
      },
      files: [{ filename: 'foto1.jpg' }]
    };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_program: 'PRG1' });
    mockJenisPohonFindByPk.mockResolvedValue({ nama_pohon: 'Kepuh' });
    mockPohonFindOne.mockResolvedValue(null);
    mockPohonCreate.mockResolvedValue({ id_pohon: 'PN-1-KEP-001' });
    mockDonasiFindAll.mockResolvedValue([]);
    mockDonasiPohonCount.mockResolvedValue(0);

    await PohonController.create(req, res);

    expect(mockPohonCreate).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/petugas-lapangan/pohon/PN-1');
  });

  test('create auto-assign pohon ke donasi corporate yang masih punya kuota', async () => {
    const req = {
      body: {
        id_penanaman: 'PN-1',
        id_mitra: 'MIT-1',
        id_jenis_pohon: 'JNS-1',
        tgl_tanam: '2026-06-01',
        latitude: '-6.2',
        longitude: '106.8'
      },
      files: [{ filename: 'foto1.jpg' }]
    };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_program: 'PRG1' });
    mockJenisPohonFindByPk.mockResolvedValue({ nama_pohon: 'Kepuh' });
    mockPohonFindOne.mockResolvedValue(null);
    mockPohonCreate.mockResolvedValue({ id_pohon: 'PN-1-KEP-001' });
    mockDonasiFindAll.mockResolvedValue([{ id_donasi: 'DON-1', jumlah_pohon: 2 }]);
    mockDonasiPohonCount.mockResolvedValue(0);

    await PohonController.create(req, res);

    expect(mockDonasiPohonCreate).toHaveBeenCalledWith(expect.objectContaining({
      id_donasi: 'DON-1',
      id_pohon: 'PN-1-KEP-001'
    }));
  });

  test('create tidak auto-assign ketika kuota donasi sudah penuh', async () => {
    const req = {
      body: {
        id_penanaman: 'PN-1',
        id_mitra: 'MIT-1',
        id_jenis_pohon: 'JNS-1',
        tgl_tanam: '2026-06-01',
        latitude: '-6.2',
        longitude: '106.8'
      },
      files: [{ filename: 'foto1.jpg' }]
    };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_program: 'PRG1' });
    mockJenisPohonFindByPk.mockResolvedValue({ nama_pohon: 'Kepuh' });
    mockPohonFindOne.mockResolvedValue(null);
    mockPohonCreate.mockResolvedValue({ id_pohon: 'PN-1-KEP-001' });
    mockDonasiFindAll.mockResolvedValue([{ id_donasi: 'DON-1', jumlah_pohon: 2 }]);
    mockDonasiPohonCount.mockResolvedValue(2);

    await PohonController.create(req, res);

    expect(mockDonasiPohonCreate).not.toHaveBeenCalled();
  });

  test('create menghasilkan id pohon berurutan ketika ada data terakhir', async () => {
    const req = {
      body: {
        id_penanaman: 'PN-1',
        id_mitra: 'MIT-1',
        id_jenis_pohon: 'JNS-1',
        tgl_tanam: '2026-06-01',
        latitude: '-6.2',
        longitude: '106.8'
      },
      files: [{ filename: 'foto1.jpg' }]
    };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_program: 'PRG1' });
    mockJenisPohonFindByPk.mockResolvedValue({ nama_pohon: 'Kepuh' });
    mockPohonFindOne.mockResolvedValue({ id_pohon: 'PN-1-KEP-009' });
    mockPohonCreate.mockResolvedValue({ id_pohon: 'PN-1-KEP-010' });
    mockDonasiFindAll.mockResolvedValue([]);
    mockDonasiPohonCount.mockResolvedValue(0);

    await PohonController.create(req, res);

    expect(mockPohonCreate).toHaveBeenCalledWith(expect.objectContaining({
      id_pohon: 'PN-1-KEP-010'
    }));
  });

  test('create mengirim pesan saat terjadi error saat menyimpan', async () => {
    const req = {
      body: {
        id_penanaman: 'PN-1',
        id_mitra: 'MIT-1',
        id_jenis_pohon: 'JNS-1',
        tgl_tanam: '2026-06-01',
        latitude: '-6.2',
        longitude: '106.8'
      },
      files: [{ filename: 'foto1.jpg' }]
    };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue({ id_program: 'PRG1' });
    mockJenisPohonFindByPk.mockResolvedValue({ nama_pohon: 'Kepuh' });
    mockPohonFindOne.mockResolvedValue(null);
    mockPohonCreate.mockRejectedValue(new Error('Create failed'));

    await PohonController.create(req, res);

    expect(res.send).toHaveBeenCalledWith('Create failed');
  });

  test('detail menampilkan halaman detail pohon', async () => {
    const req = { params: { id: 'POH-001' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue({
      id_pohon: 'POH-001',
      foto_bukti_tanam: '["foto.jpg"]',
      penanaman: { program: { id_program: 'PRG1' } }
    });
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.detail(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'petugas-lapangan/pohon/detail',
      expect.objectContaining({ title: 'Detail Pohon' })
    );
  });

  test('detail mengirim pesan ketika data pohon tidak ditemukan', async () => {
    const req = { params: { id: 'POH-999' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue(null);

    await PohonController.detail(req, res);

    expect(res.send).toHaveBeenCalledWith('Data pohon tidak ditemukan');
  });

  test('detail menangani foto bukti tanam yang rusak', async () => {
    const req = { params: { id: 'POH-001' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue({
      id_pohon: 'POH-001',
      foto_bukti_tanam: 'not-json',
      penanaman: { program: { id_program: 'PRG1' } },
      detailMonitoring: []
    });
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.detail(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'petugas-lapangan/pohon/detail',
      expect.objectContaining({ title: 'Detail Pohon', fotoList: [] })
    );
  });

  test('detail memakai daftar foto kosong ketika foto bukti tanam tidak ada', async () => {
    const req = { params: { id: 'POH-001' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue({
      id_pohon: 'POH-001',
      foto_bukti_tanam: null,
      penanaman: { program: { id_program: 'PRG1' } },
      detailMonitoring: []
    });
    mockJenisPohonFindAll.mockResolvedValue([]);
    mockMitraFindAll.mockResolvedValue([]);

    await PohonController.detail(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'petugas-lapangan/pohon/detail',
      expect.objectContaining({ title: 'Detail Pohon', fotoList: [] })
    );
  });

  test('detail mengirim pesan saat terjadi error', async () => {
    const req = { params: { id: 'POH-001' }, user: { id_user: 'USR1' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockRejectedValue(new Error('Detail failed'));

    await PohonController.detail(req, res);

    expect(res.send).toHaveBeenCalledWith('Detail failed');
  });

  test('create mengirim pesan ketika foto tidak diupload', async () => {
    const req = { body: { id_penanaman: 'PN-1' }, files: [] };
    const res = createResponseMock();

    await PohonController.create(req, res);

    expect(res.send).toHaveBeenCalledWith('Foto bukti tanam wajib diupload');
  });

  test('create mengirim pesan ketika penanaman tidak ditemukan', async () => {
    const req = {
      body: { id_penanaman: 'PN-404', id_mitra: 'MIT-1', id_jenis_pohon: 'JNS-1' },
      files: [{ filename: 'foto1.jpg' }]
    };
    const res = createResponseMock();

    mockPenanamanFindByPk.mockResolvedValue(null);

    await PohonController.create(req, res);

    expect(res.send).toHaveBeenCalledWith('Data penanaman tidak ditemukan');
  });

  test('update mengubah data pohon lalu redirect', async () => {
    const req = {
      params: { id: 'POH-001' },
      body: {
        id_mitra: 'MIT-2',
        id_jenis_pohon: 'JNS-2',
        tgl_tanam: '2026-06-02',
        latitude: '-6.3',
        longitude: '106.9'
      },
      files: []
    };
    const res = createResponseMock();
    const pohon = createPohonInstance({
      foto_bukti_tanam: '["old.jpg"]',
      id_mitra: 'MIT-1',
      id_jenis_pohon: 'JNS-1',
      tgl_tanam: '2026-05-01',
      latitude: '-6.1',
      longitude: '106.7'
    });

    mockPohonFindByPk.mockResolvedValue(pohon);

    await PohonController.update(req, res);

    expect(pohon.update).toHaveBeenCalledWith(expect.objectContaining({
      id_mitra: 'MIT-2',
      status_verifikasi: 'menunggu'
    }));
    expect(res.redirect).toHaveBeenCalledWith('/petugas-lapangan/pohon/detail/POH-001');
  });

  test('update mengirim pesan ketika data pohon tidak ditemukan', async () => {
    const req = { params: { id: 'POH-999' }, body: {}, files: [] };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue(null);

    await PohonController.update(req, res);

    expect(res.send).toHaveBeenCalledWith('Data pohon tidak ditemukan');
  });

  test('update mengabaikan foto lama yang tidak valid', async () => {
    const req = { params: { id: 'POH-001' }, body: {}, files: [] };
    const res = createResponseMock();
    const pohon = createPohonInstance({
      foto_bukti_tanam: 'not-json'
    });

    mockPohonFindByPk.mockResolvedValue(pohon);

    await PohonController.update(req, res);

    expect(pohon.update).toHaveBeenCalledWith(expect.objectContaining({
      foto_bukti_tanam: JSON.stringify([])
    }));
    expect(res.redirect).toHaveBeenCalledWith('/petugas-lapangan/pohon/detail/POH-001');
  });

  test('update menghapus foto lama dan menyimpan foto baru', async () => {
    const req = {
      params: { id: 'POH-001' },
      body: { id_mitra: 'MIT-2' },
      files: [{ filename: 'new1.jpg' }, { filename: 'new2.jpg' }]
    };
    const res = createResponseMock();
    const pohon = createPohonInstance({
      foto_bukti_tanam: '["old1.jpg"]',
      id_mitra: 'MIT-1'
    });

    mockPohonFindByPk.mockResolvedValue(pohon);

    await PohonController.update(req, res);

    expect(mockDeleteFile).toHaveBeenCalledWith('old1.jpg', 'pohon');
    expect(pohon.update).toHaveBeenCalledWith(expect.objectContaining({
      foto_bukti_tanam: JSON.stringify(['new1.jpg', 'new2.jpg'])
    }));
  });

  test('update mengirim pesan error saat update gagal', async () => {
    const req = { params: { id: 'POH-001' }, body: {}, files: [] };
    const res = createResponseMock();
    const pohon = createPohonInstance();

    pohon.update.mockRejectedValue(new Error('Update failed'));
    mockPohonFindByPk.mockResolvedValue(pohon);

    await PohonController.update(req, res);

    expect(res.send).toHaveBeenCalledWith('Update failed');
  });

  test('qrCode menghasilkan QR dan mengirim respons sukses', async () => {
    const req = { params: { id: 'POH-001' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue({ id_pohon: 'POH-001' });
    mockExistsSync.mockReturnValue(false);

    await PohonController.qrCode(req, res);

    expect(mockQrToFile).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('QR berhasil dibuat');
  });

  test('qrCode melewati pembuatan QR ketika file sudah ada', async () => {
    const req = { params: { id: 'POH-001' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue({ id_pohon: 'POH-001' });
    mockExistsSync.mockReturnValue(true);

    await PohonController.qrCode(req, res);

    expect(mockQrToFile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('QR berhasil dibuat');
  });

  test('qrCode mengirim pesan ketika data pohon tidak ditemukan', async () => {
    const req = { params: { id: 'POH-999' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue(null);

    await PohonController.qrCode(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Data pohon tidak ditemukan');
  });

  test('qrCode mengirim respons error saat database gagal', async () => {
    const req = { params: { id: 'POH-001' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockRejectedValue(new Error('QR failed'));

    await PohonController.qrCode(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('QR failed');
  });

  test('downloadQR mengirim file ketika QR ada', async () => {
    const req = { params: { id: 'POH-001' } };
    const res = createResponseMock();

    mockExistsSync.mockReturnValue(true);

    await PohonController.downloadQR(req, res);

    expect(res.download).toHaveBeenCalled();
  });

  test('downloadQR mengirim pesan saat QR tidak ditemukan', async () => {
    const req = { params: { id: 'POH-001' } };
    const res = createResponseMock();

    mockExistsSync.mockReturnValue(false);

    await PohonController.downloadQR(req, res);

    expect(res.send).toHaveBeenCalledWith('QR Code tidak ditemukan');
  });

  test('downloadQR mengirim pesan error saat download gagal', async () => {
    const req = { params: { id: 'POH-001' } };
    const res = createResponseMock();

    mockExistsSync.mockReturnValue(true);
    res.download.mockImplementation(() => { throw new Error('download failed'); });

    await PohonController.downloadQR(req, res);

    expect(res.send).toHaveBeenCalledWith('download failed');
  });

  test('scanQRPage menampilkan halaman scan QR', async () => {
    const req = { user: { id_user: 'USR1' } };
    const res = createResponseMock();

    await PohonController.scanQRPage(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'petugas-lapangan/pohon/scan',
      expect.objectContaining({ title: 'Scan QR Pohon' })
    );
  });

  test('scanQRPage mengirim respons error saat render gagal', async () => {
    const req = { user: { id_user: 'USR1' } };
    const res = createResponseMock();

    res.render.mockImplementation(() => { throw new Error('render failed'); });

    await PohonController.scanQRPage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('render failed');
  });

  test('processScanQR mengembalikan redirect URL untuk QR valid', async () => {
    const req = { body: { qr_result: 'https://example.com/petugas-lapangan/pohon/detail/POH-001' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue({ id_pohon: 'POH-001' });

    await PohonController.processScanQR(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      redirect_url: '/petugas-lapangan/pohon/detail/POH-001'
    });
  });

  test('processScanQR mengembalikan pesan ketika pohon tidak ditemukan', async () => {
    const req = { body: { qr_result: 'https://example.com/petugas-lapangan/pohon/detail/POH-999' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockResolvedValue(null);

    await PohonController.processScanQR(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Pohon dengan ID "POH-999" tidak ditemukan di database.'
    }));
  });

  test('processScanQR menolak QR yang tidak valid', async () => {
    const req = { body: { qr_result: 'https://example.com/not-valid' } };
    const res = createResponseMock();

    await PohonController.processScanQR(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('bukan milik sistem')
    }));
  });

  test('processScanQR menolak input QR kosong', async () => {
    const req = { body: { qr_result: '' } };
    const res = createResponseMock();

    await PohonController.processScanQR(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Hasil scan QR tidak ditemukan.'
    });
  });

  test('processScanQR mengembalikan error server saat database gagal', async () => {
    const req = { body: { qr_result: 'https://example.com/petugas-lapangan/pohon/detail/POH-001' } };
    const res = createResponseMock();

    mockPohonFindByPk.mockRejectedValue(new Error('DB failure'));

    await PohonController.processScanQR(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'DB failure'
    }));
  });
});
