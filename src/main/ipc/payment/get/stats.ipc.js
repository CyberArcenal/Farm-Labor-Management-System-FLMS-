// ipc/payment/get/stats.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentStats(params = {}) {
  try {
    // @ts-ignore
    const { year, month } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Base query for all payments
    let queryBuilder = paymentRepository.createQueryBuilder('payment');

    // Apply year/month filters
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      queryBuilder = queryBuilder.where('payment.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });
    }

    if (month && year) {
      const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
      const endDate = new Date(year, month, 0);
      queryBuilder = queryBuilder.where('payment.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });
    }

    // Get overall statistics
    const overallStats = await queryBuilder
      .select([
        'COUNT(payment.id) as totalPayments',
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'AVG(payment.netPay) as averagePayment',
        'MIN(payment.netPay) as minPayment',
        'MAX(payment.netPay) as maxPayment'
      ])
      .getRawOne();

    // Get status distribution
    const statusStats = await queryBuilder
      .select([
        'payment.status',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as totalAmount',
        'AVG(payment.netPay) as averageAmount'
      ])
      .groupBy('payment.status')
      .getRawMany();

    // Get monthly trend (if year is specified, show monthly breakdown)
    let monthlyTrend = [];
    if (year) {
      monthlyTrend = await paymentRepository
        .createQueryBuilder('payment')
        .select([
          'EXTRACT(MONTH FROM payment.createdAt) as month',
          'COUNT(payment.id) as count',
          'SUM(payment.netPay) as totalAmount',
          'AVG(payment.netPay) as averageAmount'
        ])
        .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
        .groupBy('EXTRACT(MONTH FROM payment.createdAt)')
        .orderBy('month', 'ASC')
        .getRawMany();
    }

    // Get top workers by payment amount
    const topWorkers = await queryBuilder
      .leftJoin('payment.worker', 'worker')
      .select([
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(payment.id) as paymentCount',
        'SUM(payment.netPay) as totalPaid',
        'AVG(payment.netPay) as averagePayment'
      ])
      .groupBy('worker.id, worker.name')
      .orderBy('totalPaid', 'DESC')
      .limit(10)
      .getRawMany();

    // Get payment method distribution
    const methodStats = await queryBuilder
      .select([
        'payment.paymentMethod',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as totalAmount'
      ])
      .where('payment.paymentMethod IS NOT NULL')
      .groupBy('payment.paymentMethod')
      .getRawMany();

    // Get deduction statistics
    const deductionStats = await queryBuilder
      .select([
        'SUM(payment.totalDebtDeduction) as totalDebtDeductions',
        'SUM(payment.manualDeduction) as totalManualDeductions',
        'SUM(payment.otherDeductions) as totalOtherDeductions',
        'AVG(payment.totalDebtDeduction) as averageDebtDeduction'
      ])
      .getRawOne();

    // Calculate completion rate (completed vs total)
    const completionRate = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'SUM(CASE WHEN payment.status = "completed" THEN 1 ELSE 0 END) as completedCount',
        'COUNT(payment.id) as totalCount'
      ])
      .getRawOne();

    return {
      status: true,
      message: 'Payment statistics retrieved successfully',
      data: {
        period: year 
          ? (month 
              ? `${year}-${String(month).padStart(2, '0')}` 
              : `${year}`)
          : 'All time',
        overall: {
          totalPayments: parseInt(overallStats.totalpayments || 0),
          totalGross: parseFloat(overallStats.totalgross || 0),
          totalNet: parseFloat(overallStats.totalnet || 0),
          averagePayment: parseFloat(overallStats.averagepayment || 0),
          minPayment: parseFloat(overallStats.minpayment || 0),
          maxPayment: parseFloat(overallStats.maxpayment || 0),
          completionRate: completionRate.totalcount > 0 
            ? (parseInt(completionRate.completedcount || 0) / parseInt(completionRate.totalcount)) * 100
            : 0
        },
        statusDistribution: statusStats.map((/** @type {{ payment_status: any; count: string; totalamount: any; averageamount: any; }} */ item) => ({
          status: item.payment_status,
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalamount || 0),
          averageAmount: parseFloat(item.averageamount || 0),
          percentage: overallStats.totalpayments > 0 
            ? (parseInt(item.count) / parseInt(overallStats.totalpayments)) * 100
            : 0
        })),
        monthlyTrend: monthlyTrend.map((/** @type {{ month: string; count: string; totalamount: any; averageamount: any; }} */ item) => ({
          month: parseInt(item.month),
          monthName: new Date(2000, parseInt(item.month) - 1, 1).toLocaleString('default', { month: 'long' }),
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalamount || 0),
          averageAmount: parseFloat(item.averageamount || 0)
        })),
        topWorkers: topWorkers.map((/** @type {{ workerid: string; workername: any; paymentcount: string; totalpaid: any; averagepayment: any; }} */ item) => ({
          workerId: parseInt(item.workerid),
          workerName: item.workername,
          paymentCount: parseInt(item.paymentcount),
          totalPaid: parseFloat(item.totalpaid || 0),
          averagePayment: parseFloat(item.averagepayment || 0)
        })),
        paymentMethods: methodStats.map((/** @type {{ payment_paymentmethod: any; count: string; totalamount: any; }} */ item) => ({
          method: item.payment_paymentmethod,
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalamount || 0)
        })),
        deductions: {
          totalDebtDeductions: parseFloat(deductionStats.totaldebtdeductions || 0),
          totalManualDeductions: parseFloat(deductionStats.totalmanualdeductions || 0),
          totalOtherDeductions: parseFloat(deductionStats.totalotherdeductions || 0),
          averageDebtDeduction: parseFloat(deductionStats.averagedebtdeduction || 0),
          totalDeductions: parseFloat(deductionStats.totaldebtdeductions || 0) + 
                         parseFloat(deductionStats.totalmanualdeductions || 0) + 
                         parseFloat(deductionStats.totalotherdeductions || 0)
        }
      }
    };
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payment statistics: ${error.message}`,
      data: null
    };
  }
};