//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (dateRange = {}, /** @type {any} */ userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange;
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
    
    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || new Date();

    const debtHistoryRepository = AppDataSource.getRepository("DebtHistory");
    
    // Get all payment transactions within date range
    const payments = await debtHistoryRepository
      .createQueryBuilder("history")
      .leftJoinAndSelect("history.debt", "debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .where("history.transactionType = :type", { type: "payment" })
      .andWhere("history.transactionDate BETWEEN :startDate AND :endDate", {
        startDate: queryStartDate,
        endDate: queryEndDate
      })
      .orderBy("history.transactionDate", "DESC")
      .getMany();

    // Calculate totals
    const totalCollected = payments.reduce((/** @type {number} */ sum, /** @type {{ amountPaid: string; }} */ payment) => sum + parseFloat(payment.amountPaid), 0);
    
    // Group by payment method
    const byPaymentMethod = payments.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ paymentMethod: string; amountPaid: string; }} */ payment) => {
      const method = payment.paymentMethod || 'Unknown';
      if (!acc[method]) acc[method] = 0;
      acc[method] += parseFloat(payment.amountPaid);
      return acc;
    }, {});

    // Group by worker
    const byWorker = payments.reduce((/** @type {{ [x: string]: { payments: number; }; }} */ acc, /** @type {{ debt: { worker: { id: any; name: any; }; }; amountPaid: string; }} */ payment) => {
      const workerId = payment.debt.worker.id;
      if (!acc[workerId]) {
        acc[workerId] = {
          // @ts-ignore
          workerName: payment.debt.worker.name,
          totalPaid: 0,
          payments: 0
        };
      }
      // @ts-ignore
      acc[workerId].totalPaid += parseFloat(payment.amountPaid);
      acc[workerId].payments++;
      return acc;
    }, {});

    // Daily collection trend
    const dailyTrend = payments.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ transactionDate: { toISOString: () => string; }; amountPaid: string; }} */ payment) => {
      const date = payment.transactionDate.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += parseFloat(payment.amountPaid);
      return acc;
    }, {});

    return {
      status: true,
      message: "Collection report generated successfully",
      data: {
        totalCollected,
        paymentCount: payments.length,
        byPaymentMethod,
        byWorker,
        dailyTrend,
        payments: payments.slice(0, 50), // Last 50 payments
        dateRange: {
          startDate: queryStartDate,
          endDate: queryEndDate
        }
      }
    };
  } catch (error) {
    console.error("Error generating collection report:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};