// src/ipc/payment/update.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updatePayment(params = {}, queryRunner = null) {
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
      grossPay,
      // @ts-ignore
      manualDeduction,
      // @ts-ignore
      otherDeductions,
      // @ts-ignore
      notes,
      // @ts-ignore
      periodStart,
      // @ts-ignore
      periodEnd,
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
      relations: ["worker"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // If payment is completed, only allow notes update (policy)
    const isCompleted = payment.status === "completed";
    if (isCompleted && (grossPay !== undefined || manualDeduction !== undefined || otherDeductions !== undefined || periodStart !== undefined || periodEnd !== undefined)) {
      return {
        status: false,
        message: "Only notes can be updated for completed payments. To change amounts, use a reversal/refund workflow.",
        data: null,
      };
    }

    // Store old values for history and worker adjustments
    const oldValues = {
      grossPay: parseFloat(payment.grossPay || 0),
      manualDeduction: parseFloat(payment.manualDeduction || 0),
      otherDeductions: parseFloat(payment.otherDeductions || 0),
      totalDebtDeduction: parseFloat(payment.totalDebtDeduction || 0),
      netPay: parseFloat(payment.netPay || 0),
      notes: payment.notes,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
    };

    const historyEntries = [];
    let needsRecalc = false;

    // Apply updates (only allowed fields for non-completed payments)
    if (grossPay !== undefined) {
      const newGross = parseFloat(grossPay);
      if (isNaN(newGross) || newGross < 0) {
        return { status: false, message: "grossPay must be a non-negative number", data: null };
      }
      if (newGross !== oldValues.grossPay) {
        historyEntries.push({
          actionType: "update",
          changedField: "grossPay",
          oldAmount: oldValues.grossPay,
          newAmount: newGross,
          notes: "Gross pay updated",
          changeReason: "update_payment",
        });
        payment.grossPay = newGross;
        needsRecalc = true;
      }
    }

    if (manualDeduction !== undefined) {
      const newManual = parseFloat(manualDeduction || 0);
      if (isNaN(newManual) || newManual < 0) {
        return { status: false, message: "manualDeduction must be a non-negative number", data: null };
      }
      if (newManual !== oldValues.manualDeduction) {
        historyEntries.push({
          actionType: "update",
          changedField: "manualDeduction",
          oldAmount: oldValues.manualDeduction,
          newAmount: newManual,
          notes: "Manual deduction updated",
          changeReason: "update_payment",
        });
        payment.manualDeduction = newManual;
        needsRecalc = true;
      }
    }

    if (otherDeductions !== undefined) {
      const newOther = parseFloat(otherDeductions || 0);
      if (isNaN(newOther) || newOther < 0) {
        return { status: false, message: "otherDeductions must be a non-negative number", data: null };
      }
      if (newOther !== oldValues.otherDeductions) {
        historyEntries.push({
          actionType: "update",
          changedField: "otherDeductions",
          oldAmount: oldValues.otherDeductions,
          newAmount: newOther,
          notes: "Other deductions updated",
          changeReason: "update_payment",
        });
        payment.otherDeductions = newOther;
        needsRecalc = true;
      }
    }

    if (notes !== undefined) {
      const timestamp = new Date().toISOString();
      const appended = payment.notes ? `${payment.notes}\n[${timestamp}] ${notes}` : `[${timestamp}] ${notes}`;
      historyEntries.push({
        actionType: "update",
        changedField: "notes",
        oldValue: payment.notes || null,
        newValue: appended,
        notes: "Notes updated",
        changeReason: "update_payment",
      });
      payment.notes = appended;
    }

    if (periodStart !== undefined) {
      const newStart = periodStart ? new Date(periodStart) : null;
      historyEntries.push({
        actionType: "update",
        changedField: "periodStart",
        oldValue: payment.periodStart ? payment.periodStart.toISOString() : null,
        newValue: newStart ? newStart.toISOString() : null,
        notes: "Period start updated",
        changeReason: "update_payment",
      });
      payment.periodStart = newStart;
    }

    if (periodEnd !== undefined) {
      const newEnd = periodEnd ? new Date(periodEnd) : null;
      historyEntries.push({
        actionType: "update",
        changedField: "periodEnd",
        oldValue: payment.periodEnd ? payment.periodEnd.toISOString() : null,
        newValue: newEnd ? newEnd.toISOString() : null,
        notes: "Period end updated",
        changeReason: "update_payment",
      });
      payment.periodEnd = newEnd;
    }

    // Recalculate netPay if needed
    if (needsRecalc) {
      const gross = parseFloat(payment.grossPay || 0);
      const totalDebt = parseFloat(payment.totalDebtDeduction || 0);
      const manual = parseFloat(payment.manualDeduction || 0);
      const other = parseFloat(payment.otherDeductions || 0);

      const recalculated = parseFloat((gross - totalDebt - manual - other).toFixed(2));
      if (recalculated < 0) {
        return { status: false, message: "Recalculated netPay would be negative", data: null };
      }

      if (recalculated !== oldValues.netPay) {
        historyEntries.push({
          actionType: "update",
          changedField: "netPay",
          oldAmount: oldValues.netPay,
          newAmount: recalculated,
          notes: "Net pay recalculated",
          changeReason: "update_payment",
        });
        payment.netPay = recalculated;
      }
    }

    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // If payment is completed and netPay changed, adjust worker aggregates
    if (isCompleted) {
      const newNet = parseFloat(updatedPayment.netPay || 0);
      const oldNet = oldValues.netPay;
      const netDelta = parseFloat((newNet - oldNet).toFixed(2));

      if (netDelta !== 0 && updatedPayment.worker && updatedPayment.worker.id) {
        // @ts-ignore
        const workerRepo = queryRunner.manager.getRepository("Worker");
        const worker = await workerRepo.findOne({ where: { id: updatedPayment.worker.id } });
        if (worker) {
          // Adjust totals: totalPaid increases by netDelta; currentBalance decreases by netDelta
          worker.totalPaid = parseFloat((parseFloat(worker.totalPaid || 0) + netDelta).toFixed(2));
          worker.currentBalance = parseFloat(Math.max(0, parseFloat(worker.currentBalance || 0) - netDelta).toFixed(2));
          worker.updatedAt = new Date();
          await workerRepo.save(worker);

          // Record worker aggregate adjustment in payment history
          historyEntries.push({
            actionType: "adjustment",
            changedField: "worker_totals",
            oldAmount: null,
            newAmount: null,
            notes: `Adjusted worker totals by ${netDelta.toFixed(2)} due to payment update`,
            changeReason: "update_payment_worker_adjustment",
          });
        }
      }
    }

    // Persist history entries
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
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
        changeReason: entry.changeReason || "update_payment",
      });
      await paymentHistoryRepository.save(history);
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "update_payment",
      description: `Updated payment #${paymentId}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return { status: true, message: "Payment updated successfully", data: { payment: updatedPayment } };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in updatePayment:", error);
    // @ts-ignore
    return { status: false, message: `Failed to update payment: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};