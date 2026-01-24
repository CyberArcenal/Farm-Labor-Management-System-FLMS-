// ipc/payment/get_worker_summary.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function getWorkerPaymentSummary(params = {}) {
  try {
    // @ts-ignore
    const { workerId, year, month } = params;
    
    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);
    const worker = await workerRepository.findOne({
      where: { id: workerId }
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .where('payment.workerId = :workerId', { workerId });

    // Apply date filters
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      queryBuilder.andWhere('payment.periodStart >= :startDate', { startDate });
      queryBuilder.andWhere('payment.periodEnd <= :endDate', { endDate });
    }

    if (month && year) {
      const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
      const endDate = new Date(year, month, 0); // Last day of the month
      queryBuilder.andWhere('payment.periodStart >= :startDate', { startDate });
      queryBuilder.andWhere('payment.periodEnd <= :endDate', { endDate });
    }

    // Get all payments for the worker
    const payments = await queryBuilder
      .orderBy('payment.periodStart', 'DESC')
      .getMany();

    // Calculate summary
    const summary = payments.reduce((/** @type {{ totalGross: number; totalNet: number; totalDebtDeductions: number; totalManualDeductions: number; totalOtherDeductions: number; paymentCount: number; statusCounts: { [x: string]: any; }; }} */ acc, /** @type {{ grossPay: string; netPay: string; totalDebtDeduction: string; manualDeduction: any; otherDeductions: any; status: string | number; }} */ payment) => {
      acc.totalGross += parseFloat(payment.grossPay);
      acc.totalNet += parseFloat(payment.netPay);
      acc.totalDebtDeductions += parseFloat(payment.totalDebtDeduction);
      acc.totalManualDeductions += parseFloat(payment.manualDeduction || 0);
      acc.totalOtherDeductions += parseFloat(payment.otherDeductions || 0);
      acc.paymentCount++;
      
      // Categorize by status
      acc.statusCounts[payment.status] = (acc.statusCounts[payment.status] || 0) + 1;
      
      return acc;
    }, {
      totalGross: 0,
      totalNet: 0,
      totalDebtDeductions: 0,
      totalManualDeductions: 0,
      totalOtherDeductions: 0,
      paymentCount: 0,
      statusCounts: {}
    });

    // Get monthly breakdown
    const monthlyBreakdown = payments.reduce((/** @type {{ [x: string]: { paymentCount: number; }; }} */ acc, /** @type {{ periodStart: { getFullYear: () => any; getMonth: () => number; toLocaleString: (arg0: string, arg1: { month: string; year: string; }) => any; }; grossPay: string; netPay: string; totalDebtDeduction: string; manualDeduction: any; otherDeductions: any; }} */ payment) => {
      if (payment.periodStart) {
        const monthYear = `${payment.periodStart.getFullYear()}-${(payment.periodStart.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            // @ts-ignore
            period: payment.periodStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
            grossPay: 0,
            netPay: 0,
            deductions: 0,
            paymentCount: 0
          };
        }
        
        // @ts-ignore
        acc[monthYear].grossPay += parseFloat(payment.grossPay);
        // @ts-ignore
        acc[monthYear].netPay += parseFloat(payment.netPay);
        // @ts-ignore
        acc[monthYear].deductions += (
          parseFloat(payment.totalDebtDeduction) + 
          parseFloat(payment.manualDeduction || 0) + 
          parseFloat(payment.otherDeductions || 0)
        );
        acc[monthYear].paymentCount++;
      }
      return acc;
    }, {});

    // Format monthly breakdown
    const formattedMonthlyBreakdown = Object.entries(monthlyBreakdown)
      .map(([key, data]) => ({
        monthYear: key,
        ...data,
        grossPay: data.grossPay.toFixed(2),
        netPay: data.netPay.toFixed(2),
        deductions: data.deductions.toFixed(2)
      }))
      .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

    // Get recent payments (last 5)
    const recentPayments = payments.slice(0, 5).map((/** @type {{ id: any; periodStart: { toISOString: () => string; }; periodEnd: { toISOString: () => string; }; grossPay: string; netPay: string; status: any; paymentDate: { toISOString: () => string; }; }} */ payment) => ({
      id: payment.id,
      period: payment.periodStart && payment.periodEnd 
        ? `${payment.periodStart.toISOString().split('T')[0]} to ${payment.periodEnd.toISOString().split('T')[0]}`
        : 'N/A',
      grossPay: parseFloat(payment.grossPay).toFixed(2),
      netPay: parseFloat(payment.netPay).toFixed(2),
      status: payment.status,
      paymentDate: payment.paymentDate ? payment.paymentDate.toISOString().split('T')[0] : 'Pending'
    }));

    // Calculate averages
    const averagePayment = summary.paymentCount > 0 
      ? summary.totalNet / summary.paymentCount 
      : 0;

    const averageDeduction = summary.paymentCount > 0 
      ? (summary.totalDebtDeductions + summary.totalManualDeductions + summary.totalOtherDeductions) / summary.paymentCount 
      : 0;

    return {
      status: true,
      message: 'Worker payment summary retrieved successfully',
      data: {
        worker: {
          id: worker.id,
          name: worker.name,
          status: worker.status,
          hireDate: worker.hireDate
        },
        summary: {
          totalPayments: summary.paymentCount,
          totalGross: summary.totalGross.toFixed(2),
          totalNet: summary.totalNet.toFixed(2),
          totalDeductions: (
            summary.totalDebtDeductions + 
            summary.totalManualDeductions + 
            summary.totalOtherDeductions
          ).toFixed(2),
          breakdown: {
            debt: summary.totalDebtDeductions.toFixed(2),
            manual: summary.totalManualDeductions.toFixed(2),
            other: summary.totalOtherDeductions.toFixed(2)
          },
          averages: {
            payment: averagePayment.toFixed(2),
            deduction: averageDeduction.toFixed(2)
          },
          statusDistribution: summary.statusCounts
        },
        monthlyBreakdown: formattedMonthlyBreakdown,
        recentPayments,
        timePeriod: {
          year: year || 'All',
          month: month ? new Date(2000, month - 1).toLocaleString('default', { month: 'long' }) : 'All'
        }
      }
    };
  } catch (error) {
    console.error('Error in getWorkerPaymentSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker payment summary: ${error.message}`,
      data: null
    };
  }
};