// ipc/payment/get_periods.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function getPaymentPeriods(params = {}) {
  try {
    // @ts-ignore
    const { year, workerId } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment');

    if (workerId) {
      queryBuilder.where('payment.workerId = :workerId', { workerId });
    }

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      queryBuilder.andWhere('payment.periodStart >= :startDate', { startDate });
      queryBuilder.andWhere('payment.periodEnd <= :endDate', { endDate });
    }

    // Get distinct payment periods
    const periods = await queryBuilder
      .select([
        'EXTRACT(YEAR FROM payment.periodStart) as year',
        'EXTRACT(MONTH FROM payment.periodStart) as month',
        'MIN(payment.periodStart) as periodStart',
        'MAX(payment.periodEnd) as periodEnd',
        'COUNT(payment.id) as paymentCount',
        'SUM(payment.netPay) as totalAmount'
      ])
      .where('payment.periodStart IS NOT NULL')
      .andWhere('payment.periodEnd IS NOT NULL')
      .groupBy('EXTRACT(YEAR FROM payment.periodStart), EXTRACT(MONTH FROM payment.periodStart)')
      .orderBy('year', 'DESC')
      .addOrderBy('month', 'DESC')
      .getRawMany();

    // Format periods
    const formattedPeriods = periods.map((/** @type {{ periodstart: string | number | Date; periodend: string | number | Date; year: string; month: string; paymentcount: string; totalamount: any; }} */ period) => {
      const periodStart = new Date(period.periodstart);
      const periodEnd = new Date(period.periodend);
      
      return {
        year: parseInt(period.year),
        month: parseInt(period.month),
        periodName: `${periodStart.toLocaleString('default', { month: 'long' })} ${period.year}`,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        paymentCount: parseInt(period.paymentcount),
        totalAmount: parseFloat(period.totalamount || 0).toFixed(2),
        isCurrent: periodStart <= new Date() && periodEnd >= new Date()
      };
    });

    // Get year summary
    const years = [...new Set(formattedPeriods.map((/** @type {{ year: any; }} */ p) => p.year))].sort((a, b) => b - a);
    
    const yearSummary = await Promise.all(years.map(async (year) => {
      const yearQuery = paymentRepository.createQueryBuilder('payment')
        .select([
          'COUNT(payment.id) as paymentCount',
          'SUM(payment.netPay) as totalAmount',
          'AVG(payment.netPay) as averagePayment'
        ])
        .where('EXTRACT(YEAR FROM payment.periodStart) = :year', { year })
        .andWhere('payment.periodStart IS NOT NULL');

      if (workerId) {
        yearQuery.andWhere('payment.workerId = :workerId', { workerId });
      }

      const summary = await yearQuery.getRawOne();

      return {
        year,
        paymentCount: parseInt(summary.paymentcount || 0),
        totalAmount: parseFloat(summary.totalamount || 0).toFixed(2),
        averagePayment: parseFloat(summary.averagepayment || 0).toFixed(2)
      };
    }));

    return {
      status: true,
      message: 'Payment periods retrieved successfully',
      data: {
        periods: formattedPeriods,
        years: yearSummary,
        currentPeriod: formattedPeriods.find((/** @type {{ isCurrent: any; }} */ p) => p.isCurrent) || null,
        summary: {
          totalPeriods: formattedPeriods.length,
          totalYears: years.length,
          earliestYear: years.length > 0 ? Math.min(...years) : null,
          latestYear: years.length > 0 ? Math.max(...years) : null
        }
      }
    };
  } catch (error) {
    console.error('Error in getPaymentPeriods:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payment periods: ${error.message}`,
      data: null
    };
  }
};