const { Payment, Donasi, ProgramDonasi } = require('../models');

exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    console.log('=== MIDTRANS NOTIFICATION ===');
    console.log(notification);

    const {
      order_id,
      transaction_status,
      payment_type,
      transaction_id,
      settlement_time,
      transaction_time,
      expiry_time,
      va_numbers,
      store
    } = notification;

    // 🔹 Mapping status
    let status = 'pending';

    switch (transaction_status) {
      case 'settlement':
        status = 'settlement';
        break;
      case 'pending':
        status = 'pending';
        break;
      case 'deny':
        status = 'failed';
        break;
      case 'expire':
        status = 'expired';
        break;
      case 'cancel':
        status = 'cancelled';
        break;
    }

    // 🔹 Mapping payment channel & VA number
    let payment_channel = null;
    let va_number = null;

    if (payment_type === 'bank_transfer') {
      if (va_numbers && va_numbers.length > 0) {
        payment_channel = va_numbers[0].bank;      // bca, bni, dll
        va_number = va_numbers[0].va_number;
      }
    } else if (payment_type === 'cstore') {
      payment_channel = store; // indomaret / alfamart
    } else {
      payment_channel = payment_type; // qris, gopay, dll
    }

    // Update database
    const [updated] = await Payment.update({
      status,
      payment_type,
      payment_channel,
      transaction_id,
      transaction_time: transaction_time
        ? new Date(transaction_time)
        : null,

      settlement_time: settlement_time
        ? new Date(settlement_time)
        : null,

      expiry_time: expiry_time
        ? new Date(expiry_time)
        : null,

      va_number,
      raw_response: notification

    }, {
      where: { order_id }
    });


    // 🔥 UPDATE POHON TERKUMPUL
    if (status === 'settlement') {

      // ambil payment terbaru
      const payment = await Payment.findOne({
        where: { order_id }
      });

      if (payment) {

        // ambil data donasi
        const donasi = await Donasi.findByPk(
          payment.id_donasi
        );

        if (donasi) {

          // ambil semua donasi settlement
          const semuaDonasi = await Donasi.findAll({
            where: {
              id_program: donasi.id_program
            },

            include: [
              {
                model: Payment,
                as: 'payments',

                where: {
                  status: 'settlement'
                }
              }
            ]
          });

          // hitung total pohon
          let totalPohon = 0;

          for (const item of semuaDonasi) {
            totalPohon += item.jumlah_pohon;
          }

          // update program
          await ProgramDonasi.update({
            pohon_terkumpul: totalPohon
          }, {
            where: {
              id_program: donasi.id_program
            }
          });

          console.log(
            'POHON TERKUMPUL UPDATED:',
            totalPohon
          );
        }
      }
    }

    console.log('=== UPDATE RESULT ===');
    console.log('Order ID:', order_id);
    console.log('Status:', status);
    console.log('Payment Type:', payment_type);
    console.log('Payment Channel:', payment_channel);
    console.log('Updated Rows:', updated);

    res.status(200).json({ message: 'OK' });

  } catch (error) {
    console.error('WEBHOOK ERROR:', error);
    res.status(500).json({ message: 'Error webhook' });
  }
};