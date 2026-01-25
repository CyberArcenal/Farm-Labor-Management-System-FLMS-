// ipc/payment/bulk_process.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkProcessPayments(params = {}, queryRunner = null) {
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
    const { paymentIds, paymentDate, paymentMethod, _userId } = params;
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return {
        status: false,
        message: 'Payment IDs array is required and cannot be empty',
        data: null
      };
    }

    // Limit batch size for performance
    const MAX_BATCH_SIZE = 50;
    if (paymentIds.length > MAX_BATCH_SIZE) {
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
    // @ts-ignore
    const debtRepository = queryRunner.manager.getRepository(Debt);
    // @ts-ignore
    const debtHistoryRepo = queryRunner.manager.getRepository(DebtHistory);

    const results = {
      success: [],
      failed: [],
      total: paymentIds.length,
      successCount: 0,
      failedCount: 0,
      totalAmount: 0
    };

    // Process each payment
    for (let i = 0; i < paymentIds.length; i++) {
      const paymentId = paymentIds[i];
      
      try {
        // Find the payment with worker details
        const payment = await paymentRepository.findOne({
          where: { id: paymentId },
          relations: ['worker']
        });

        if (!payment) {
          // @ts-ignore
          results.failed.push({
            index: i,
            paymentId,
            error: `Payment not found`
          });
          continue;
        }

        if (payment.status !== 'pending') {
          // @ts-ignore
          results.failed.push({
            index: i,
            paymentId,
            error: `Payment cannot be processed. Current status: ${payment.status}`
          });
          continue;
        }

        // Update payment details
        payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
        payment.paymentMethod = paymentMethod || null;
        payment.status = 'completed';
        payment.updatedAt = new Date();

        // Apply debt deductions if any
        if (payment.totalDebtDeduction > 0) {
          await applyDebtDeductions(payment, queryRunner);
        }

        // Save the updated payment
        const updatedPayment = await paymentRepository.save(payment);

        // Update worker's total paid amount
        const worker = await workerRepository.findOne({
          where: { id: payment.worker.id }
        });

        if (worker) {
          worker.totalPaid = (parseFloat(worker.totalPaid) + parseFloat(payment.netPay)).toFixed(2);
          worker.updatedAt = new Date();
          await workerRepository.save(worker);
        }

        // Create payment history entry
        const paymentHistory = paymentHistoryRepo.create({
          payment: updatedPayment,
          actionType: 'status_change',
          changedField: 'status',
          oldValue: 'pending',
          newValue: 'completed',
          notes: `Payment processed via bulk operation (${paymentMethod || 'unknown method'})`,
          performedBy: _userId,
          changeDate: new Date()
        });

        await paymentHistoryRepo.save(paymentHistory);

        // @ts-ignore
        results.success.push({
          index: i,
          paymentId,
          workerName: payment.worker.name,
          amount: parseFloat(payment.netPay)
        });
        results.successCount++;
        results.totalAmount += parseFloat(payment.netPay);

      } catch (error) {
        // @ts-ignore
        results.failed.push({
          index: i,
          paymentId,
          // @ts-ignore
          error: error.message
        });
        results.failedCount++;
      }
    }

    // Log activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'bulk_process_payments',
      description: `Processed ${results.successCount} payments via bulk operation (${results.failedCount} failed). Total amount: ${results.totalAmount.toFixed(2)}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

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
        averageAmount: results.successCount > 0 ? results.totalAmount / results.successCount : 0,
        errors: results.failed,
        processedPayments: results.success.map(s => ({
          // @ts-ignore
          index: s.index,
          // @ts-ignore
          paymentId: s.paymentId,
          // @ts-ignore
          workerName: s.workerName,
          // @ts-ignore
          amount: s.amount
        }))
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkProcessPayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk process payments: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};

// @ts-ignore
async function applyDebtDeductions(payment, queryRunner) {
  const debtRepository = queryRunner.manager.getRepository(Debt);
  const debtHistoryRepo = queryRunner.manager.getRepository(DebtHistory);
  
  const debts = await debtRepository.find({
    where: { 
      worker: { id: payment.worker.id },
      status: ['pending', 'partially_paid']
    },
    order: { dueDate: 'ASC' }
  });

  let remainingDeduction = payment.totalDebtDeduction;

  for (const debt of debts) {
    if (remainingDeduction <= 0) break;

    const debtBalance = parseFloat(debt.balance);
    if (debtBalance > 0) {
      const deductionAmount = Math.min(remainingDeduction, debtBalance);
      
      // Update debt
      debt.balance = (debtBalance - deductionAmount).toFixed(2);
      debt.totalPaid = (parseFloat(debt.totalPaid) + deductionAmount).toFixed(2);
      debt.lastPaymentDate = new Date();
      
      if (parseFloat(debt.balance) <= 0) {
        debt.status = 'paid';
      } else {
        debt.status = 'partially_paid';
      }
      
      await debtRepository.save(debt);

      // Create debt history entry
      const debtHistory = debtHistoryRepo.create({
        debt,
        amountPaid: deductionAmount,
        previousBalance: debtBalance,
        newBalance: parseFloat(debt.balance),
        transactionType: 'payment',
        paymentMethod: payment.paymentMethod,
        notes: `Paid via bulk processed payment #${payment.id}`,
        transactionDate: new Date()
      });

      await debtHistoryRepo.save(debtHistory);

      remainingDeduction -= deductionAmount;
    }
  }
}