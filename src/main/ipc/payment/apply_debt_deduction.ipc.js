// ipc/payment/apply_debt_deduction.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Debt = require("../../../entities/Debt");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function applyDebtDeduction(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
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
    
    if (!paymentId || !deductionAmount || deductionAmount <= 0) {
      return {
        status: false,
        message: 'Payment ID and valid deduction amount are required',
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const debtRepository = queryRunner.manager.getRepository(Debt);

    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['worker']
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    // If specific debt is provided
    if (debtId) {
      const debt = await debtRepository.findOne({
        where: { id: debtId, worker: { id: payment.worker.id } }
      });

      if (!debt) {
        return {
          status: false,
          message: 'Debt not found for this worker',
          data: null
        };
      }

      // Check if debt has enough balance
      const debtBalance = parseFloat(debt.balance);
      if (deductionAmount > debtBalance) {
        return {
          status: false,
          message: `Deduction amount (${deductionAmount}) exceeds debt balance (${debtBalance})`,
          data: null
        };
      }

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
    }

    // Update payment
    payment.totalDebtDeduction = (parseFloat(payment.totalDebtDeduction) + deductionAmount).toFixed(2);
    payment.netPay = (parseFloat(payment.netPay) - deductionAmount).toFixed(2);
    payment.updatedAt = new Date();

    // Update deduction breakdown
    let breakdown = payment.deductionBreakdown || {};
    breakdown.debtDeductions = (parseFloat(breakdown.debtDeductions || 0) + deductionAmount).toFixed(2);
    breakdown.totalDeductions = (parseFloat(breakdown.totalDeductions || 0) + deductionAmount).toFixed(2);
    payment.deductionBreakdown = breakdown;

    await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment,
      actionType: 'deduction',
      changedField: 'debt_deduction',
      oldAmount: parseFloat(payment.totalDebtDeduction) - deductionAmount,
      newAmount: parseFloat(payment.totalDebtDeduction),
      notes: debtId ? `Applied debt deduction for debt #${debtId}` : 'Applied general debt deduction',
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'apply_debt_deduction',
      description: `Applied ${deductionAmount} debt deduction to payment #${paymentId}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: 'Debt deduction applied successfully',
      data: { payment }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in applyDebtDeduction:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to apply debt deduction: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};