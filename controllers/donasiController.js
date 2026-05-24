const { User, Donasi, Payment, ProgramDonasi } = require('../models');

exports.submitDonasi = async (req, res) => {
  try {
    const { nama_lengkap, email, jumlah_pohon, id_program } = req.body;

    if (!nama_lengkap || !email || !jumlah_pohon || !id_program) {
      return res.status(400).send('Data tidak lengkap');
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.redirect(`/register?email=${email}&nama=${nama_lengkap}`);
    }

    
    const program = await ProgramDonasi.findByPk(id_program);

    if (!program) {
      return res.status(404).send('Program tidak ditemukan');
    }

    
    const jumlahPohonInt = parseInt(jumlah_pohon);
    if (isNaN(jumlahPohonInt) || jumlahPohonInt <= 0) {
      return res.status(400).send('Jumlah pohon tidak valid');
    }

    
    const nominal = jumlahPohonInt * program.harga_pohon;

    
    const lastDonasi = await Donasi.findOne({
      order: [['createdAt', 'DESC']]
    });

    let nextDonasiNumber = 1;

    if (lastDonasi) {
      const lastId = lastDonasi.id_donasi || '';
      const number = parseInt(lastId.replace('DNS', '')) || 0;
      nextDonasiNumber = number + 1;
    }

    const id_donasi = `DNS${String(nextDonasiNumber).padStart(4, '0')}`;

    
    const donasi = await Donasi.create({
      id_donasi,
      id_program,
      id_user: user.id_user,
      jumlah_pohon: jumlahPohonInt,
      nominal_donasi: nominal,
      tanggal_donasi: new Date()
    });

    
    const lastPayment = await Payment.findOne({
      order: [['created_at', 'DESC']]
    });

    let nextPaymentNumber = 1;

    if (lastPayment) {
      const lastPayId = lastPayment.id || '';
      const number = parseInt(lastPayId.replace('PAY', '')) || 0;
      nextPaymentNumber = number + 1;
    }

    const paymentId = `PAY${String(nextPaymentNumber).padStart(4, '0')}`;

    
    const order_id = `DONASI-${id_donasi}-${Date.now()}`;

    
    await Payment.create({
      id: paymentId,
      id_donasi: donasi.id_donasi,
      order_id,
      gross_amount: nominal,
      status: 'pending'
    });

    
    return res.redirect(`/payment/${order_id}`);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Terjadi kesalahan saat proses donasi');
  }
};

exports.detailProgramDonasi = async (req, res) => {
  try {

    const { id_program } = req.params;

    // ambil data program
    const program = await ProgramDonasi.findByPk(id_program);

    if (!program) {
      return res.status(404).send('Program tidak ditemukan');
    }

    // ambil data donasi dengan payment settlement
    const donasis = await Donasi.findAll({
      where: {
        id_program
      },

      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'nama_lengkap',
            'email'
          ]
        },
        {
          model: Payment,
          as: 'payments',
          where: {
            status: 'settlement'
          },
          attributes: [
            'status'
          ]
        }
      ],

      order: [['tanggal_donasi', 'DESC']]
    });

    return res.render(
      'admin-pusat/detail-donasi',
      {
        pageTitle: 'Detail Donasi Program',
        activePage: 'kelola-program',
        user: req.user,
        program,
        donasis
      }
    );

  } catch (error) {

    console.error(error);

    return res.status(500).send(
      'Terjadi kesalahan server'
    );
  }
};