// src/ipc/debt/check_debt_limit.ipc.js
//@ts-check

const { getDebtLimit } = require("../../../utils/system");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async (
  /** @type {{ worker_id: any; newDebtAmount: any; }} */ params,
) => {
  try {
    const { worker_id, newDebtAmount } = params;

    const workerRepository = AppDataSource.getRepository("Worker");

    // Get worker with current debts
    const worker = await workerRepository.findOne({
      where: { id: worker_id },
    });

    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null,
      };
    }

    // Calculate current debt load
    const currentDebt = parseFloat(worker.currentBalance || 0);
    const proposedDebt = currentDebt + parseFloat(newDebtAmount || 0);

    // ✅ Fetch debt limit from settings util
    const debtLimit = await getDebtLimit(); // e.g. returns numeric value from settings table/config

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
        canProceed: isWithinLimit,
      },
    };
  } catch (error) {
    console.error("Error checking debt limit:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null,
    };
  }
};
