// ipc/payment/get/by_id.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentById(params = {}) {
  try {
    // @ts-ignore
    const { paymentId } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: [
        'worker',
        'pitak',
        'history',
        'debtPayments',
        'debtPayments.debt'
      ]
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    return {
      status: true,
      message: 'Payment retrieved successfully',
      data: { payment }
    };
  } catch (error) {
    console.error('Error in getPaymentById:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payment: ${error.message}`,
      data: null
    };
  }
};