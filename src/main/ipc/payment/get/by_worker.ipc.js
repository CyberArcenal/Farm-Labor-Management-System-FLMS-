// ipc/payment/get/by_worker.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentsByWorker(params = {}) {
  try {
    // @ts-ignore
    const { workerId, status, startDate, endDate, limit = 50, page = 1 } = params;
    
    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .where('payment.workerId = :workerId', { workerId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { 
        endDate: new Date(endDate) 
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    // Get paginated results
    const payments = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Calculate summary
    const summary = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'SUM(payment.totalDebtDeduction) as totalDebtDeductions',
        'COUNT(payment.id) as paymentCount'
      ])
      .where('payment.workerId = :workerId', { workerId })
      .getRawOne();

    return {
      status: true,
      message: 'Payments retrieved successfully',
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalGross: parseFloat(summary.totalGross || 0),
          totalNet: parseFloat(summary.totalNet || 0),
          totalDebtDeductions: parseFloat(summary.totalDebtDeductions || 0),
          paymentCount: parseInt(summary.paymentCount || 0)
        }
      }
    };
  } catch (error) {
    console.error('Error in getPaymentsByWorker:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payments: ${error.message}`,
      data: null
    };
  }
};