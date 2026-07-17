'use strict';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}));

const fs = require('fs');

const {
  deleteFile
} = require('../../utils/fileHelper');

describe('fileHelper', () => {

  beforeEach(() => {

    jest.clearAllMocks();

    jest.spyOn(console, 'log')
      .mockImplementation(() => {});

    jest.spyOn(console, 'warn')
      .mockImplementation(() => {});

    jest.spyOn(console, 'error')
      .mockImplementation(() => {});

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================
  // fileName kosong
  // =========================

  test('return jika fileName kosong', () => {

    deleteFile();

    expect(fs.existsSync)
      .not.toHaveBeenCalled();

    expect(fs.unlinkSync)
      .not.toHaveBeenCalled();

  });

  test('return jika fileName null', () => {

    deleteFile(null);

    expect(fs.existsSync)
      .not.toHaveBeenCalled();

  });

  // =========================
  // file ditemukan
  // =========================

  test('hapus file jika file ditemukan', () => {

    fs.existsSync.mockReturnValue(true);

    deleteFile(
      'gambar.jpg',
      'program'
    );

    expect(fs.existsSync)
      .toHaveBeenCalled();

    expect(fs.unlinkSync)
      .toHaveBeenCalled();

    expect(console.log)
      .toHaveBeenCalledWith(
        'File deleted:',
        'gambar.jpg'
      );

  });

  // =========================
  // file tidak ditemukan
  // =========================

  test('tampilkan warning jika file tidak ditemukan', () => {

    fs.existsSync.mockReturnValue(false);

    deleteFile(
      'gambar.jpg',
      'program'
    );

    expect(fs.unlinkSync)
      .not.toHaveBeenCalled();

    expect(console.warn)
      .toHaveBeenCalled();

  });

  // =========================
  // error existsSync
  // =========================

  test('handle error ketika existsSync gagal', () => {

    fs.existsSync.mockImplementation(() => {
      throw new Error('FS Error');
    });

    deleteFile(
      'gambar.jpg',
      'program'
    );

    expect(console.error)
      .toHaveBeenCalledWith(
        'Error deleting file:',
        'FS Error'
      );

  });

  // =========================
  // error unlinkSync
  // =========================

  test('handle error ketika unlinkSync gagal', () => {

    fs.existsSync.mockReturnValue(true);

    fs.unlinkSync.mockImplementation(() => {
      throw new Error('Delete Error');
    });

    deleteFile(
      'gambar.jpg',
      'program'
    );

    expect(console.error)
      .toHaveBeenCalledWith(
        'Error deleting file:',
        'Delete Error'
      );

  });

});