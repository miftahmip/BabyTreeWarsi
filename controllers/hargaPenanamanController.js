const {HargaPenanaman, Penanaman} = require('../models');

class HargaPenanamanController {

  static async getDataHarga(req, res) {
    try {
      const { id_penanaman } = req.params;
      const data = await HargaPenanaman.findAll({
        where: { id_penanaman }
      });
      res.json({ success: true, data });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  }


  static async generateIdHarga() {

    const lastData =
      await HargaPenanaman.findOne({

        order: [
          ['id_harga_penanaman', 'DESC']
        ]

      });

    if (!lastData) {
      return 'HP0001';
    }

    const lastNumber =
      parseInt(
        lastData.id_harga_penanaman
          .replace('HP', '')
      );

    const newNumber =
      lastNumber + 1;

    return `HP${String(newNumber)
      .padStart(4, '0')}`;

  }



  static async upsertHarga(req, res) {

    try {

      const { id_penanaman } = req.params;

      const {
        harga_penanaman,
        harga_monitoring_1,
        harga_monitoring_2,
        harga_monitoring_3
      } = req.body;

      const dataHarga = [
        {
          tahap: 'penanaman',
          harga: harga_penanaman
        },
        {
          tahap: 'monitoring_1',
          harga: harga_monitoring_1
        },
        {
          tahap: 'monitoring_2',
          harga: harga_monitoring_2
        },
        {
          tahap: 'monitoring_3',
          harga: harga_monitoring_3
        }
      ];

      // VALIDASI
      for (const item of dataHarga) {

        // wajib isi
        if (
          item.harga === '' ||
          item.harga === null ||
          item.harga === undefined
        ) {

          return res.json({ success: false, message: `Harga ${item.tahap} wajib diisi` });

        }

        // wajib angka
        if (isNaN(item.harga)) {

          return res.json({ success: false, message: `Harga ${item.tahap} harus berupa angka` });

        }

        // tidak boleh negatif
        if (Number(item.harga) < 0) {

          return res.json({ success: false, message: `Harga ${item.tahap} tidak boleh negatif` });

        }

      }

      // CREATE / UPDATE
      for (const item of dataHarga) {

        const existing =
          await HargaPenanaman.findOne({

            where: {
              id_penanaman,
              tahap: item.tahap
            }

          });

        if (existing) {

          await existing.update({

            harga_per_pohon:
              Number(item.harga)

          });

        } else {

          await HargaPenanaman.create({

            id_harga_penanaman:
              await HargaPenanamanController.generateIdHarga(),

            id_penanaman,

            tahap: item.tahap,

            harga_per_pohon:
              Number(item.harga),

            created_by:
              req.user.id_user

          });

        }

      }

      res.json({ success: true });

    } catch (error) {

      console.log(error);
      res.send(error);

    }

  }

}

module.exports = HargaPenanamanController;