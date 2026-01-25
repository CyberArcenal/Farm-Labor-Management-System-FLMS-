// ipc/payment/bulk_create.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkCreatePayments(params = {}, queryRunner = null) {
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
    const { payments, _userId } = params;
    
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return {
        status: false,
        message: 'Payments array is required and cannot be empty',
        data: null
      };
    }

    // Limit batch size for performance
    const MAX_BATCH_SIZE = 100;
    if (payments.length > MAX_BATCH_SIZE) {
      return {
        status: false,
        message: `Cannot process more than ${MAX_BATCH_SIZE} payments at once`,
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    // @ts-ignore
    const paymentHistoryRepo = queryRunner.manager.getRepository(PaymentHistory);

    const results = {
      success: [],
      failed: [],
      total: payments.length,
      successCount: 0,
      failedCount: 0
    };

    // Validate all payments first
    for (let i = 0; i < payments.length; i++) {
      const paymentData = payments[i];
      
      // Basic validation
      if (!paymentData.workerId || !paymentData.grossPay || paymentData.grossPay <= 0) {
        // @ts-ignore
        results.failed.push({
          index: i,
          error: `Payment ${i + 1}: Worker ID and positive gross pay are required`,
          data: paymentData
        });
        continue;
      }

      // Validate worker exists
      const worker = await workerRepository.findOne({
        where: { id: paymentData.workerId }
      });

      if (!worker) {
        // @ts-ignore
        results.failed.push({
          index: i,
          error: `Payment ${i + 1}: Worker not found (ID: ${paymentData.workerId})`,
          data: paymentData
        });
        continue;
      }

      // Calculate net pay
      const manualDeduction = parseFloat(paymentData.manualDeduction || 0);
      const otherDeductions = parseFloat(paymentData.otherDeductions || 0);
      const netPay = Math.max(0, parseFloat(paymentData.grossPay) - manualDeduction - otherDeductions);

      // Create payment entity
      const payment = paymentRepository.create({
        worker: { id: paymentData.workerId },
        pitak: paymentData.pitakId ? { id: paymentData.pitakId } : null,
        grossPay: paymentData.grossPay,
        manualDeduction: manualDeduction,
        otherDeductions: otherDeductions,
        netPay: netPay,
        periodStart: paymentData.periodStart ? new Date(paymentData.periodStart) : null,
        periodEnd: paymentData.periodEnd ? new Date(paymentData.periodEnd) : null,
        notes: paymentData.notes || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // @ts-ignore
      results.success.push({
        index: i,
        payment: payment,
        workerName: worker.name
      });
    }

    // If all validations failed, return early
    if (results.success.length === 0) {
      return {
        status: false,
        message: 'All payments failed validation',
        data: {
          success: 0,
          failed: results.failed.length,
          errors: results.failed
        }
      };
    }

    // Save all successful payments
    const savedPayments = [];
    for (const result of results.success) {
      try {
        // @ts-ignore
        const savedPayment = await paymentRepository.save(result.payment);
        
        // Create payment history entry
        const paymentHistory = paymentHistoryRepo.create({
          payment: savedPayment,
          actionType: 'create',
          changedField: 'status',
          oldValue: null,
          newValue: 'pending',
          notes: 'Payment created via bulk operation',
          performedBy: _userId,
          changeDate: new Date()
        });
        
        await paymentHistoryRepo.save(paymentHistory);
        savedPayments.push(savedPayment);
        results.successCount++;
      } catch (error) {
        // @ts-ignore
        results.failed.push({
          // @ts-ignore
          index: result.index,
          // @ts-ignore
          error: `Failed to save payment: ${error.message}`,
          // @ts-ignore
          data: result.payment
        });
        results.failedCount++;
      }
    }

    // Log activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'bulk_create_payments',
      description: `Created ${results.successCount} payments via bulk operation (${results.failedCount} failed)`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      if (results.failedCount === 0) {
        // @ts-ignore
        await queryRunner.commitTransaction();
      } else {
        // Partial success - still commit if we have some successes
        // @ts-ignore
        await queryRunner.commitTransaction();
      }
    }

    return {
      status: true,
      message: `Bulk payment creation completed: ${results.successCount} successful, ${results.failedCount} failed`,
      data: {
        success: results.successCount,
        failed: results.failedCount,
        errors: results.failed,
        createdPayments: savedPayments.map(p => ({
          id: p.id,
          workerId: p.worker.id,
          grossPay: parseFloat(p.grossPay),
          netPay: parseFloat(p.netPay),
          status: p.status
        }))
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkCreatePayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk create payments: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};