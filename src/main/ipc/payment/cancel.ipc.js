// ipc/payment/cancel.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function cancelPayment(params = {}, queryRunner = null) {
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
    const { paymentId, reason, _userId } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['worker', 'debtPayments']
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    if (payment.status === 'cancelled') {
      return {
        status: false,
        message: 'Payment is already cancelled',
        data: null
      };
    }

    if (payment.status === 'completed') {
      // For completed payments, we may need to reverse debt payments
      await reverseDebtPayments(payment, queryRunner);
    }

    const oldStatus = payment.status;
    payment.status = 'cancelled';
    payment.notes = payment.notes 
      ? `${payment.notes}\nCANCELLED: ${reason || 'No reason provided'}` 
      : `CANCELLED: ${reason || 'No reason provided'}`;
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: 'status_change',
      changedField: 'status',
      oldValue: oldStatus,
      newValue: 'cancelled',
      notes: `Payment cancelled: ${reason || 'No reason provided'}`,
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'cancel_payment',
      description: `Cancelled payment #${paymentId} (was ${oldStatus})`,
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
      message: 'Payment cancelled successfully',
      data: { payment: updatedPayment }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in cancelPayment:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to cancel payment: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};

/**
 * @param {{ debtPayments: string | any[]; id: any; }} payment
 * @param {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; originalAmount: unknown; amount: unknown; reason: unknown; balance: unknown; status: unknown; dateIncurred: unknown; dueDate: unknown; paymentTerm: unknown; interestRate: unknown; totalInterest: unknown; totalPaid: unknown; lastPaymentDate: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; amountPaid: unknown; previousBalance: unknown; newBalance: unknown; transactionType: unknown; paymentMethod: unknown; referenceNumber: unknown; notes: unknown; transactionDate: unknown; createdAt: unknown; }>) => any; }; } | null} queryRunner
 */
async function reverseDebtPayments(payment, queryRunner) {
  if (!payment.debtPayments || payment.debtPayments.length === 0) {
    return;
  }

  // @ts-ignore
  const debtRepository = queryRunner.manager.getRepository(require("../../../entities/Debt"));
  
  for (const debtPayment of payment.debtPayments) {
    const debt = await debtRepository.findOne({
      where: { id: debtPayment.debt.id }
    });

    if (debt) {
      // Reverse the payment
      debt.balance = (parseFloat(debt.balance) + parseFloat(debtPayment.amountPaid)).toFixed(2);
      debt.totalPaid = (parseFloat(debt.totalPaid) - parseFloat(debtPayment.amountPaid)).toFixed(2);
      
      // Update status based on new balance
      if (parseFloat(debt.balance) > 0) {
        debt.status = parseFloat(debt.totalPaid) > 0 ? 'partially_paid' : 'pending';
      }
      
      await debtRepository.save(debt);

      // Create reversal debt history entry
      // @ts-ignore
      const debtHistoryRepository = queryRunner.manager.getRepository(require("../../../entities/DebtHistory"));
      const reversalHistory = debtHistoryRepository.create({
        debt,
        amountPaid: parseFloat(debtPayment.amountPaid),
        previousBalance: parseFloat(debt.balance) - parseFloat(debtPayment.amountPaid),
        newBalance: parseFloat(debt.balance),
        transactionType: 'refund',
        notes: `Payment reversal from cancelled payment #${payment.id}`,
        transactionDate: new Date()
      });

      await debtHistoryRepository.save(reversalHistory);
    }
  }
}