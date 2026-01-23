//@ts-check
const csv = require("csv-parser");
const fs = require("fs");

module.exports = async (/** @type {{ filePath: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { filePath } = params;

    if (!filePath) {
      return {
        status: false,
        message: "File path is required",
        data: null
      };
    }

    const debtRepository = queryRunner.manager.getRepository("Debt");
    const workerRepository = queryRunner.manager.getRepository("Worker");
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    /**
       * @type {any[]}
       */
    const debts = [];
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        debts.push(row);
      });

    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    for (const row of debts) {
      try {
        // Map CSV columns to debt fields (adjust according to your CSV structure)
        const debtData = {
          worker_id: row.worker_id,
          amount: row.amount,
          reason: row.reason,
          dueDate: row.dueDate ? new Date(row.dueDate) : null,
          interestRate: row.interestRate || 0,
          paymentTerm: row.paymentTerm || null
        };

        // Check if worker exists
        const worker = await workerRepository.findOne({ where: { id: debtData.worker_id } });
        if (!worker) {
          results.failed++;
          // @ts-ignore
          results.errors.push(`Worker not found: ${debtData.worker_id}`);
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
          interestRate: debtData.interestRate,
          paymentTerm: debtData.paymentTerm,
          status: "pending",
          dateIncurred: new Date()
        });

        await debtRepository.save(debt);

        // Update worker's total debt summary
        worker.totalDebt = parseFloat(worker.totalDebt) + parseFloat(debtData.amount);
        worker.currentBalance = parseFloat(worker.currentBalance) + parseFloat(debtData.amount);
        await workerRepository.save(worker);

        results.success++;
      } catch (error) {
        results.failed++;
        // @ts-ignore
        results.errors.push(error.message);
      }
    }

    return {
      status: true,
      message: `CSV import completed. Success: ${results.success}, Failed: ${results.failed}`,
      data: results
    };
  } catch (error) {
    console.error("Error importing CSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};