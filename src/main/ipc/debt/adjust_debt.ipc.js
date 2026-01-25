// src/ipc/debt/adjust_debt.ipc.js
//@ts-check

module.exports = async (/** @type {{ id: any; amount: any; reason: any; notes: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { id, amount, reason, notes } = params;
    
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

    if (!amount || parseFloat(amount) === 0) {
      return {
        status: false,
        message: "Adjustment amount is required and cannot be zero",
        data: null
      };
    }

    const worker = debt.worker;
    const previousBalance = parseFloat(debt.balance);
    const adjustmentAmount = parseFloat(amount);
    const newBalance = previousBalance + adjustmentAmount;

    // Validate that adjustment doesn't make balance negative
    if (newBalance < 0) {
      return {
        status: false,
        message: `Adjustment cannot make balance negative. Current: ${previousBalance}, Adjustment: ${adjustmentAmount}`,
        data: null
      };
    }

    // Update debt
    debt.balance = newBalance;
    
    // If increasing the debt, update the original amount too
    if (adjustmentAmount > 0) {
      debt.amount = parseFloat(debt.amount) + adjustmentAmount;
      debt.originalAmount = parseFloat(debt.originalAmount) + adjustmentAmount;
      worker.totalDebt = parseFloat(worker.totalDebt) + adjustmentAmount;
    }
    
    // If decreasing the debt (negative adjustment), update total paid
    if (adjustmentAmount < 0) {
      debt.totalPaid = parseFloat(debt.totalPaid) + Math.abs(adjustmentAmount);
    }

    debt.updatedAt = new Date();
    
    // Update status based on new balance
    if (newBalance <= 0) {
      debt.status = "paid";
    } else if (newBalance < parseFloat(debt.originalAmount)) {
      debt.status = "partially_paid";
    } else {
      debt.status = "pending";
    }

    await debtRepository.save(debt);

    // Create adjustment history record
    const debtHistory = debtHistoryRepository.create({
      debt: { id },
      amountPaid: 0,
      previousBalance: previousBalance,
      newBalance: newBalance,
      transactionType: "adjustment",
      notes: notes || reason || `Debt adjusted by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}`,
      transactionDate: new Date()
    });

    await debtHistoryRepository.save(debtHistory);

    // Update worker's current balance
    worker.currentBalance = parseFloat(worker.currentBalance) + adjustmentAmount;
    await workerRepository.save(worker);

    return {
      status: true,
      message: `Debt adjusted successfully by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}. New balance: ${newBalance}`,
      data: {
        debt,
        adjustment: {
          amount: adjustmentAmount,
          previousBalance,
          newBalance
        }
      }
    };
  } catch (error) {
    console.error("Error adjusting debt:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};