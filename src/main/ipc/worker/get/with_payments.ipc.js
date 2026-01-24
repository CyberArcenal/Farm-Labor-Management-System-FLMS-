// ipc/worker/get/with_payments.ipc.js (Optimized)
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerWithPayments(params = {}) {
  try {
    // @ts-ignore
    const { id, periodStart, periodEnd, includeDetails = true, _userId } = params;

    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const worker = await workerRepository.findOne({
      where: { id: parseInt(id) },
      relations: includeDetails ? ['kabisilya', 'payments', 'payments.history'] : ['kabisilya']
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Filter payments by date if specified
    let filteredPayments = worker.payments || [];
    if (periodStart && periodEnd) {
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      // @ts-ignore
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    // Calculate totals
    const totalPayments = filteredPayments.length;
    // @ts-ignore
    const totalNetPay = filteredPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.netPay || 0), 0
    );
    // @ts-ignore
    const totalGrossPay = filteredPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.grossPay || 0), 0
    );
    // @ts-ignore
    const totalDebtDeduction = filteredPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.totalDebtDeduction || 0), 0
    );
    // @ts-ignore
    const totalOtherDeductions = filteredPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.otherDeductions || 0), 0
    );

    // Group by payment method
    const paymentsByMethod = {};
    // @ts-ignore
    filteredPayments.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      // @ts-ignore
      if (!paymentsByMethod[method]) {
        // @ts-ignore
        paymentsByMethod[method] = {
          count: 0,
          totalAmount: 0,
          payments: []
        };
      }
      // @ts-ignore
      paymentsByMethod[method].count++;
      // @ts-ignore
      paymentsByMethod[method].totalAmount += parseFloat(payment.netPay || 0);
      if (includeDetails) {
        // @ts-ignore
        paymentsByMethod[method].payments.push({
          id: payment.id,
          amount: payment.netPay,
          date: payment.paymentDate,
          status: payment.status
        });
      }
    });

    // Group by status
    const paymentsByStatus = {};
    // @ts-ignore
    filteredPayments.forEach(payment => {
      const status = payment.status || 'unknown';
      // @ts-ignore
      if (!paymentsByStatus[status]) {
        // @ts-ignore
        paymentsByStatus[status] = {
          count: 0,
          totalAmount: 0
        };
      }
      // @ts-ignore
      paymentsByStatus[status].count++;
      // @ts-ignore
      paymentsByStatus[status].totalAmount += parseFloat(payment.netPay || 0);
    });

    return {
      status: true,
      message: 'Worker with payments retrieved successfully',
      data: { 
        worker: {
          id: worker.id,
          name: worker.name,
          kabisilya: worker.kabisilya,
          totalDebt: worker.totalDebt,
          totalPaid: worker.totalPaid,
          currentBalance: worker.currentBalance
        },
        paymentSummary: {
          totalPayments,
          totalGrossPay,
          totalNetPay,
          totalDeductions: totalDebtDeduction + totalOtherDeductions,
          breakdown: {
            debtDeduction: totalDebtDeduction,
            otherDeductions: totalOtherDeductions
          },
          averageNetPay: totalPayments > 0 ? totalNetPay / totalPayments : 0,
          averageGrossPay: totalPayments > 0 ? totalGrossPay / totalPayments : 0,
          paymentsByMethod: Object.entries(paymentsByMethod).map(([method, data]) => ({
            method,
            count: data.count,
            totalAmount: data.totalAmount,
            percentage: totalNetPay > 0 ? (data.totalAmount / totalNetPay) * 100 : 0,
            payments: data.payments
          })),
          paymentsByStatus: Object.entries(paymentsByStatus).map(([status, data]) => ({
            status,
            count: data.count,
            totalAmount: data.totalAmount
          })),
          recentPayments: filteredPayments
            // @ts-ignore
            .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt))
            .slice(0, 10)
            // @ts-ignore
            .map(payment => ({
              id: payment.id,
              date: payment.paymentDate,
              netPay: payment.netPay,
              status: payment.status,
              method: payment.paymentMethod
            }))
        },
        period: periodStart && periodEnd ? {
          start: periodStart,
          end: periodEnd,
          // @ts-ignore
          days: Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (1000 * 60 * 60 * 24)) + 1
        } : null
      }
    };
  } catch (error) {
    console.error('Error in getWorkerWithPayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker payments: ${error.message}`,
      data: null
    };
  }
};