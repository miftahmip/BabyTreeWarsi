const {Penanaman, DetailPenanaman, User, ProgramDonasi, sequelize} = require('../models');
const WilayahService = require('../services/wilayahService');

class PenanamanController {

  static async getAll(req, res) {

    try {

      const data = await Penanaman.findAll({

        include: [
          {
            model: ProgramDonasi,
            as: 'program',

            where: {
              kode_provinsi:
                req.user.kode_provinsi
            }
          },
          {
            model: DetailPenanaman,
            as: 'detailPenanaman',

            include: [
              {
                model: User,
                as: 'petugas',

                attributes: [
                  'id_user',
                  'nama_lengkap'
                ]
              }
            ]
          }
        ],

        order: [['createdAt', 'DESC']]
      });



      // DATA PROGRAM SESUAI PROVINSI
      const program = await ProgramDonasi.findAll({

        where: {

          status_program: 'selesai',

          kode_provinsi:
            req.user.kode_provinsi
        },

        order: [['createdAt', 'DESC']]
      });

      // DATA PETUGAS
      const petugas = await User.findAll({
        where: {
          role: 'petugas_lapangan'
        },

        attributes: [
          'id_user',
          'nama_lengkap'
        ]
      });


      res.render('admin-wilayah/penanaman', 
      {
        title: 'Data Penugasan Penanaman',
        data,
        program,
        petugas,
        user: req.user
      });

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }

  }

  static async create(req, res) {

    const transaction =
      await sequelize.transaction();

    try {

      const {
        id_program,
        tanggal_mulai,
        tanggal_selesai,
        petugas
      } = req.body;

      // VALIDASI PETUGAS
      if (!petugas || petugas.length === 0) {

        await transaction.rollback();

        return res.send(
          'Petugas lapangan wajib dipilih'
        );
      }

      const lastPenanaman =
        await Penanaman.findOne({

          order: [['id_penanaman', 'DESC']],

          transaction
        });

      let newId = 'PNM0001';

      if (lastPenanaman) {

        const lastNumber = parseInt(
          lastPenanaman.id_penanaman.substring(3)
        );

        const nextNumber = lastNumber + 1;

        newId =
          `PNM${String(nextNumber).padStart(4, '0')}`;
      }


      const penanaman =
        await Penanaman.create({

          id_penanaman: newId,
          id_program,
          tanggal_mulai,
          tanggal_selesai,
          status_penanaman: 'aktif'

        }, { transaction });


      const petugasArray =
        Array.isArray(petugas)
        ? petugas
        : [petugas];

      const detailData =
        petugasArray.map((idUser) => ({
          id_penanaman: penanaman.id_penanaman,
          id_user: idUser
        }));

      await DetailPenanaman.bulkCreate(
        detailData,
        { transaction }
      );

      await transaction.commit();

      res.redirect('/admin-wilayah/penanaman');

    } catch (error) {

      await transaction.rollback();

      console.log(error);
      res.send(error.message);

    }

  }

  static async update(req, res) {

    const transaction =
      await sequelize.transaction();

    try {

      const { id } = req.params;

      const {
        id_program,
        tanggal_mulai,
        tanggal_selesai,
        status_penanaman,
        petugas
      } = req.body;


      await Penanaman.update({

        id_program,
        tanggal_mulai,
        tanggal_selesai,
        status_penanaman

      }, {

        where: {
          id_penanaman: id
        },

        transaction
      });


      await DetailPenanaman.destroy({

        where: {
          id_penanaman: id
        },

        transaction
      });


      const petugasArray =
        Array.isArray(petugas)
        ? petugas
        : [petugas];

      const detailData =
        petugasArray.map((idUser) => ({
          id_penanaman: id,
          id_user: idUser
        }));

      await DetailPenanaman.bulkCreate(
        detailData,
        { transaction }
      );

      await transaction.commit();

      res.redirect('/admin-wilayah/penanaman');

    } catch (error) {

      await transaction.rollback();

      console.log(error);
      res.send(error.message);

    }

  }


  static async delete(req, res) {

    const transaction =
      await sequelize.transaction();

    try {

      const { id } = req.params;

      // HAPUS DETAIL
      await DetailPenanaman.destroy({

        where: {
          id_penanaman: id
        },

        transaction
      });

      // HAPUS PENANAMAN
      await Penanaman.destroy({

        where: {
          id_penanaman: id
        },

        transaction
      });

      await transaction.commit();

      res.redirect('/admin-wilayah/penanaman');

    } catch (error) {

      await transaction.rollback();

      console.log(error);
      res.send(error.message);

    }

  }


  // PETUGAS LAPANGAN

  static async getPetugasPenanaman(req, res) {

    try {

      const data =
        await DetailPenanaman.findAll({

          where: {
            id_user: req.user.id_user
          },

          include: [
            {
              model: Penanaman,
              as: 'penanaman',

              include: [
                {
                  model: ProgramDonasi,
                  as: 'program'
                }
              ]
            }
          ],

          order: [['createdAt', 'DESC']]
        });

      // MAP WILAYAH

      const dataWilayah =
        await Promise.all(

          data.map(async (item) => {

            const detail = item.toJSON();

            if (detail.penanaman?.program) {

              detail.penanaman.program =
                await WilayahService.mapWilayah(
                  detail.penanaman.program
                );
            }

            return detail;

          })

        );

      res.render(
        'petugas-lapangan/penanaman',
        {
          title: 'Penugasan Penanaman Pohon',
          data: dataWilayah,
          user: req.user
        }
      );

    } catch (error) {

      console.log(error);
      res.send(error.message);

    }
  }
}

module.exports = PenanamanController;