// src/ipc/debt/reverse_payment.ipc.js
//@ts-check

module.exports = async (/** @type {{ debt_history_id: any; reason: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { debt_history_id, reason } = params;
    
    const debtHistoryRepository = queryRunner.manager.getRepository("DebtHistory");
    const debtRepository = queryRunner.manager.getRepository("Debt");
    const workerRepository = queryRunner.manager.getRepository("Worker");

    // Get the payment history record
    const paymentHistory = await debtHistoryRepository.findOne({
      where: { id: debt_history_id },
      relations: ["debt", "debt.worker"]
    });

    if (!paymentHistory) {
      return {
        status: false,
        message: "Payment history record not found",
        data: null
      };
    }

    if (paymentHistory.transactionType !== "payment") {
      return {
        status: false,
        message: "Only payment transactions can be reversed",
        data: null
      };
    }

    const debt = paymentHistory.debt;
    const worker = debt.worker;
    const reversedAmount = parseFloat(paymentHistory.amountPaid);

    // Reverse the payment: add back to debt balance
    debt.balance = parseFloat(debt.balance) + reversedAmount;
    debt.totalPaid = Math.max(0, parseFloat(debt.totalPaid) - reversedAmount);
    
    // Update status based on new balance
    if (debt.balance > 0) {
      if (debt.balance === parseFloat(debt.amount)) {
        debt.status = "pending";
      } else {
        debt.status = "partially_paid";
      }
    }

    await debtRepository.save(debt);

    // Update worker's summary
    worker.totalPaid = Math.max(0, parseFloat(worker.totalPaid) - reversedAmount);
    worker.currentBalance = parseFloat(worker.currentBalance) + reversedAmount;
    await workerRepository.save(worker);

    // Create reversal history record
    const reversalHistory = debtHistoryRepository.create({
      debt: { id: debt.id },
      amountPaid: 0,
      previousBalance: parseFloat(debt.balance) - reversedAmount,
      newBalance: debt.balance,
      transactionType: "refund",
      notes: `Payment reversal: ${reversedAmount}. Original payment: ${paymentHistory.id}. Reason: ${reason}`,
      transactionDate: new Date()
    });

    await debtHistoryRepository.save(reversalHistory);

    return {
      status: true,
      message: "Payment reversed successfully",
      data: {
        debt,
        reversedAmount,
        reversalRecord: reversalHistory
      }
    };
  } catch (error) {
    console.error("Error reversing payment:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};