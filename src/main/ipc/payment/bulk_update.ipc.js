// src/ipc/payment/bulk_update.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkUpdatePayments(params = {}, queryRunner = null) {
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
    const { updates, _userId } = params;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return { status: false, message: "Updates array is required and cannot be empty", data: null };
    }

    if (!_userId) {
      return { status: false, message: "User ID is required for audit trail", data: null };
    }

    const MAX_BATCH_SIZE = 100;
    if (updates.length > MAX_BATCH_SIZE) {
      return { status: false, message: `Cannot process more than ${MAX_BATCH_SIZE} updates at once`, data: null };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    // @ts-ignore
    const paymentHistoryRepo = queryRunner.manager.getRepository(PaymentHistory);

    const results = {
      success: [],
      failed: [],
      total: updates.length,
      successCount: 0,
      failedCount: 0,
    };

    // Allowed status transitions map
    const validTransitions = {
      pending: ["processing", "cancelled"],
      processing: ["completed", "cancelled"],
      completed: ["cancelled"],
      cancelled: [],
    };

    for (let i = 0; i < updates.length; i++) {
      const updateData = updates[i];

      if (!updateData.paymentId) {
        // @ts-ignore
        results.failed.push({ index: i, error: `Update ${i + 1}: Payment ID is required`, data: updateData });
        continue;
      }

      try {
        // Load payment with worker to allow worker aggregate adjustments
        const payment = await paymentRepository.findOne({
          where: { id: updateData.paymentId },
          relations: ["worker"],
        });

        if (!payment) {
          // @ts-ignore
          results.failed.push({ index: i, error: `Update ${i + 1}: Payment not found (ID: ${updateData.paymentId})`, data: updateData });
          continue;
        }

        // Prevent updates on cancelled payments
        if (payment.status === "cancelled") {
          // @ts-ignore
          results.failed.push({ index: i, error: `Update ${i + 1}: Cannot update cancelled payment (ID: ${updateData.paymentId})`, data: updateData });
          continue;
        }

        // Store old numeric values and old netPay for worker adjustments
        const oldValues = {
          grossPay: parseFloat(payment.grossPay || 0),
          manualDeduction: parseFloat(payment.manualDeduction || 0),
          otherDeductions: parseFloat(payment.otherDeductions || 0),
          totalDebtDeduction: parseFloat(payment.totalDebtDeduction || 0),
          netPay: parseFloat(payment.netPay || 0),
          notes: payment.notes,
          status: payment.status,
        };

        // Track changes for history
        const historyEntries = [];

        // Apply updates
        let needsRecalc = false;

        if (updateData.grossPay !== undefined) {
          const newGross = parseFloat(updateData.grossPay);
          if (isNaN(newGross) || newGross < 0) {
            // @ts-ignore
            results.failed.push({ index: i, error: `Update ${i + 1}: Invalid grossPay`, data: updateData });
            continue;
          }
          if (newGross !== oldValues.grossPay) {
            historyEntries.push({
              actionType: "update",
              changedField: "grossPay",
              oldAmount: oldValues.grossPay,
              newAmount: newGross,
              notes: "Gross pay updated via bulk operation",
              changeReason: "bulk_update",
            });
            payment.grossPay = newGross;
            needsRecalc = true;
          }
        }

        if (updateData.manualDeduction !== undefined) {
          const newManual = parseFloat(updateData.manualDeduction || 0);
          if (isNaN(newManual) || newManual < 0) {
            // @ts-ignore
            results.failed.push({ index: i, error: `Update ${i + 1}: Invalid manualDeduction`, data: updateData });
            continue;
          }
          if (newManual !== oldValues.manualDeduction) {
            historyEntries.push({
              actionType: "update",
              changedField: "manualDeduction",
              oldAmount: oldValues.manualDeduction,
              newAmount: newManual,
              notes: "Manual deduction updated via bulk operation",
              changeReason: "bulk_update",
            });
            payment.manualDeduction = newManual;
            needsRecalc = true;
          }
        }

        if (updateData.otherDeductions !== undefined) {
          const newOther = parseFloat(updateData.otherDeductions || 0);
          if (isNaN(newOther) || newOther < 0) {
            // @ts-ignore
            results.failed.push({ index: i, error: `Update ${i + 1}: Invalid otherDeductions`, data: updateData });
            continue;
          }
          if (newOther !== oldValues.otherDeductions) {
            historyEntries.push({
              actionType: "update",
              changedField: "otherDeductions",
              oldAmount: oldValues.otherDeductions,
              newAmount: newOther,
              notes: "Other deductions updated via bulk operation",
              changeReason: "bulk_update",
            });
            payment.otherDeductions = newOther;
            needsRecalc = true;
          }
        }

        if (updateData.notes !== undefined) {
          const timestamp = new Date().toISOString();
          const appended = payment.notes ? `${payment.notes}\n[${timestamp}] ${updateData.notes}` : `[${timestamp}] ${updateData.notes}`;
          historyEntries.push({
            actionType: "update",
            changedField: "notes",
            oldValue: payment.notes || null,
            newValue: appended,
            notes: "Notes updated via bulk operation",
            changeReason: "bulk_update",
          });
          payment.notes = appended;
        }

        if (updateData.status !== undefined) {
          const newStatus = updateData.status;
          if (payment.status !== newStatus) {
            // @ts-ignore
            if (!validTransitions[payment.status]?.includes(newStatus)) {
              // @ts-ignore
              results.failed.push({ index: i, error: `Update ${i + 1}: Cannot change status from ${payment.status} to ${newStatus}`, data: updateData });
              continue;
            }
            historyEntries.push({
              actionType: "status_change",
              changedField: "status",
              oldValue: payment.status,
              newValue: newStatus,
              notes: "Status changed via bulk operation",
              changeReason: "bulk_update",
            });
            payment.status = newStatus;
          }
        }

        // Recalculate netPay if needed
        if (needsRecalc) {
          const gross = parseFloat(payment.grossPay || 0);
          const totalDebtDeduction = parseFloat(payment.totalDebtDeduction || 0);
          const manual = parseFloat(payment.manualDeduction || 0);
          const other = parseFloat(payment.otherDeductions || 0);

          const recalculated = parseFloat((gross - totalDebtDeduction - manual - other).toFixed(2));
          if (recalculated < 0) {
            // @ts-ignore
            results.failed.push({ index: i, error: `Update ${i + 1}: Recalculated netPay would be negative`, data: updateData });
            continue;
          }

          if (recalculated !== oldValues.netPay) {
            historyEntries.push({
              actionType: "update",
              changedField: "netPay",
              oldAmount: oldValues.netPay,
              newAmount: recalculated,
              notes: "Net pay recalculated via bulk operation",
              changeReason: "bulk_update",
            });
            payment.netPay = recalculated;
          }
        }

        payment.updatedAt = new Date();

        // Save updated payment
        const updatedPayment = await paymentRepository.save(payment);

        // If netPay changed, adjust worker aggregates
        const newNet = parseFloat(updatedPayment.netPay || 0);
        const oldNet = oldValues.netPay;
        const netDelta = parseFloat((newNet - oldNet).toFixed(2));

        if (netDelta !== 0 && updatedPayment.worker && updatedPayment.worker.id) {
          // Update worker totals safely
          // @ts-ignore
          const workerRepo = queryRunner.manager.getRepository("Worker");
          const worker = await workerRepo.findOne({ where: { id: updatedPayment.worker.id } });
          if (worker) {
            // totalPaid increases by netDelta; currentBalance decreases by netDelta
            worker.totalPaid = parseFloat((parseFloat(worker.totalPaid || 0) + netDelta).toFixed(2));
            worker.currentBalance = parseFloat(Math.max(0, parseFloat(worker.currentBalance || 0) - netDelta).toFixed(2));
            worker.updatedAt = new Date();
            await workerRepo.save(worker);
          }
        }

        // Persist history entries with performedBy and changeReason
        for (const entry of historyEntries) {
          const paymentHistory = paymentHistoryRepo.create({
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
            changeReason: entry.changeReason || "bulk_update",
          });
          await paymentHistoryRepo.save(paymentHistory);
        }

        // @ts-ignore
        results.success.push({ index: i, paymentId: updatedPayment.id, changes: historyEntries.length });
        results.successCount++;
      } catch (error) {
        // @ts-ignore
        results.failed.push({ index: i, error: `Update ${i + 1}: ${error.message}`, data: updateData });
        results.failedCount++;
      }
    }

    // Log activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: "bulk_update_payments",
      description: `Updated ${results.successCount} payments via bulk operation (${results.failedCount} failed)`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // Commit if at least one success; otherwise rollback
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
      message: `Bulk payment update completed: ${results.successCount} successful, ${results.failedCount} failed`,
      data: {
        success: results.successCount,
        failed: results.failedCount,
        errors: results.failed,
        // @ts-ignore
        updatedPayments: results.success.map((s) => ({ index: s.index, paymentId: s.paymentId, changes: s.changes })),
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in bulkUpdatePayments:", error);
    // @ts-ignore
    return { status: false, message: `Failed to bulk update payments: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};