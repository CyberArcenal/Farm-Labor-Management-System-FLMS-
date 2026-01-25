// src/ipc/debt/get/collection_report.ipc
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (dateRange = {}, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    const debtHistoryRepository = AppDataSource.getRepository("DebtHistory");
    
    // @ts-ignore
    const { startDate, endDate } = dateRange;
    const queryStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const queryEndDate = endDate || new Date();

    // Get payments made in the date range
    const payments = await debtHistoryRepository.find({
      where: {
        transactionType: "payment",
        transactionDate: {
          $between: [queryStartDate, queryEndDate]
        }
      },
      relations: ["debt", "debt.worker"],
      order: { transactionDate: "DESC" }
    });

    // Group payments by date
    const paymentsByDate = payments.reduce((acc, payment) => {
      const date = payment.transactionDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalAmount: 0,
          paymentCount: 0,
          payments: []
        };
      }
      acc[date].totalAmount += parseFloat(payment.amountPaid);
      acc[date].paymentCount++;
      acc[date].payments.push(payment);
      return acc;
    }, {});

    // Get overdue debts
    const today = new Date();
    const overdueDebts = await debtRepository.find({
      where: {
        balance: { $gt: 0 },
        dueDate: { $lt: today },
        status: { $notIn: ["paid", "cancelled"] }
      },
      relations: ["worker"],
      order: { dueDate: "ASC" }
    });

    // Calculate collection efficiency
    const totalCollected = payments.reduce((sum, payment) => sum + parseFloat(payment.amountPaid), 0);
    const totalOverdue = overdueDebts.reduce((sum, debt) => sum + parseFloat(debt.balance), 0);
    const totalActiveDebts = await debtRepository.sum("balance", {
      balance: { $gt: 0 },
      status: { $notIn: ["paid", "cancelled"] }
    }) || 0;

    const collectionRate = totalActiveDebts > 0 
      ? (totalCollected / (totalCollected + totalActiveDebts)) * 100 
      : 0;

    const report = {
      dateRange: {
        startDate: queryStartDate,
        endDate: queryEndDate
      },
      summary: {
        totalCollected,
        totalPayments: payments.length,
        totalOverdue,
        totalActiveDebts,
        collectionRate: parseFloat(collectionRate.toFixed(2)),
        overdueCount: overdueDebts.length
      },
      paymentsByDate: Object.values(paymentsByDate),
      topCollectors: Array.from(
        // @ts-ignore
        payments.reduce((map, payment) => {
          const workerName = payment.debt.worker.name;
          const amount = parseFloat(payment.amountPaid);
          if (!map.has(workerName)) {
            map.set(workerName, { workerName, totalCollected: 0, paymentCount: 0 });
          }
          const entry = map.get(workerName);
          entry.totalCollected += amount;
          entry.paymentCount++;
          return map;
        }, new Map())
      ).map(([_, value]) => value).sort((a, b) => b.totalCollected - a.totalCollected).slice(0, 10),
      overdueDebts: overdueDebts.map(debt => ({
        id: debt.id,
        workerName: debt.worker.name,
        balance: debt.balance,
        dueDate: debt.dueDate,
        // @ts-ignore
        overdueDays: Math.floor((today - new Date(debt.dueDate)) / (1000 * 60 * 60 * 24))
      })),
      paymentMethods: Array.from(
        // @ts-ignore
        payments.reduce((map, payment) => {
          const method = payment.paymentMethod || 'Unknown';
          if (!map.has(method)) {
            map.set(method, { method, count: 0, totalAmount: 0 });
          }
          const entry = map.get(method);
          entry.count++;
          entry.totalAmount += parseFloat(payment.amountPaid);
          return map;
        }, new Map())
      ).map(([_, value]) => value)
    };

    return {
      status: true,
      message: "Debt collection report generated successfully",
      data: report
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