// src/ipc/debt/process_debt_payment.ipc.js
// @ts-check
const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");
const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const { farmSessionDefaultSessionId, farmDebtAllocationStrategy } = require("../../../utils/system");
const { decideDebtAllocations } = require("./utils/debtAllocation");
const { generateReferenceNumber } = require("./utils/reference");
const { In } = require("typeorm");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  const { workerId, paymentAmount, paymentMethod, userId } = params;

  try {
    const debtRepository = queryRunner.manager.getRepository(Debt);
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    const workerRepository = queryRunner.manager.getRepository(Worker);
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);

    if (!workerId || workerId <= 0) {
      return { status: false, message: "Invalid workerId", data: null };
    }
    if (!paymentAmount || paymentAmount <= 0) {
      return { status: false, message: "Payment amount must be greater than zero", data: null };
    }

    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return { status: false, message: "No default session configured.", data: null };
    }

    const worker = await workerRepository.findOne({ where: { id: workerId } });
    if (!worker) {
      return { status: false, message: "Worker not found", data: null };
    }

    // ✅ Hanapin lahat ng pending payments ng worker sa session
 const payments = await paymentRepository.find({
  where: { 
    worker: { id: workerId }, 
    session: { id: sessionId }, 
    status: In(["pending", "partially_paid"]) 
  },
  relations: ["worker", "session"]
});


    if (payments.length === 0) {
      return { status: false, message: "No pending payroll payments found for this worker/session", data: null };
    }

    // ✅ Get active debts
    const activeDebts = await debtRepository.find({
      where: { worker: { id: workerId }, status: In(["pending", "partially_paid"]) },
      order: { dateIncurred: "ASC" }
    });
    if (activeDebts.length === 0) {
      return { status: false, message: "No active debts found for this worker", data: null };
    }

    const allocationStrategy = await farmDebtAllocationStrategy();
    const allocations = await decideDebtAllocations(activeDebts, paymentAmount);
    const referenceNumber = generateReferenceNumber("DEBT");

    if (allocations.length === 0) {
      return { status: false, message: "No valid debt allocations could be calculated", data: null };
    }

    let totalAllocated = 0;
    const updatedDebts = [];

    // ✅ Loop sa bawat Payment record
    let remainingDeduction = paymentAmount;
    for (const payment of payments) {
      if (remainingDeduction <= 0) break;

      const oldGross = parseFloat(payment.grossPay);
      const deduction = Math.min(oldGross, remainingDeduction);

      payment.totalDebtDeduction = parseFloat(payment.totalDebtDeduction) + deduction;
      payment.grossPay = oldGross - deduction;
      payment.netPay = payment.grossPay
        - parseFloat(payment.manualDeduction || 0)
        - parseFloat(payment.otherDeductions || 0);

      // ✅ Status logic
      if (payment.grossPay <= 0 || payment.netPay <= 0) {
        payment.status = "completed";
      } else if (deduction > 0) {
        payment.status = "partially_paid";
      }

      // update breakdown JSON
      const breakdown = payment.deductionBreakdown || {};
      breakdown.debtAllocations = breakdown.debtAllocations || [];
      payment.deductionBreakdown = breakdown;

      await paymentRepository.save(payment);

      // log PaymentHistory
      const paymentHistory = paymentHistoryRepository.create({
        payment: { id: payment.id },
        actionType: "deduction",
        changedField: "grossPay",
        oldAmount: oldGross,
        newAmount: payment.grossPay,
        notes: `Deducted ${deduction} from grossPay to pay debts`,
        performedBy: userId,
      });
      await paymentHistoryRepository.save(paymentHistory);

      remainingDeduction -= deduction;
    }

    // ✅ Update debts + log DebtHistory
    for (const alloc of allocations) {
      // @ts-ignore
      const debt = activeDebts.find(d => d.id === alloc.debtId);
      if (!debt) continue;

      const prevBalance = parseFloat(debt.balance);
      // @ts-ignore
      const allocatedAmount = parseFloat(alloc.allocatedAmount);
      if (allocatedAmount <= 0 || prevBalance <= 0) continue;

      const newBalance = Math.max(prevBalance - allocatedAmount, 0);

      debt.balance = newBalance;
      debt.totalPaid = parseFloat(debt.totalPaid) + allocatedAmount;
      debt.lastPaymentDate = new Date();
      debt.status = newBalance === 0 ? "paid" : "partially_paid";

      await debtRepository.save(debt);

      const debtHistory = debtHistoryRepository.create({
        debt: { id: debt.id },
        amountPaid: allocatedAmount,
        previousBalance: prevBalance,
        newBalance,
        transactionType: "payment",
        paymentMethod,
        referenceNumber,
        notes: `Debt paid via salary deduction (${allocationStrategy}). User ${userId}`,
      });
      await debtHistoryRepository.save(debtHistory);

      totalAllocated += allocatedAmount;
      updatedDebts.push({ debtId: debt.id, allocatedAmount, previousBalance: prevBalance, newBalance });
    }

    // ✅ Update worker summary
    worker.totalPaid = parseFloat(worker.totalPaid) + totalAllocated;
    worker.currentBalance = parseFloat(worker.currentBalance) - totalAllocated;
    await workerRepository.save(worker);

    return {
      status: true,
      message: "Debt payment processed successfully via salary deduction",
      data: {
        workerId,
        // @ts-ignore
        paymentIds: payments.map(p => p.id),
        paymentAmount,
        paymentMethod,
        allocationStrategy,
        totalAllocated,
        referenceNumber,
        allocations: updatedDebts,
        remainingBalance: parseFloat(worker.currentBalance),
        // @ts-ignore
        payments: payments.map(p => ({
          id: p.id,
          newGrossPay: p.grossPay,
          newNetPay: p.netPay,
          status: p.status,
          deductionBreakdown: p.deductionBreakdown
        }))
      },
    };
  } catch (error) {
    console.error("Error processing debt payment:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};