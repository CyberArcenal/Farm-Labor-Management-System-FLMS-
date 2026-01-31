// src/ipc/debt/add_interest.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { id, interestAmount, notes, _userId } = params;

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

    // 🚫 Prevent adding interest if debt is already closed
    const lockedStatuses = ["paid", "settled", "cancelled"];
    if (lockedStatuses.includes(debt.status)) {
      return {
        status: false,
        message: `Cannot add interest to debt with status '${debt.status}'.`,
        data: null,
      };
    }

    const interest = parseFloat(interestAmount);
    if (!interest || interest <= 0) {
      return {
        status: false,
        message: "Interest amount must be greater than 0",
        data: null,
      };
    }

    const worker = debt.worker;
    const previousBalance = parseFloat(debt.balance);
    const newBalance = previousBalance + interest;

    // Update debt
    debt.balance = newBalance;
    debt.totalInterest = parseFloat(debt.totalInterest || 0) + interest;
    debt.updatedAt = new Date();

    await debtRepository.save(debt);

    // Create interest history record
    const debtHistory = debtHistoryRepository.create({
      debt: { id },
      amountPaid: 0,
      previousBalance,
      newBalance,
      transactionType: "interest",
      notes:
        notes ||
        `[${new Date().toISOString()}] Interest added: +${interest.toFixed(2)}`,
      transactionDate: new Date(),
      performedBy: _userId ? String(_userId) : null,
      changeReason: "interest_accrual",
    });

    await debtHistoryRepository.save(debtHistory);

    // Update worker's current balance and totalDebt
    worker.currentBalance = parseFloat(worker.currentBalance) + interest;
    worker.totalDebt = parseFloat(worker.totalDebt) + interest;
    await workerRepository.save(worker);

    return {
      status: true,
      message: `Interest of ${interest.toFixed(2)} added successfully. New balance: ${newBalance.toFixed(2)}`,
      data: {
        debt,
        interestAdded: interest,
        previousBalance,
        newBalance,
      },
    };
  } catch (error) {
    console.error("Error adding interest:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null,
    };
  }
};