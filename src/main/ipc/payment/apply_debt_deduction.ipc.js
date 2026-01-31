// src/ipc/payment/apply_debt_deduction.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Debt = require("../../../entities/Debt");
const PaymentHistory = require("../../../entities/PaymentHistory");
const DebtHistory = require("../../../entities/DebtHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function applyDebtDeduction(params = {}, queryRunner = null) {
  let shouldRelease = false;

  if (!queryRunner) {
    // @ts-ignore
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { paymentId, debtId, deductionAmount, _userId } = params;

    // Basic validations
    if (!paymentId) {
      return { status: false, message: "Payment ID is required", data: null };
    }
    if (!deductionAmount || isNaN(parseFloat(deductionAmount)) || parseFloat(deductionAmount) <= 0) {
      return { status: false, message: "Valid deduction amount is required", data: null };
    }
    if (!_userId) {
      return { status: false, message: "User ID is required for audit trail", data: null };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const debtRepository = queryRunner.manager.getRepository(Debt);
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    // @ts-ignore
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);

    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["worker"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // Prevent deductions on cancelled payments
    if (payment.status === "cancelled") {
      return { status: false, message: `Cannot apply deduction to payment with status '${payment.status}'`, data: null };
    }

    // Ensure payment has enough netPay to cover deduction
    const deduction = parseFloat(deductionAmount);
    const currentNetPay = parseFloat(payment.netPay || 0);
    if (deduction > currentNetPay) {
      return { status: false, message: `Deduction (${deduction.toFixed(2)}) exceeds payment net pay (${currentNetPay.toFixed(2)})`, data: null };
    }

    // If specific debt is provided, validate and update debt
    let affectedDebt = null;
    if (debtId) {
      const debt = await debtRepository.findOne({
        where: { id: debtId, worker: { id: payment.worker.id } },
        relations: ["worker"],
      });

      if (!debt) {
        return { status: false, message: "Debt not found for this worker", data: null };
      }

      // Prevent deduction if debt is cancelled/settled
      const lockedDebtStatuses = ["cancelled", "settled"];
      if (lockedDebtStatuses.includes(debt.status)) {
        return { status: false, message: `Cannot apply deduction to debt with status '${debt.status}'`, data: null };
      }

      const debtBalance = parseFloat(debt.balance || 0);
      if (deduction > debtBalance) {
        return { status: false, message: `Deduction amount (${deduction.toFixed(2)}) exceeds debt balance (${debtBalance.toFixed(2)})`, data: null };
      }

      // Update debt numeric fields safely
      const newDebtBalance = parseFloat((debtBalance - deduction).toFixed(2));
      const newDebtTotalPaid = parseFloat((parseFloat(debt.totalPaid || 0) + deduction).toFixed(2));

      const oldDebtBalance = debtBalance;

      debt.balance = newDebtBalance;
      debt.totalPaid = newDebtTotalPaid;
      debt.lastPaymentDate = new Date();
      debt.updatedAt = new Date();

      // Update debt status
      if (newDebtBalance <= 0) {
        debt.status = "paid";
      } else {
        debt.status = "partially_paid";
      }

      await debtRepository.save(debt);
      affectedDebt = debt;

      // Update worker totals (reflect payment applied to debt)
      const worker = debt.worker;
      worker.totalPaid = Math.max(0, parseFloat(worker.totalPaid || 0) + deduction);
      worker.currentBalance = Math.max(0, parseFloat(worker.currentBalance || 0) - deduction);
      // @ts-ignore
      await queryRunner.manager.getRepository("Worker").save(worker);

      // Create DebtHistory entry linking to payment
      const debtHistory = debtHistoryRepository.create({
        debt: { id: debt.id },
        amountPaid: deduction,
        previousBalance: oldDebtBalance,
        newBalance: newDebtBalance,
        transactionType: "payment",
        notes: `Applied deduction from payment #${paymentId}`,
        transactionDate: new Date(),
        performedBy: String(_userId),
        changeReason: "payment_deduction",
        // optional: link to payment if your DebtHistory entity supports it
        payment: paymentId ? { id: paymentId } : undefined,
      });
      await debtHistoryRepository.save(debtHistory);
    }

    // Update payment totals and breakdown safely
    const oldTotalDebtDeduction = parseFloat(payment.totalDebtDeduction || 0);
    const newTotalDebtDeduction = parseFloat((oldTotalDebtDeduction + deduction).toFixed(2));
    const oldNetPay = currentNetPay;
    const newNetPay = parseFloat((oldNetPay - deduction).toFixed(2));

    // Prevent negative net pay (already checked above, but guard again)
    if (newNetPay < 0) {
      return { status: false, message: "Deduction would result in negative net pay", data: null };
    }

    payment.totalDebtDeduction = newTotalDebtDeduction;
    payment.netPay = newNetPay;
    payment.updatedAt = new Date();

    // Update deductionBreakdown object
    let breakdown = {};
    try {
      breakdown = payment.deductionBreakdown && typeof payment.deductionBreakdown === "object"
        ? payment.deductionBreakdown
        : (payment.deductionBreakdown ? JSON.parse(payment.deductionBreakdown) : {});
    } catch (e) {
      // @ts-ignore
      breakdown = {};
    }

    // @ts-ignore
    breakdown.debtDeductions = parseFloat(((parseFloat(breakdown.debtDeductions || 0) + deduction)).toFixed(2));
    // @ts-ignore
    breakdown.totalDeductions = parseFloat(((parseFloat(breakdown.totalDeductions || 0) + deduction)).toFixed(2));
    payment.deductionBreakdown = breakdown;

    await paymentRepository.save(payment);

    // Create payment history entry (deduction)
    const paymentHistory = paymentHistoryRepository.create({
      payment: payment,
      actionType: "deduction",
      changedField: "debt_deduction",
      oldAmount: oldTotalDebtDeduction,
      newAmount: newTotalDebtDeduction,
      notes: debtId ? `Applied debt deduction for debt #${debtId}` : "Applied general debt deduction",
      performedBy: String(_userId),
      changeDate: new Date(),
      changeReason: "apply_debt_deduction",
    });
    await paymentHistoryRepository.save(paymentHistory);

    // Log user activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: "apply_debt_deduction",
      description: `Applied ${deduction.toFixed(2)} debt deduction to payment #${paymentId}${debtId ? ` (debt #${debtId})` : ""}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: "Debt deduction applied successfully",
      data: {
        payment,
        debt: affectedDebt || null,
        paymentHistory,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in applyDebtDeduction:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to apply debt deduction: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};