// src/ipc/pitak/get/with_payments.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ pitakId, dateRange = {}, /** @type {any} */ userId) => {
  try {
    if (!pitakId) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Get pitak with bukid and kabisilya
    const pitak = await pitakRepo.findOne({
      where: { id: pitakId },
      relations: ['bukid', 'bukid.kabisilya']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Build payment query
    const paymentQuery = paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .where('payment.pitakId = :pitakId', { pitakId });

    // Apply date range if provided
    // @ts-ignore
    if (dateRange.startDate && dateRange.endDate) {
      paymentQuery.andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        // @ts-ignore
        startDate: new Date(dateRange.startDate),
        // @ts-ignore
        endDate: new Date(dateRange.endDate)
      });
    }

    // Get payments with ordering
    const payments = await paymentQuery
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();

    // Calculate payment statistics
    const paymentStats = await paymentRepo
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as totalPayments',
        'SUM(payment.grossPay) as totalGrossPay',
        'SUM(payment.netPay) as totalNetPay',
        'SUM(payment.totalDebtDeduction) as totalDebtDeduction',
        'SUM(payment.otherDeductions) as totalOtherDeductions',
        'AVG(payment.grossPay) as averageGrossPay',
        'AVG(payment.netPay) as averageNetPay',
        'SUM(CASE WHEN payment.status = "completed" THEN 1 ELSE 0 END) as completedPayments',
        'SUM(CASE WHEN payment.status = "pending" THEN 1 ELSE 0 END) as pendingPayments'
      ])
      .where('payment.pitakId = :pitakId', { pitakId })
      .getRawOne();

    // Get worker payment statistics
    const workerStats = await paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.worker', 'worker')
      .select([
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(payment.id) as paymentCount',
        'SUM(payment.grossPay) as totalGrossPay',
        'SUM(payment.netPay) as totalNetPay',
        'AVG(payment.netPay) as averageNetPay'
      ])
      .where('payment.pitakId = :pitakId', { pitakId })
      .groupBy('payment.workerId, worker.id, worker.name')
      .orderBy('totalNetPay', 'DESC')
      .getRawMany();

    // Calculate monthly payment breakdown
    const monthlyBreakdown = await paymentRepo
      .createQueryBuilder('payment')
      .select([
        'DATE_FORMAT(payment.paymentDate, "%Y-%m") as paymentMonth',
        'COUNT(*) as paymentsCount',
        'SUM(payment.grossPay) as totalGrossPay',
        'SUM(payment.netPay) as totalNetPay'
      ])
      .where('payment.pitakId = :pitakId', { pitakId })
      .groupBy('DATE_FORMAT(payment.paymentDate, "%Y-%m")')
      .orderBy('paymentMonth', 'DESC')
      .limit(12) // Last 12 months
      .getRawMany();

    // Calculate efficiency metrics
    const totalNetPay = parseFloat(paymentStats.totalNetPay) || 0;
    const totalGrossPay = parseFloat(paymentStats.totalGrossPay) || 0;
    const totalDeductions = parseFloat(paymentStats.totalDebtDeduction || 0) + parseFloat(paymentStats.totalOtherDeductions || 0);
    const deductionRate = totalGrossPay > 0 ? (totalDeductions / totalGrossPay) * 100 : 0;

    return {
      status: true,
      message: "Pitak with payments retrieved successfully",
      data: {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          // @ts-ignore
          totalLuwang: parseFloat(pitak.totalLuwang),
          status: pitak.status,
          // @ts-ignore
          bukid: pitak.bukid ? {
            // @ts-ignore
            id: pitak.bukid.id,
            // @ts-ignore
            name: pitak.bukid.name,
            // @ts-ignore
            kabisilya: pitak.bukid.kabisilya
          } : null
        },
        payments: payments.map(p => ({
          id: p.id,
          paymentDate: p.paymentDate,
          // @ts-ignore
          grossPay: parseFloat(p.grossPay),
          // @ts-ignore
          netPay: parseFloat(p.netPay),
          // @ts-ignore
          manualDeduction: parseFloat(p.manualDeduction || 0),
          // @ts-ignore
          totalDebtDeduction: parseFloat(p.totalDebtDeduction || 0),
          // @ts-ignore
          otherDeductions: parseFloat(p.otherDeductions || 0),
          status: p.status,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          // @ts-ignore
          worker: p.worker ? {
            // @ts-ignore
            id: p.worker.id,
            // @ts-ignore
            name: p.worker.name,
            // @ts-ignore
            contact: p.worker.contact
          } : null
        })),
        statistics: {
          payments: {
            total: parseInt(paymentStats.totalPayments) || 0,
            totalGrossPay,
            totalNetPay,
            totalDebtDeduction: parseFloat(paymentStats.totalDebtDeduction) || 0,
            totalOtherDeductions: parseFloat(paymentStats.totalOtherDeductions) || 0,
            averageGrossPay: parseFloat(paymentStats.averageGrossPay) || 0,
            averageNetPay: parseFloat(paymentStats.averageNetPay) || 0,
            completed: parseInt(paymentStats.completedPayments) || 0,
            pending: parseInt(paymentStats.pendingPayments) || 0
          },
          workers: {
            uniqueCount: workerStats.length,
            topEarners: workerStats.slice(0, 5).map(w => ({
              workerId: w.workerId,
              workerName: w.workerName,
              paymentCount: parseInt(w.paymentCount) || 0,
              totalNetPay: parseFloat(w.totalNetPay) || 0,
              averageNetPay: parseFloat(w.averageNetPay) || 0
            }))
          },
          efficiency: {
            deductionRate,
            netToGrossRatio: totalGrossPay > 0 ? (totalNetPay / totalGrossPay) * 100 : 0,
            averageDeductionPerPayment: (parseInt(paymentStats.totalPayments) || 0) > 0 
              ? totalDeductions / (parseInt(paymentStats.totalPayments) || 1) 
              : 0
          }
        },
        monthlyBreakdown: monthlyBreakdown.map(m => ({
          month: m.paymentMonth,
          payments: parseInt(m.paymentsCount) || 0,
          totalGrossPay: parseFloat(m.totalGrossPay) || 0,
          totalNetPay: parseFloat(m.totalNetPay) || 0
        })),
        period: dateRange
      }
    };

  } catch (error) {
    console.error("Error retrieving pitak with payments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pitak with payments: ${error.message}`,
      data: null
    };
  }
};