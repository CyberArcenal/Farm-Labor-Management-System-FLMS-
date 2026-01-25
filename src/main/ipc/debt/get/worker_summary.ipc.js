// src/ipc/debt/get/worker_summary.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (/** @type {any} */ workerId, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    const workerRepository = AppDataSource.getRepository("Worker");
    
    // Get worker info
    const worker = await workerRepository.findOne({ where: { id: workerId } });
    
    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null
      };
    }

    // Get all debts for this worker
    const debts = await debtRepository.find({
      where: { worker: { id: workerId } },
      relations: ["history"]
    });

    // Calculate summary
    const totalDebt = debts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
    const totalBalance = debts.reduce((sum, debt) => sum + parseFloat(debt.balance), 0);
    const totalPaid = debts.reduce((sum, debt) => sum + parseFloat(debt.totalPaid), 0);
    
    const activeDebts = debts.filter(debt => 
      parseFloat(debt.balance) > 0 && 
      debt.status !== "paid" && 
      debt.status !== "cancelled"
    ).length;

    const overdueDebts = debts.filter(debt => {
      if (!debt.dueDate || parseFloat(debt.balance) <= 0) return false;
      const dueDate = new Date(debt.dueDate);
      const today = new Date();
      return dueDate < today;
    }).length;

    const summary = {
      worker,
      totalDebt,
      totalBalance,
      totalPaid,
      activeDebts,
      overdueDebts,
      totalDebtsCount: debts.length,
      debtBreakdown: {
        pending: debts.filter(d => d.status === "pending").length,
        partially_paid: debts.filter(d => d.status === "partially_paid").length,
        paid: debts.filter(d => d.status === "paid").length,
        cancelled: debts.filter(d => d.status === "cancelled").length,
        overdue: debts.filter(d => d.status === "overdue").length
      }
    };

    return {
      status: true,
      message: "Worker debt summary retrieved successfully",
      data: summary
    };
  } catch (error) {
    console.error("Error getting worker debt summary:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};