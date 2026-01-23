// src/ipc/debt/check_debt_limit.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");

module.exports = async (/** @type {{ worker_id: any; newDebtAmount: any; }} */ params) => {
  try {
    const { worker_id, newDebtAmount } = params;
    
    const workerRepository = AppDataSource.getRepository("Worker");
    const debtRepository = AppDataSource.getRepository("Debt");

    // Get worker with current debts
    const worker = await workerRepository.findOne({ 
      where: { id: worker_id }
    });

    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null
      };
    }

    // Calculate current debt load
    const currentDebt = parseFloat(worker.currentBalance);
    const proposedDebt = currentDebt + parseFloat(newDebtAmount);

    // Define debt limit (this could be configurable)
    const debtLimit = 10000; // Example: 10,000 peso limit

    const isWithinLimit = proposedDebt <= debtLimit;
    const remainingLimit = debtLimit - proposedDebt;

    return {
      status: true,
      message: isWithinLimit ? "Within debt limit" : "Exceeds debt limit",
      data: {
        isWithinLimit,
        currentDebt,
        proposedDebt,
        debtLimit,
        remainingLimit,
        canProceed: isWithinLimit
      }
    };
  } catch (error) {
    console.error("Error checking debt limit:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};