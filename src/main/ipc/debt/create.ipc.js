// src/ipc/debt/create.ipc.js
//@ts-check

const { farmSessionDefaultSessionId } = require("../../../utils/system");


module.exports = async (/** @type {{ worker_id: any; amount: any; reason: any; dueDate: any; interestRate: any; paymentTerm: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { worker_id, amount, reason, dueDate, interestRate, paymentTerm } = params;

    const debtRepository = queryRunner.manager.getRepository("Debt");
    const workerRepository = queryRunner.manager.getRepository("Worker");

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return {
        status: false,
        message: "No default session configured. Please set one in Settings.",
        data: null,
      };
    }

    // Check if worker exists
    const worker = await workerRepository.findOne({ where: { id: worker_id } });
    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null,
      };
    }

    // ✅ Create debt tied to session
    const debt = debtRepository.create({
      worker: { id: worker_id },
      session: { id: sessionId }, // 🔑 tie to default session
      originalAmount: amount,
      amount: amount,
      balance: amount,
      reason,
      dueDate,
      interestRate: interestRate || 0,
      paymentTerm,
      status: "pending",
      dateIncurred: new Date(),
    });

    const savedDebt = await debtRepository.save(debt);

    // Update worker's total debt summary
    worker.totalDebt = parseFloat(worker.totalDebt) + parseFloat(amount);
    worker.currentBalance = parseFloat(worker.currentBalance) + parseFloat(amount);
    await workerRepository.save(worker);

    return {
      status: true,
      message: "Debt created successfully",
      data: { ...savedDebt, sessionId },
    };
  } catch (error) {
    console.error("Error creating debt:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null,
    };
  }
};