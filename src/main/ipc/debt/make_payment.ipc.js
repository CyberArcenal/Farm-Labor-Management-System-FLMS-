// src/ipc/debt/make_payment.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { debt_id, amount, paymentMethod, referenceNumber, notes, _userId } = params;

    const debtRepository = queryRunner.manager.getRepository(Debt);
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    const workerRepository = queryRunner.manager.getRepository(Worker);

    // Get debt with worker
    const debt = await debtRepository.findOne({
      where: { id: debt_id },
      relations: ["worker"],
    });

    if (!debt) {
      return { status: false, message: "Debt not found", data: null };
    }

    // 🚫 Prevent payments on closed debts
    const lockedStatuses = ["paid", "settled", "cancelled"];
    if (lockedStatuses.includes(debt.status)) {
      return {
        status: false,
        message: `Cannot make payment on debt with status '${debt.status}'.`,
        data: null,
      };
    }

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return { status: false, message: "Payment amount must be greater than 0", data: null };
    }

    const previousBalance = parseFloat(debt.balance);
    if (paymentAmount > previousBalance) {
      return { status: false, message: "Payment amount exceeds debt balance", data: null };
    }

    // Require method + reference for audit clarity
    if (!paymentMethod || !referenceNumber) {
      return {
        status: false,
        message: "Payment method and reference number are required",
        data: null,
      };
    }

    const newBalance = previousBalance - paymentAmount;

    // Update debt
    debt.balance = newBalance;
    debt.totalPaid = parseFloat(debt.totalPaid || 0) + paymentAmount;
    debt.lastPaymentDate = new Date();
    debt.updatedAt = new Date();

    // Update status based on new balance
    if (newBalance <= 0) {
      debt.status = "paid";
    } else if (newBalance < parseFloat(debt.amount)) {
      debt.status = "partially_paid";
    } else {
      debt.status = "active";
    }

    await debtRepository.save(debt);

    // Create debt history record
    const debtHistory = debtHistoryRepository.create({
      debt: { id: debt_id },
      amountPaid: paymentAmount,
      previousBalance,
      newBalance,
      transactionType: "payment",
      paymentMethod,
      referenceNumber,
      notes: notes || `[${new Date().toISOString()}] Payment processed`,
      transactionDate: new Date(),
      performedBy: _userId ? String(_userId) : null,
      changeReason: "manual_payment",
    });

    await debtHistoryRepository.save(debtHistory);

    // Update worker's summary
    const worker = debt.worker;
    worker.totalPaid = parseFloat(worker.totalPaid || 0) + paymentAmount;
    worker.currentBalance = parseFloat(worker.currentBalance || 0) - paymentAmount;
    await workerRepository.save(worker);

    return {
      status: true,
      message: `Payment of ${paymentAmount.toFixed(2)} processed successfully. New balance: ${newBalance.toFixed(2)}`,
      data: {
        debt,
        payment: debtHistory,
      },
    };
  } catch (error) {
    console.error("Error making payment:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};