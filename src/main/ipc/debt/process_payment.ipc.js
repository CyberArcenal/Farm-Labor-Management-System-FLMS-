//@ts-check

module.exports = async (/** @type {{ debt_ids: any; payment_data: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { debt_ids, payment_data } = params; // payment_data: { amount, paymentMethod, referenceNumber, notes }
    
    const debtRepository = queryRunner.manager.getRepository("Debt");
    const debtHistoryRepository = queryRunner.manager.getRepository("DebtHistory");
    const workerRepository = queryRunner.manager.getRepository("Worker");

    const results = {
      success: [],
      failed: []
    };

    for (const debt_id of debt_ids) {
      try {
        // Get debt with worker
        const debt = await debtRepository.findOne({ 
          where: { id: debt_id },
          relations: ["worker"]
        });

        if (!debt) {
          // @ts-ignore
          results.failed.push({
            debt_id,
            error: "Debt not found"
          });
          continue;
        }

        const worker = debt.worker;
        const previousBalance = parseFloat(debt.balance);
        const paymentAmount = parseFloat(payment_data.amount);
        const newBalance = previousBalance - paymentAmount;

        // Check if payment is valid
        if (paymentAmount <= 0) {
          // @ts-ignore
          results.failed.push({
            debt_id,
            error: "Payment amount must be greater than 0"
          });
          continue;
        }

        if (paymentAmount > previousBalance) {
          // @ts-ignore
          results.failed.push({
            debt_id,
            error: "Payment amount exceeds debt balance"
          });
          continue;
        }

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
          paymentMethod: payment_data.paymentMethod,
          referenceNumber: payment_data.referenceNumber,
          notes: payment_data.notes,
          transactionDate: new Date()
        });

        await debtHistoryRepository.save(debtHistory);

        // Update worker's summary
        worker.totalPaid = parseFloat(worker.totalPaid) + paymentAmount;
        worker.currentBalance = parseFloat(worker.currentBalance) - paymentAmount;
        await workerRepository.save(worker);

        // @ts-ignore
        results.success.push({
          debt_id,
          payment: debtHistory
        });
      } catch (error) {
        // @ts-ignore
        results.failed.push({
          debt_id,
          // @ts-ignore
          error: error.message
        });
      }
    }

    return {
      status: true,
      message: `Payment processed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};