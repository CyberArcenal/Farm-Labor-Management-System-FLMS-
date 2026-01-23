// src/ipc/debt/make_payment.ipc.js
//@ts-check

module.exports = async (/** @type {{ debt_id: any; amount: any; paymentMethod: any; referenceNumber: any; notes: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { debt_id, amount, paymentMethod, referenceNumber, notes } = params;
    
    const debtRepository = queryRunner.manager.getRepository("Debt");
    const debtHistoryRepository = queryRunner.manager.getRepository("DebtHistory");
    const workerRepository = queryRunner.manager.getRepository("Worker");

    // Get debt with worker
    const debt = await debtRepository.findOne({ 
      where: { id: debt_id },
      relations: ["worker"]
    });

    if (!debt) {
      return {
        status: false,
        message: "Debt not found",
        data: null
      };
    }

    if (parseFloat(amount) <= 0) {
      return {
        status: false,
        message: "Payment amount must be greater than 0",
        data: null
      };
    }

    if (parseFloat(amount) > parseFloat(debt.balance)) {
      return {
        status: false,
        message: "Payment amount exceeds debt balance",
        data: null
      };
    }

    const previousBalance = parseFloat(debt.balance);
    const paymentAmount = parseFloat(amount);
    const newBalance = previousBalance - paymentAmount;

    // Update debt
    debt.balance = newBalance;
    debt.totalPaid = parseFloat(debt.totalPaid) + paymentAmount;
    debt.lastPaymentDate = new Date();

    // Update status based on new balance
    if (newBalance <= 0) {
      debt.status = "paid";
    } else if (newBalance < parseFloat(debt.amount)) {
      debt.status = "partially_paid";
    }

    await debtRepository.save(debt);

    // Create debt history record
    const debtHistory = debtHistoryRepository.create({
      debt: { id: debt_id },
      amountPaid: paymentAmount,
      previousBalance: previousBalance,
      newBalance: newBalance,
      transactionType: "payment",
      paymentMethod,
      referenceNumber,
      notes,
      transactionDate: new Date()
    });

    await debtHistoryRepository.save(debtHistory);

    // Update worker's summary
    const worker = debt.worker;
    worker.totalPaid = parseFloat(worker.totalPaid) + paymentAmount;
    worker.currentBalance = parseFloat(worker.currentBalance) - paymentAmount;
    await workerRepository.save(worker);

    return {
      status: true,
      message: "Payment processed successfully",
      data: {
        debt,
        payment: debtHistory
      }
    };
  } catch (error) {
    console.error("Error making payment:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};