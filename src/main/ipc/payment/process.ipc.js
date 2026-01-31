// src/ipc/payment/process.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function processPayment(params = {}, queryRunner = null) {
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
    const {
      // @ts-ignore
      paymentId,
      // @ts-ignore
      paymentDate,
      // @ts-ignore
      paymentMethod,
      // @ts-ignore
      referenceNumber,
      // @ts-ignore
      _userId,
    } = params;

    if (!paymentId) {
      return { status: false, message: "Payment ID is required", data: null };
    }
    if (!_userId) {
      return { status: false, message: "User ID is required for audit trail", data: null };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["worker", "debtPayments", "session", "pitak"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // Only pending payments can be processed
    if (payment.status !== "pending") {
      return {
        status: false,
        message: `Payment cannot be processed. Current status: ${payment.status}`,
        data: null,
      };
    }

    // Prevent duplicate referenceNumber within same session (if provided)
    if (referenceNumber) {
      const existingRef = await paymentRepository.findOne({
        where: {
          referenceNumber,
          session: payment.session ? { id: payment.session.id } : null,
        },
      });
      if (existingRef && existingRef.id !== payment.id) {
        return {
          status: false,
          message: "Duplicate reference number detected for this session",
          data: { conflictingPaymentId: existingRef.id },
        };
      }
    }

    // Validate that netPay covers debt deductions
    const netPay = parseFloat(payment.netPay || 0);
    const totalDebtDeduction = parseFloat(payment.totalDebtDeduction || 0);
    if (totalDebtDeduction > netPay) {
      return {
        status: false,
        message: `Total debt deductions (${totalDebtDeduction.toFixed(2)}) exceed payment net pay (${netPay.toFixed(2)})`,
        data: null,
      };
    }

    // Update payment details
    payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    payment.paymentMethod = paymentMethod || payment.paymentMethod || null;
    payment.referenceNumber = referenceNumber || payment.referenceNumber || null;
    payment.status = "completed";
    payment.updatedAt = new Date();

    // Apply debt deductions first (this will update debts and worker totals)
    if (totalDebtDeduction > 0) {
      await applyDebtDeductions(payment, queryRunner, _userId);
    }

    // Save updated payment
    const updatedPayment = await paymentRepository.save(payment);

    // Update worker aggregates: add netPay to totalPaid and reduce currentBalance by netPay
    if (payment.worker && payment.worker.id) {
      // @ts-ignore
      const workerRepository = queryRunner.manager.getRepository(Worker);
      const worker = await workerRepository.findOne({ where: { id: payment.worker.id } });
      if (worker) {
        worker.totalPaid = parseFloat((parseFloat(worker.totalPaid || 0) + netPay).toFixed(2));
        worker.currentBalance = parseFloat(Math.max(0, parseFloat(worker.currentBalance || 0) - netPay).toFixed(2));
        worker.updatedAt = new Date();
        await workerRepository.save(worker);
      }
    }

    // Create payment history entry for status change
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: "status_change",
      changedField: "status",
      oldValue: "pending",
      newValue: "completed",
      notes: `Payment processed via ${payment.paymentMethod || "unknown method"}`,
      performedBy: String(_userId),
      changeDate: new Date(),
      changeReason: "process_payment",
    });
    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "process_payment",
      description: `Processed payment #${paymentId} for ${payment.worker ? payment.worker.name : "unknown worker"}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return { status: true, message: "Payment processed successfully", data: { payment: updatedPayment } };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in processPayment:", error);
    // @ts-ignore
    return { status: false, message: `Failed to process payment: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};

// @ts-ignore
async function applyDebtDeductions(payment, queryRunner, performedBy) {
  const debtRepository = queryRunner.manager.getRepository(Debt);
  const debtHistoryRepo = queryRunner.manager.getRepository(DebtHistory);
  const workerRepository = queryRunner.manager.getRepository(Worker);

  // Find outstanding debts for the worker ordered by dueDate
  const debts = await debtRepository.find({
    where: {
      worker: { id: payment.worker.id },
      status: ["pending", "partially_paid"],
    },
    order: { dueDate: "ASC" },
  });

  let remainingDeduction = parseFloat(payment.totalDebtDeduction || 0);
  if (remainingDeduction <= 0) return;

  // Load worker once
  const worker = await workerRepository.findOne({ where: { id: payment.worker.id } });

  for (const debt of debts) {
    if (remainingDeduction <= 0) break;

    const debtBalance = parseFloat(debt.balance || 0);
    if (debtBalance <= 0) continue;

    const deductionAmount = Math.min(remainingDeduction, debtBalance);

    const oldDebtBalance = debtBalance;
    const oldDebtTotalPaid = parseFloat(debt.totalPaid || 0);

    // Update debt safely
    const newDebtBalance = parseFloat((debtBalance - deductionAmount).toFixed(2));
    const newDebtTotalPaid = parseFloat((oldDebtTotalPaid + deductionAmount).toFixed(2));

    debt.balance = newDebtBalance;
    debt.totalPaid = newDebtTotalPaid;
    debt.lastPaymentDate = new Date();
    debt.updatedAt = new Date();

    if (newDebtBalance <= 0) {
      debt.status = "paid";
    } else {
      debt.status = "partially_paid";
    }

    await debtRepository.save(debt);

    // Create debt history entry with audit fields and link to payment if supported
    const debtHistory = debtHistoryRepo.create({
      debt: { id: debt.id },
      amountPaid: deductionAmount,
      previousBalance: oldDebtBalance,
      newBalance: newDebtBalance,
      transactionType: "payment",
      paymentMethod: payment.paymentMethod || null,
      notes: `Paid via payment #${payment.id}`,
      transactionDate: new Date(),
      performedBy: performedBy ? String(performedBy) : null,
      changeReason: "payment_deduction",
      payment: payment.id ? { id: payment.id } : undefined,
    });
    await debtHistoryRepo.save(debtHistory);

    // Update worker aggregates to reflect debt payment
    if (worker) {
      worker.totalPaid = parseFloat((parseFloat(worker.totalPaid || 0) + deductionAmount).toFixed(2));
      worker.currentBalance = parseFloat(Math.max(0, parseFloat(worker.currentBalance || 0) - deductionAmount).toFixed(2));
      worker.updatedAt = new Date();
      await workerRepository.save(worker);
    }

    remainingDeduction = parseFloat((remainingDeduction - deductionAmount).toFixed(2));
  }

  // Create a PaymentHistory entry summarizing the deduction applied
  if (parseFloat(payment.totalDebtDeduction || 0) > 0) {
    const paymentHistoryRepo = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepo.create({
      payment: { id: payment.id },
      actionType: "deduction",
      changedField: "totalDebtDeduction",
      oldAmount: 0,
      newAmount: parseFloat(payment.totalDebtDeduction || 0),
      notes: `Applied debt deductions totaling ${parseFloat(payment.totalDebtDeduction || 0).toFixed(2)}`,
      performedBy: performedBy ? String(performedBy) : null,
      changeDate: new Date(),
      changeReason: "apply_debt_deductions",
    });
    await paymentHistoryRepo.save(paymentHistory);
  }
}