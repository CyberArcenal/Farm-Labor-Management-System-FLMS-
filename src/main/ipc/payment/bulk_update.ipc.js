// ipc/payment/bulk_update.ipc.js
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
      return {
        status: false,
        message: 'Updates array is required and cannot be empty',
        data: null
      };
    }

    // Limit batch size for performance
    const MAX_BATCH_SIZE = 100;
    if (updates.length > MAX_BATCH_SIZE) {
      return {
        status: false,
        message: `Cannot process more than ${MAX_BATCH_SIZE} updates at once`,
        data: null
      };
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
      failedCount: 0
    };

    // Process each update
    for (let i = 0; i < updates.length; i++) {
      const updateData = updates[i];
      
      if (!updateData.paymentId) {
        // @ts-ignore
        results.failed.push({
          index: i,
          error: `Update ${i + 1}: Payment ID is required`,
          data: updateData
        });
        continue;
      }

      try {
        // Find the payment
        const payment = await paymentRepository.findOne({
          where: { id: updateData.paymentId }
        });

        if (!payment) {
          // @ts-ignore
          results.failed.push({
            index: i,
            error: `Update ${i + 1}: Payment not found (ID: ${updateData.paymentId})`,
            data: updateData
          });
          continue;
        }

        // Store old values for history
        const oldValues = {
          grossPay: payment.grossPay,
          manualDeduction: payment.manualDeduction,
          otherDeductions: payment.otherDeductions,
          notes: payment.notes,
          status: payment.status
        };

        // Update fields if provided
        let needsRecalculation = false;

        if (updateData.grossPay !== undefined) {
          payment.grossPay = updateData.grossPay;
          needsRecalculation = true;
        }

        if (updateData.manualDeduction !== undefined) {
          payment.manualDeduction = updateData.manualDeduction;
          needsRecalculation = true;
        }

        if (updateData.otherDeductions !== undefined) {
          payment.otherDeductions = updateData.otherDeductions;
          needsRecalculation = true;
        }

        if (updateData.notes !== undefined) {
          payment.notes = updateData.notes;
        }

        if (updateData.status !== undefined) {
          // Validate status transition
          const validTransitions = {
            'pending': ['processing', 'cancelled'],
            'processing': ['completed', 'cancelled'],
            'completed': ['cancelled'],
            'cancelled': []
          };

          if (payment.status === updateData.status) {
            // Same status, no change needed
          // @ts-ignore
          } else if (!validTransitions[payment.status]?.includes(updateData.status)) {
            // @ts-ignore
            results.failed.push({
              index: i,
              error: `Update ${i + 1}: Cannot change status from ${payment.status} to ${updateData.status}`,
              data: updateData
            });
            continue;
          } else {
            payment.status = updateData.status;
          }
        }

        // Recalculate net pay if needed
        if (needsRecalculation) {
          payment.netPay = (
            parseFloat(payment.grossPay) - 
            parseFloat(payment.totalDebtDeduction) - 
            parseFloat(payment.manualDeduction || 0) - 
            parseFloat(payment.otherDeductions || 0)
          ).toFixed(2);
        }

        payment.updatedAt = new Date();

        // Save the updated payment
        const updatedPayment = await paymentRepository.save(payment);

        // Create payment history entry
        const historyEntries = [];

        if (updateData.grossPay !== undefined && parseFloat(oldValues.grossPay) !== parseFloat(updateData.grossPay)) {
          historyEntries.push({
            actionType: 'update',
            changedField: 'grossPay',
            oldAmount: parseFloat(oldValues.grossPay),
            newAmount: parseFloat(updateData.grossPay),
            notes: 'Gross pay updated via bulk operation'
          });
        }

        if (updateData.manualDeduction !== undefined && 
            parseFloat(oldValues.manualDeduction || 0) !== parseFloat(updateData.manualDeduction || 0)) {
          historyEntries.push({
            actionType: 'update',
            changedField: 'manualDeduction',
            oldAmount: parseFloat(oldValues.manualDeduction || 0),
            newAmount: parseFloat(updateData.manualDeduction || 0),
            notes: 'Manual deduction updated via bulk operation'
          });
        }

        if (updateData.otherDeductions !== undefined && 
            parseFloat(oldValues.otherDeductions || 0) !== parseFloat(updateData.otherDeductions || 0)) {
          historyEntries.push({
            actionType: 'update',
            changedField: 'otherDeductions',
            oldAmount: parseFloat(oldValues.otherDeductions || 0),
            newAmount: parseFloat(updateData.otherDeductions || 0),
            notes: 'Other deductions updated via bulk operation'
          });
        }

        if (updateData.status !== undefined && oldValues.status !== updateData.status) {
          historyEntries.push({
            actionType: 'status_change',
            changedField: 'status',
            oldValue: oldValues.status,
            newValue: updateData.status,
            notes: 'Status changed via bulk operation'
          });
        }

        // Save all history entries
        for (const entry of historyEntries) {
          const paymentHistory = paymentHistoryRepo.create({
            payment: updatedPayment,
            ...entry,
            performedBy: _userId,
            changeDate: new Date()
          });
          await paymentHistoryRepo.save(paymentHistory);
        }

        // @ts-ignore
        results.success.push({
          index: i,
          paymentId: updatedPayment.id,
          changes: historyEntries.length
        });
        results.successCount++;

      } catch (error) {
        // @ts-ignore
        results.failed.push({
          index: i,
          // @ts-ignore
          error: `Update ${i + 1}: ${error.message}`,
          data: updateData
        });
        results.failedCount++;
      }
    }

    // Log activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'bulk_update_payments',
      description: `Updated ${results.successCount} payments via bulk operation (${results.failedCount} failed)`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      if (results.failedCount === 0 || results.successCount > 0) {
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
        updatedPayments: results.success.map(s => ({
          // @ts-ignore
          index: s.index,
          // @ts-ignore
          paymentId: s.paymentId,
          // @ts-ignore
          changes: s.changes
        }))
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkUpdatePayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk update payments: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};