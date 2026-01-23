// src/ipc/debt/update.ipc.js
//@ts-check

module.exports = async (/** @type {{ id: any; amount: any; reason: any; dueDate: any; interestRate: any; paymentTerm: any; notes: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { id, amount, reason, dueDate, interestRate, paymentTerm, notes } = params;
    
    const debtRepository = queryRunner.manager.getRepository("Debt");
    const debtHistoryRepository = queryRunner.manager.getRepository("DebtHistory");
    const workerRepository = queryRunner.manager.getRepository("Worker");

    // Get current debt with worker
    const debt = await debtRepository.findOne({ 
      where: { id },
      relations: ["worker"]
    });

    if (!debt) {
      return {
        status: false,
        message: "Debt not found",
        data: null
      };
    }

    const worker = debt.worker;
    const originalAmount = parseFloat(debt.amount);
    const originalBalance = parseFloat(debt.balance);

    // Calculate the difference if amount changes
    let amountDifference = 0;
    if (amount && parseFloat(amount) !== originalAmount) {
      amountDifference = parseFloat(amount) - originalAmount;
      debt.amount = parseFloat(amount);
      debt.balance = originalBalance + amountDifference;
    }

    // Update other fields
    if (reason !== undefined) debt.reason = reason;
    if (dueDate !== undefined) debt.dueDate = dueDate;
    if (interestRate !== undefined) debt.interestRate = parseFloat(interestRate);
    if (paymentTerm !== undefined) debt.paymentTerm = paymentTerm;
    if (notes !== undefined) debt.notes = notes;

    debt.updatedAt = new Date();

    const updatedDebt = await debtRepository.save(debt);

    // Update worker's total debt if amount changed
    if (amountDifference !== 0) {
      worker.totalDebt = parseFloat(worker.totalDebt) + amountDifference;
      worker.currentBalance = parseFloat(worker.currentBalance) + amountDifference;
      await workerRepository.save(worker);

      // Log adjustment in history
      const history = debtHistoryRepository.create({
        debt: { id },
        amountPaid: 0,
        previousBalance: originalBalance,
        newBalance: debt.balance,
        transactionType: "adjustment",
        notes: `Debt amount adjusted by ${amountDifference > 0 ? '+' : ''}${amountDifference}`,
        transactionDate: new Date()
      });
      await debtHistoryRepository.save(history);
    }

    return {
      status: true,
      message: "Debt updated successfully",
      data: updatedDebt
    };
  } catch (error) {
    console.error("Error updating debt:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};