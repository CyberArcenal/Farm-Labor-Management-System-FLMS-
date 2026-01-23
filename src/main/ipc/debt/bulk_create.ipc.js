//@ts-check

const validateDebtData = require("./validate_data.ipc");

module.exports = async (/** @type {{ debts: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { debts } = params; // Array of debt objects

    if (!Array.isArray(debts) || debts.length === 0) {
      return {
        status: false,
        message: "Debts array is required and must not be empty",
        data: null
      };
    }

    const debtRepository = queryRunner.manager.getRepository("Debt");
    const workerRepository = queryRunner.manager.getRepository("Worker");
    const results = {
      success: [],
      failed: []
    };

    for (const debtData of debts) {
      try {
        // Validate each debt data
        const validation = await validateDebtData(debtData);
        if (!validation.status) {
          // @ts-ignore
          results.failed.push({
            data: debtData,
            error: validation.message
          });
          continue;
        }

        // Check if worker exists
        const worker = await workerRepository.findOne({ where: { id: debtData.worker_id } });
        if (!worker) {
          // @ts-ignore
          results.failed.push({
            data: debtData,
            error: "Worker not found"
          });
          continue;
        }

        // Create debt
        const debt = debtRepository.create({
          worker: { id: debtData.worker_id },
          originalAmount: debtData.amount,
          amount: debtData.amount,
          balance: debtData.amount,
          reason: debtData.reason,
          dueDate: debtData.dueDate,
          interestRate: debtData.interestRate || 0,
          paymentTerm: debtData.paymentTerm,
          status: "pending",
          dateIncurred: new Date()
        });

        const savedDebt = await debtRepository.save(debt);

        // Update worker's total debt summary
        worker.totalDebt = parseFloat(worker.totalDebt) + parseFloat(debtData.amount);
        worker.currentBalance = parseFloat(worker.currentBalance) + parseFloat(debtData.amount);
        await workerRepository.save(worker);

        // @ts-ignore
        results.success.push(savedDebt);
      } catch (error) {
        // @ts-ignore
        results.failed.push({
          data: debtData,
          // @ts-ignore
          error: error.message
        });
      }
    }

    return {
      status: true,
      message: `Bulk create completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results
    };
  } catch (error) {
    console.error("Error in bulk create debts:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};