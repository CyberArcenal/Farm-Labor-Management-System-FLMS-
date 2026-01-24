// ipc/payment/link_debt_payment.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const DebtHistory = require("../../../entities/DebtHistory");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function linkDebtPayment(params = {}, queryRunner = null) {
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
    const { paymentId, debtHistoryId, _userId } = params;
    
    if (!paymentId || !debtHistoryId) {
      return {
        status: false,
        message: 'Payment ID and Debt History ID are required',
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);

    const payment = await paymentRepository.findOne({
      where: { id: paymentId }
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    const debtHistory = await debtHistoryRepository.findOne({
      where: { id: debtHistoryId },
      relations: ['debt']
    });

    if (!debtHistory) {
      return {
        status: false,
        message: 'Debt history record not found',
        data: null
      };
    }

    // Check if already linked
    if (debtHistory.payment && debtHistory.payment.id === paymentId) {
      return {
        status: false,
        message: 'Debt payment is already linked to this payment',
        data: null
      };
    }

    // Check if debt payment is from the same worker
    if (debtHistory.debt.worker.id !== payment.worker.id) {
      return {
        status: false,
        message: 'Debt payment and payment must be for the same worker',
        data: null
      };
    }

    // Link debt payment to payment
    const oldPaymentLink = debtHistory.payment;
    debtHistory.payment = payment;
    
    // Update payment's debt deduction total
    payment.totalDebtDeduction = (
      parseFloat(payment.totalDebtDeduction) + 
      parseFloat(debtHistory.amountPaid)
    ).toFixed(2);
    
    // Recalculate net pay
    payment.netPay = (
      parseFloat(payment.grossPay) - 
      parseFloat(payment.totalDebtDeduction) - 
      parseFloat(payment.manualDeduction || 0) - 
      parseFloat(payment.otherDeductions || 0)
    ).toFixed(2);
    
    payment.updatedAt = new Date();

    await debtHistoryRepository.save(debtHistory);
    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: 'update',
      changedField: 'debt_payment_link',
      oldValue: oldPaymentLink ? `Payment #${oldPaymentLink.id}` : 'None',
      newValue: `Debt History #${debtHistoryId}`,
      oldAmount: parseFloat(payment.totalDebtDeduction) - parseFloat(debtHistory.amountPaid),
      newAmount: parseFloat(payment.totalDebtDeduction),
      notes: `Linked debt payment #${debtHistoryId} (₱${debtHistory.amountPaid}) for debt #${debtHistory.debt.id}`,
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'link_debt_payment',
      description: `Linked debt payment #${debtHistoryId} to payment #${paymentId}`,
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
      message: 'Debt payment linked successfully',
      data: { 
        payment: updatedPayment,
        debtHistory,
        summary: {
          debtAmount: parseFloat(debtHistory.amountPaid),
          totalDebtDeductions: parseFloat(payment.totalDebtDeduction),
          newNetPay: parseFloat(payment.netPay)
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in linkDebtPayment:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to link debt payment: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};