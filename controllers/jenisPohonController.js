const { JenisPohon } = require('../models');

class JenisPohonController {

  // =========================
  // GET ALL
  // =========================

  static async getAll(req, res) {

    try {

      const data = await JenisPohon.findAll({
        order: [['createdAt', 'DESC']]
      });

      res.render('admin-wilayah/jenis-pohon', {
        title: 'Data Jenis Pohon',
        data,
        user: req.user
      });

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // =========================
  // CREATE
  // =========================

  static async create(req, res) {

    try {

      const {
        nama_pohon,
        nama_latin
      } = req.body;

      // GENERATE ID
      const total =
        await JenisPohon.count();

      const id_jenis_pohon =
        'JNS' +
        String(total + 1).padStart(4, '0');

      await JenisPohon.create({

        id_jenis_pohon,
        nama_pohon,
        nama_latin

      });

      res.redirect('/admin-wilayah/jenis-pohon');

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // =========================
  // UPDATE
  // =========================

  static async update(req, res) {

    try {

      const { id } = req.params;

      const {
        nama_pohon,
        nama_latin
      } = req.body;

      await JenisPohon.update({

        nama_pohon,
        nama_latin

      }, {

        where: {
          id_jenis_pohon: id
        }

      });

      res.redirect('/admin-wilayah/jenis-pohon');

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  // =========================
  // DELETE
  // =========================

  static async delete(req, res) {

    try {

      const { id } = req.params;

      await JenisPohon.destroy({

        where: {
          id_jenis_pohon: id
        }

      });

      res.redirect('/admin-wilayah/jenis-pohon');

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

}

module.exports = JenisPohonController;