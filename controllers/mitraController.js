const { Mitra } = require('../models');

class MitraController {

  // GET ALL

  static async getAll(req, res) {

    try {

      const data = await Mitra.findAll({

        order: [['createdAt', 'DESC']]

      });

      res.render('petugas-lapangan/mitra', {

        title: 'Data Mitra',
        data,
        user: req.user

      });

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // CREATE

  static async create(req, res) {

    try {

      const {
        nama_mitra,
        lembaga,
        kontak,
        no_rekening,
        bank,
        atas_nama_bank
      } = req.body;


      // GENERATE ID
      const lastMitra =
        await Mitra.findOne({

          order: [['id_mitra', 'DESC']]

        });

      let newId = 'MTR0001';

      if (lastMitra) {

        const lastNumber = parseInt(
          lastMitra.id_mitra.substring(3)
        );

        const nextNumber = lastNumber + 1;

        newId =
          `MTR${String(nextNumber).padStart(4, '0')}`;
      }


      await Mitra.create({

        id_mitra: newId,

        nama_mitra,
        lembaga,
        kontak,
        no_rekening,
        bank,
        atas_nama_bank

      });

      res.redirect('/petugas-lapangan/mitra');

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // UPDATE

  static async update(req, res) {

    try {

      const { id } = req.params;

      const {
        nama_mitra,
        lembaga,
        kontak,
        no_rekening,
        bank,
        atas_nama_bank
      } = req.body;

      await Mitra.update({

        nama_mitra,
        lembaga,
        kontak,
        no_rekening,
        bank,
        atas_nama_bank

      }, {

        where: {
          id_mitra: id
        }

      });

      res.redirect('/petugas-lapangan/mitra');

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }


  // DELETE

  static async delete(req, res) {

    try {

      const { id } = req.params;

      await Mitra.destroy({

        where: {
          id_mitra: id
        }

      });

      res.redirect('/petugas-lapangan/mitra');

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = MitraController;