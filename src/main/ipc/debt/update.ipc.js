// src/ipc/debt/update.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { id, amount, reason, dueDate, interestRate, paymentTerm, notes, _userId } = params;

    const debtRepository = queryRunner.manager.getRepository(Debt);
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    const workerRepository = queryRunner.manager.getRepository(Worker);

    // Get current debt with worker
    const debt = await debtRepository.findOne({
      where: { id },
      relations: ["worker"],
    });

    if (!debt) {
      return { status: false, message: "Debt not found", data: null };
    }

    // 🚫 Prevent updates on closed debts
    const lockedStatuses = ["paid", "settled", "cancelled"];
    if (lockedStatuses.includes(debt.status)) {
      return {
        status: false,
        message: `Cannot update debt with status '${debt.status}'.`,
        data: null,
      };
    }

    const worker = debt.worker;
    const originalAmount = parseFloat(debt.amount || 0);
    const originalBalance = parseFloat(debt.balance || 0);

    // Calculate the difference if amount changes
    let amountDifference = 0;
    if (amount !== undefined && parseFloat(amount) !== originalAmount) {
      amountDifference = parseFloat(amount) - originalAmount;
      const newBalance = originalBalance + amountDifference;

      // 🚫 Prevent negative balance
      if (newBalance < 0) {
        return {
          status: false,
          message: `Update would result in negative balance. Current: ${originalBalance}, Adjustment: ${amountDifference}`,
          data: null,
        };
      }

      debt.amount = parseFloat(amount);
      debt.balance = newBalance;
    }

    // Update other fields
    if (reason !== undefined) debt.reason = reason;
    if (dueDate !== undefined) debt.dueDate = dueDate;
    if (interestRate !== undefined) debt.interestRate = parseFloat(interestRate);
    if (paymentTerm !== undefined) debt.paymentTerm = paymentTerm;
    if (notes !== undefined) {
      debt.notes =
        (debt.notes ? debt.notes + "\n" : "") +
        `[${new Date().toISOString()}] ${notes}`;
    }

    debt.updatedAt = new Date();

    const updatedDebt = await debtRepository.save(debt);

    // Update worker's totals if amount changed
    if (amountDifference !== 0) {
      worker.totalDebt = Math.max(0, parseFloat(worker.totalDebt || 0) + amountDifference);
      worker.currentBalance = Math.max(0, parseFloat(worker.currentBalance || 0) + amountDifference);
      await workerRepository.save(worker);

      // Log adjustment in history
      const history = debtHistoryRepository.create({
        debt: { id },
        amountPaid: 0,
        previousBalance: originalBalance,
        newBalance: debt.balance,
        transactionType: "adjustment",
        notes: `Debt amount adjusted by ${amountDifference > 0 ? "+" : ""}${amountDifference}`,
        transactionDate: new Date(),
        performedBy: _userId ? String(_userId) : null,
        changeReason: "debt_update",
      });
      await debtHistoryRepository.save(history);
    }

    return {
      status: true,
      message: "Debt updated successfully",
      data: updatedDebt,
    };
  } catch (error) {
    console.error("Error updating debt:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};