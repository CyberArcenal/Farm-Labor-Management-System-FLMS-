// src/ipc/debt/delete.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { id, reason, _userId } = params;

    const debtRepository = queryRunner.manager.getRepository(Debt);
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    const workerRepository = queryRunner.manager.getRepository(Worker);

    // Get debt with worker
    const debt = await debtRepository.findOne({
      where: { id },
      relations: ["worker"],
    });

    if (!debt) {
      return { status: false, message: "Debt not found", data: null };
    }

    // 🚫 Prevent double cancel
    if (debt.status === "cancelled") {
      return { status: false, message: "Debt is already cancelled", data: null };
    }

    const worker = debt.worker;
    const debtAmount = parseFloat(debt.amount || 0);
    const debtBalance = parseFloat(debt.balance || 0);
    const oldBalance = debtBalance;

    // Update debt status to cancelled instead of hard delete
    debt.status = "cancelled";
    debt.balance = 0;
    debt.updatedAt = new Date();
    debt.notes =
      (debt.notes ? debt.notes + "\n" : "") +
      `[${new Date().toISOString()}] Cancelled. Reason: ${reason || "N/A"}`;
    await debtRepository.save(debt);

    // Update worker's totals safely
    worker.totalDebt = Math.max(0, parseFloat(worker.totalDebt || 0) - debtAmount);
    worker.currentBalance = Math.max(0, parseFloat(worker.currentBalance || 0) - debtBalance);
    await workerRepository.save(worker);

    // Log cancellation in DebtHistory
    const history = debtHistoryRepository.create({
      debt: { id },
      amountPaid: 0,
      previousBalance: oldBalance,
      newBalance: 0,
      transactionType: "cancellation",
      notes: `Debt cancelled. Reason: ${reason || "N/A"}`,
      transactionDate: new Date(),
      performedBy: _userId ? String(_userId) : null,
      changeReason: "debt_cancel",
    });
    await debtHistoryRepository.save(history);

    return {
      status: true,
      message: "Debt cancelled successfully",
      data: { id, cancellationRecord: history },
    };
  } catch (error) {
    console.error("Error cancelling debt:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};