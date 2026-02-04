// src/ipc/payment/bulk_process.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkProcessPayments(
  params = {},
  queryRunner = null,
) {
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
    const { paymentIds, paymentDate, paymentMethod, referenceNumber, _userId } =
      params;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return {
        status: false,
        message: "Payment IDs array is required and cannot be empty",
        data: null,
      };
    }
    if (!_userId) {
      return {
        status: false,
        message: "User ID is required for audit trail",
        data: null,
      };
    }

    const MAX_BATCH_SIZE = 50;
    if (paymentIds.length > MAX_BATCH_SIZE) {
      return {
        status: false,
        message: `Cannot process more than ${MAX_BATCH_SIZE} payments at once`,
        data: null,
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    // @ts-ignore
    const paymentHistoryRepo =
      // @ts-ignore
      queryRunner.manager.getRepository(PaymentHistory);
    // @ts-ignore
    // @ts-ignore
    const debtRepository = queryRunner.manager.getRepository(Debt);
    // @ts-ignore
    // @ts-ignore
    const debtHistoryRepo = queryRunner.manager.getRepository(DebtHistory);

    const results = {
      success: [],
      failed: [],
      total: paymentIds.length,
      successCount: 0,
      failedCount: 0,
      totalAmount: 0,
    };

    for (let i = 0; i < paymentIds.length; i++) {
      const paymentId = paymentIds[i];

      try {
        // Load payment with worker and session/pitak for context
        const payment = await paymentRepository.findOne({
          where: { id: paymentId },
          relations: ["worker", "pitak", "session"],
        });

        if (!payment) {
          // @ts-ignore
          results.failed.push({
            index: i,
            paymentId,
            error: "Payment not found",
          });
          continue;
        }

        // Prevent processing non-pending or cancelled payments
        if (payment.status !== "pending") {
          // @ts-ignore
          results.failed.push({
            index: i,
            paymentId,
            error: `Payment cannot be processed. Current status: ${payment.status}`,
          });
          continue;
        }
        if (payment.status === "cancelled") {
          // @ts-ignore
          results.failed.push({
            index: i,
            paymentId,
            error: "Cannot process cancelled payment",
          });
          continue;
        }

        // Ensure numeric fields are safe
        const netPay = parseFloat(payment.netPay || 0);
        const totalDebtDeduction = parseFloat(payment.totalDebtDeduction || 0);

        // Update payment details
        payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
        payment.paymentMethod = paymentMethod || payment.paymentMethod || null;
        payment.status = "completed";
        payment.updatedAt = new Date();

        // Update reference number if provided
        if (referenceNumber) {
          payment.referenceNumber = referenceNumber;
        }

        // Apply debt deductions first (this will update debts and worker totals)
        if (totalDebtDeduction > 0) {
          await applyDebtDeductions(payment, queryRunner, _userId);
        }

        // Save updated payment
        const updatedPayment = await paymentRepository.save(payment);

        // Update worker aggregates: add netPay to totalPaid and reduce currentBalance by netPay
        if (payment.worker && payment.worker.id) {
          const worker = await workerRepository.findOne({
            where: { id: payment.worker.id },
          });
          if (worker) {
            worker.totalPaid = parseFloat(
              (parseFloat(worker.totalPaid || 0) + netPay).toFixed(2),
            );
            worker.currentBalance = parseFloat(
              Math.max(
                0,
                parseFloat(worker.currentBalance || 0) - netPay,
              ).toFixed(2),
            );
            worker.updatedAt = new Date();
            await workerRepository.save(worker);
          }
        }

        // Create payment history entry for status change - FIXED: Added oldAmount and newAmount
        const paymentHistory = paymentHistoryRepo.create({
          payment: updatedPayment,
          actionType: "status_change",
          changedField: "status",
          oldValue: "pending",
          newValue: "completed",
          // FIX: Added amount fields for proper auditing
          oldAmount: 0.0,
          newAmount: netPay,
          notes: `Payment processed via bulk operation (${payment.paymentMethod || paymentMethod || "unknown method"})`,
          performedBy: String(_userId),
          changeDate: new Date(),
          referenceNumber: payment.referenceNumber,
        });
        await paymentHistoryRepo.save(paymentHistory);

        // @ts-ignore
        results.success.push({
          index: i,
          paymentId,
          workerName: payment.worker ? payment.worker.name : null,
          amount: netPay,
        });
        results.successCount++;
        results.totalAmount += netPay;
      } catch (error) {
        // @ts-ignore
        results.failed.push({ index: i, paymentId, error: error.message });
        results.failedCount++;
      }
    }

    // Log user activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: "bulk_process_payments",
      description: `Processed ${results.successCount} payments via bulk operation (${results.failedCount} failed). Total amount: ${results.totalAmount.toFixed(2)}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    // Commit if at least one success, otherwise rollback
    if (shouldRelease) {
      if (results.successCount > 0) {
        // @ts-ignore
        await queryRunner.commitTransaction();
      } else {
        // @ts-ignore
        await queryRunner.rollbackTransaction();
      }
    }

    return {
      status: true,
      message: `Bulk payment processing completed: ${results.successCount} successful, ${results.failedCount} failed`,
      data: {
        success: results.successCount,
        failed: results.failedCount,
        totalAmount: results.totalAmount,
        averageAmount:
          results.successCount > 0
            ? results.totalAmount / results.successCount
            : 0,
        errors: results.failed,
        // @ts-ignore
        processedPayments: results.success.map((s) => ({
          // @ts-ignore
          index: s.index,
          // @ts-ignore
          paymentId: s.paymentId,
          // @ts-ignore
          workerName: s.workerName,
          // @ts-ignore
          amount: s.amount,
        })),
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in bulkProcessPayments:", error);
    // @ts-ignore
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk process payments: ${error.message}`,
      data: null,
    };
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
  const paymentHistoryRepo = queryRunner.manager.getRepository(PaymentHistory);

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
  const worker = await workerRepository.findOne({
    where: { id: payment.worker.id },
  });

  for (const debt of debts) {
    if (remainingDeduction <= 0) break;

    const debtBalance = parseFloat(debt.balance || 0);
    if (debtBalance <= 0) continue;

    const deductionAmount = Math.min(remainingDeduction, debtBalance);

    const oldDebtBalance = debtBalance;
    const oldDebtTotalPaid = parseFloat(debt.totalPaid || 0);

    // Update debt safely
    const newDebtBalance = parseFloat(
      (debtBalance - deductionAmount).toFixed(2),
    );
    const newDebtTotalPaid = parseFloat(
      (oldDebtTotalPaid + deductionAmount).toFixed(2),
    );

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
      notes: `Paid via bulk processed payment #${payment.id}`,
      transactionDate: new Date(),
      performedBy: performedBy ? String(performedBy) : null,
      changeReason: "payment_deduction",
      payment: payment.id ? { id: payment.id } : undefined,
    });
    await debtHistoryRepo.save(debtHistory);

    // Update worker aggregates to reflect debt payment
    if (worker) {
      worker.totalPaid = parseFloat(
        (parseFloat(worker.totalPaid || 0) + deductionAmount).toFixed(2),
      );
      worker.currentBalance = parseFloat(
        Math.max(
          0,
          parseFloat(worker.currentBalance || 0) - deductionAmount,
        ).toFixed(2),
      );
      worker.updatedAt = new Date();
      await workerRepository.save(worker);
    }

    // Decrease remaining deduction
    remainingDeduction = parseFloat(
      (remainingDeduction - deductionAmount).toFixed(2),
    );
  }

  // If any deduction was applied, create a PaymentHistory entry for the deduction
  if (parseFloat(payment.totalDebtDeduction || 0) > 0) {
    const paymentHistory = paymentHistoryRepo.create({
      payment: { id: payment.id },
      actionType: "deduction",
      changedField: "totalDebtDeduction",
      oldAmount: 0,
      newAmount: parseFloat(payment.totalDebtDeduction || 0),
      notes: `Applied debt deductions totaling ${parseFloat(payment.totalDebtDeduction || 0).toFixed(2)}`,
      performedBy: performedBy ? String(performedBy) : null,
      changeDate: new Date(),
    });
    await paymentHistoryRepo.save(paymentHistory);
  }
}
