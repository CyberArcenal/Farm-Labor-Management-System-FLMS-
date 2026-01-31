// src/ipc/payment/update_deductions.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateDeductions(params = {}, queryRunner = null) {
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
      manualDeduction,
      // @ts-ignore
      otherDeductions,
      // @ts-ignore
      deductionBreakdown,
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
      relations: ["debtPayments", "worker"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // Disallow changing deductions for completed payments or payments that already applied debt payments
    if (payment.status === "completed") {
      return { status: false, message: "Cannot update deductions for completed payments", data: null };
    }
    if (payment.debtPayments && payment.debtPayments.length > 0) {
      return {
        status: false,
        message: "Cannot update deductions for payments that have applied debt payments. Reverse deductions first.",
        data: null,
      };
    }

    // Parse and validate numeric inputs
    const oldValues = {
      manualDeduction: parseFloat(payment.manualDeduction || 0),
      otherDeductions: parseFloat(payment.otherDeductions || 0),
      deductionBreakdown: payment.deductionBreakdown || {},
      netPay: parseFloat(payment.netPay || 0),
      grossPay: parseFloat(payment.grossPay || 0),
      totalDebtDeduction: parseFloat(payment.totalDebtDeduction || 0),
    };

    if (manualDeduction !== undefined && (isNaN(parseFloat(manualDeduction)) || parseFloat(manualDeduction) < 0)) {
      return { status: false, message: "manualDeduction must be a non-negative number", data: null };
    }
    if (otherDeductions !== undefined && (isNaN(parseFloat(otherDeductions)) || parseFloat(otherDeductions) < 0)) {
      return { status: false, message: "otherDeductions must be a non-negative number", data: null };
    }

    // Build new deduction values (do not double-count)
    const newManual = manualDeduction !== undefined ? parseFloat(manualDeduction || 0) : oldValues.manualDeduction;
    const newOther = otherDeductions !== undefined ? parseFloat(otherDeductions || 0) : oldValues.otherDeductions;
    const totalDebt = oldValues.totalDebtDeduction; // debt deductions are separate and already on payment

    // Ensure deductions do not exceed gross pay
    const totalDeductions = parseFloat((totalDebt + newManual + newOther).toFixed(2));
    if (totalDeductions > oldValues.grossPay) {
      return {
        status: false,
        message: `Total deductions (${totalDeductions.toFixed(2)}) exceed gross pay (${oldValues.grossPay.toFixed(2)})`,
        data: null,
      };
    }

    // Apply updates
    payment.manualDeduction = newManual;
    payment.otherDeductions = newOther;

    // Normalize deductionBreakdown to an object with numeric fields
    const normalizedBreakdown = (() => {
      try {
        if (!deductionBreakdown) return {
          manualDeduction: newManual,
          debtDeductions: totalDebt,
          otherDeductions: newOther,
          totalDeductions,
        };
        const parsed = typeof deductionBreakdown === "object" ? deductionBreakdown : JSON.parse(deductionBreakdown);
        return {
          manualDeduction: parseFloat((parsed.manualDeduction !== undefined ? parseFloat(parsed.manualDeduction) : newManual).toFixed(2)),
          debtDeductions: parseFloat((parsed.debtDeductions !== undefined ? parseFloat(parsed.debtDeductions) : totalDebt).toFixed(2)),
          otherDeductions: parseFloat((parsed.otherDeductions !== undefined ? parseFloat(parsed.otherDeductions) : newOther).toFixed(2)),
          totalDeductions: parseFloat(( (parsed.manualDeduction !== undefined ? parseFloat(parsed.manualDeduction) : newManual)
            + (parsed.debtDeductions !== undefined ? parseFloat(parsed.debtDeductions) : totalDebt)
            + (parsed.otherDeductions !== undefined ? parseFloat(parsed.otherDeductions) : newOther)
          ).toFixed(2)),
        };
      } catch (e) {
        return {
          manualDeduction: newManual,
          debtDeductions: totalDebt,
          otherDeductions: newOther,
          totalDeductions,
        };
      }
    })();

    payment.deductionBreakdown = normalizedBreakdown;

    // Recalculate net pay and guard against negative
    const recalculatedNet = parseFloat((oldValues.grossPay - normalizedBreakdown.totalDeductions).toFixed(2));
    payment.netPay = parseFloat(Math.max(0, recalculatedNet).toFixed(2));
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entries
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const historyEntries = [];

    if (manualDeduction !== undefined && oldValues.manualDeduction !== newManual) {
      historyEntries.push({
        actionType: "update",
        changedField: "manualDeduction",
        oldAmount: oldValues.manualDeduction,
        newAmount: newManual,
        notes: "Manual deduction updated",
        changeReason: "update_deductions",
      });
    }

    if (otherDeductions !== undefined && oldValues.otherDeductions !== newOther) {
      historyEntries.push({
        actionType: "update",
        changedField: "otherDeductions",
        oldAmount: oldValues.otherDeductions,
        newAmount: newOther,
        notes: "Other deductions updated",
        changeReason: "update_deductions",
      });
    }

    // Always record deductionBreakdown change if provided
    if (deductionBreakdown !== undefined) {
      historyEntries.push({
        actionType: "update",
        changedField: "deductionBreakdown",
        oldValue: JSON.stringify(oldValues.deductionBreakdown || {}),
        newValue: JSON.stringify(normalizedBreakdown),
        notes: "Deduction breakdown updated",
        changeReason: "update_deductions",
      });
    }

    // Record netPay change if it changed
    // @ts-ignore
    if (parseFloat(oldValues.netPay) !== parseFloat(updatedPayment.netPay)) {
      historyEntries.push({
        actionType: "update",
        changedField: "netPay",
        oldAmount: oldValues.netPay,
        newAmount: updatedPayment.netPay,
        notes: "Net pay recalculated after deduction update",
        changeReason: "update_deductions",
      });
    }

    for (const entry of historyEntries) {
      const history = paymentHistoryRepository.create({
        payment: updatedPayment,
        actionType: entry.actionType,
        changedField: entry.changedField,
        oldValue: entry.oldValue !== undefined ? String(entry.oldValue) : undefined,
        newValue: entry.newValue !== undefined ? String(entry.newValue) : undefined,
        oldAmount: entry.oldAmount !== undefined ? entry.oldAmount : undefined,
        newAmount: entry.newAmount !== undefined ? entry.newAmount : undefined,
        notes: entry.notes || null,
        performedBy: String(_userId),
        changeDate: new Date(),
        changeReason: entry.changeReason || "update_deductions",
      });
      await paymentHistoryRepository.save(history);
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "update_payment_deductions",
      description: `Updated deductions for payment #${paymentId}`,
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
      message: "Deductions updated successfully",
      data: {
        payment: updatedPayment,
        summary: {
          grossPay: parseFloat(updatedPayment.grossPay || 0),
          totalDeductions: normalizedBreakdown.totalDeductions,
          netPay: parseFloat(updatedPayment.netPay || 0),
        },
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in updateDeductions:", error);
    // @ts-ignore
    return { status: false, message: `Failed to update deductions: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};