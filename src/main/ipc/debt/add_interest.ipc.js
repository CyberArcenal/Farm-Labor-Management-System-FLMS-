// src/ipc/debt/add_interest.ipc.js
//@ts-check


module.exports = async (/** @type {{ id: any; interestAmount: any; notes: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { id, interestAmount, notes } = params;
    
    const debtRepository = queryRunner.manager.getRepository("Debt");
    const debtHistoryRepository = queryRunner.manager.getRepository("DebtHistory");
    const workerRepository = queryRunner.manager.getRepository("Worker");

    // Get debt with worker
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

    if (parseFloat(interestAmount) <= 0) {
      return {
        status: false,
        message: "Interest amount must be greater than 0",
        data: null
      };
    }

    const worker = debt.worker;
    const previousBalance = parseFloat(debt.balance);
    const interest = parseFloat(interestAmount);
    const newBalance = previousBalance + interest;

    // Update debt
    debt.balance = newBalance;
    debt.totalInterest = parseFloat(debt.totalInterest) + interest;
    debt.updatedAt = new Date();

    await debtRepository.save(debt);

    // Create interest history record
    const debtHistory = debtHistoryRepository.create({
      debt: { id },
      amountPaid: 0,
      previousBalance: previousBalance,
      newBalance: newBalance,
      transactionType: "interest",
      notes: notes || `Interest added: ${interest}`,
      transactionDate: new Date()
    });

    await debtHistoryRepository.save(debtHistory);

    // Update worker's current balance
    worker.currentBalance = parseFloat(worker.currentBalance) + interest;
    await workerRepository.save(worker);

    return {
      status: true,
      message: "Interest added successfully",
      data: {
        debt,
        interestAdded: interest
      }
    };
  } catch (error) {
    console.error("Error adding interest:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};