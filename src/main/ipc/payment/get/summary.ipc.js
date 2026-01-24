// ipc/payment/get/summary.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentSummary(params = {}) {
  try {
    // @ts-ignore
    const { startDate, endDate, workerId, pitakId } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment');

    // Apply date filters
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

    if (workerId) {
      queryBuilder.andWhere('payment.workerId = :workerId', { workerId });
    }

    if (pitakId) {
      queryBuilder.andWhere('payment.pitakId = :pitakId', { pitakId });
    }

    // Get total counts and amounts
    const summary = await queryBuilder
      .select([
        'COUNT(payment.id) as totalPayments',
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'SUM(payment.totalDebtDeduction) as totalDebtDeductions',
        'SUM(payment.manualDeduction) as totalManualDeductions',
        'SUM(payment.otherDeductions) as totalOtherDeductions'
      ])
      .getRawOne();

    // Get status breakdown
    const statusBreakdown = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'payment.status',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as totalAmount'
      ])
      .groupBy('payment.status')
      .getRawMany();

    // Get top workers by payment amount
    const topWorkers = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.worker', 'worker')
      .select([
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(payment.id) as paymentCount',
        'SUM(payment.netPay) as totalPaid'
      ])
      .groupBy('worker.id, worker.name')
      .orderBy('totalPaid', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      status: true,
      message: 'Payment summary retrieved successfully',
      data: {
        summary: {
          totalPayments: parseInt(summary.totalPayments || 0),
          totalGross: parseFloat(summary.totalGross || 0),
          totalNet: parseFloat(summary.totalNet || 0),
          totalDebtDeductions: parseFloat(summary.totalDebtDeductions || 0),
          totalManualDeductions: parseFloat(summary.totalManualDeductions || 0),
          totalOtherDeductions: parseFloat(summary.totalOtherDeductions || 0)
        },
        statusBreakdown,
        topWorkers
      }
    };
  } catch (error) {
    console.error('Error in getPaymentSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payment summary: ${error.message}`,
      data: null
    };
  }
};