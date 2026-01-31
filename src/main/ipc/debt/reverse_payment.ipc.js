// src/ipc/debt/reverse_payment.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { debt_history_id, reason, _userId } = params;

    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    const debtRepository = queryRunner.manager.getRepository(Debt);
    const workerRepository = queryRunner.manager.getRepository(Worker);

    // Get the payment history record
    const paymentHistory = await debtHistoryRepository.findOne({
      where: { id: debt_history_id },
      relations: ["debt", "debt.worker"],
    });

    if (!paymentHistory) {
      return { status: false, message: "Payment history record not found", data: null };
    }

    if (paymentHistory.transactionType !== "payment") {
      return { status: false, message: "Only payment transactions can be reversed", data: null };
    }

    // 🚫 Prevent double reversal
    const alreadyReversed = await debtHistoryRepository.findOne({
      where: { notes: `Payment reversal: ${paymentHistory.amountPaid}. Original payment: ${paymentHistory.id}. Reason: ${reason}` },
    });
    if (alreadyReversed) {
      return { status: false, message: "This payment has already been reversed", data: null };
    }

    const debt = paymentHistory.debt;
    const worker = debt.worker;
    const reversedAmount = parseFloat(paymentHistory.amountPaid);

    // 🚫 Prevent reversal on closed debts
    const lockedStatuses = ["settled", "cancelled"];
    if (lockedStatuses.includes(debt.status)) {
      return { status: false, message: `Cannot reverse payment on debt with status '${debt.status}'`, data: null };
    }

    const oldBalance = parseFloat(debt.balance);

    // Reverse the payment: add back to debt balance
    debt.balance = oldBalance + reversedAmount;
    debt.totalPaid = Math.max(0, parseFloat(debt.totalPaid || 0) - reversedAmount);

    // Update status based on new balance
    if (debt.balance > 0) {
      if (debt.balance === parseFloat(debt.amount)) {
        debt.status = "pending";
      } else {
        debt.status = "partially_paid";
      }
    }

    debt.updatedAt = new Date();
    await debtRepository.save(debt);

    // Update worker's summary
    worker.totalPaid = Math.max(0, parseFloat(worker.totalPaid || 0) - reversedAmount);
    worker.currentBalance = parseFloat(worker.currentBalance || 0) + reversedAmount;
    await workerRepository.save(worker);

    // Create reversal history record
    const reversalHistory = debtHistoryRepository.create({
      debt: { id: debt.id },
      amountPaid: 0,
      previousBalance: oldBalance,
      newBalance: debt.balance,
      transactionType: "refund",
      notes: `Payment reversal: ${reversedAmount}. Original payment: ${paymentHistory.id}. Reason: ${reason}`,
      transactionDate: new Date(),
      performedBy: _userId ? String(_userId) : null,
      changeReason: "payment_reversal",
    });

    await debtHistoryRepository.save(reversalHistory);

    return {
      status: true,
      message: "Payment reversed successfully",
      data: {
        debt,
        reversedAmount,
        reversalRecord: reversalHistory,
      },
    };
  } catch (error) {
    console.error("Error reversing payment:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};