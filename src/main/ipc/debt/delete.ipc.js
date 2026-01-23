// src/ipc/debt/delete.ipc.js
//@ts-check

module.exports = async (/** @type {{ id: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { id } = params;
    
    const debtRepository = queryRunner.manager.getRepository("Debt");
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

    const worker = debt.worker;
    const debtAmount = parseFloat(debt.amount);
    const debtBalance = parseFloat(debt.balance);

    // Update debt status to cancelled instead of hard delete
    debt.status = "cancelled";
    debt.balance = 0;
    debt.notes = debt.notes ? `${debt.notes}\n[Cancelled on ${new Date().toISOString()}]` : `Cancelled on ${new Date().toISOString()}`;
    await debtRepository.save(debt);

    // Update worker's totals
    worker.totalDebt = parseFloat(worker.totalDebt) - debtAmount;
    worker.currentBalance = parseFloat(worker.currentBalance) - debtBalance;
    await workerRepository.save(worker);

    return {
      status: true,
      message: "Debt cancelled successfully",
      data: { id }
    };
  } catch (error) {
    console.error("Error deleting debt:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};