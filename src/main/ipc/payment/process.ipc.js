// ipc/payment/process.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function processPayment(params = {}, queryRunner = null) {
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
    const { 
      // @ts-ignore
      paymentId, 
      // @ts-ignore
      paymentDate, 
      // @ts-ignore
      paymentMethod, 
      // @ts-ignore
      referenceNumber,
      // @ts-ignore
      _userId 
    } = params;
    
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

    if (payment.status !== 'pending') {
      return {
        status: false,
        message: `Payment cannot be processed. Current status: ${payment.status}`,
        data: null
      };
    }

    // Update payment details
    payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    payment.paymentMethod = paymentMethod || null;
    payment.referenceNumber = referenceNumber || null;
    payment.status = 'completed';
    payment.updatedAt = new Date();

    // If there are debt deductions, apply them
    if (payment.totalDebtDeduction > 0) {
      await applyDebtDeductions(payment, queryRunner);
    }

    const updatedPayment = await paymentRepository.save(payment);

    // Update worker's total paid amount
    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    const worker = await workerRepository.findOne({
      where: { id: payment.worker.id }
    });

    if (worker) {
      worker.totalPaid = (parseFloat(worker.totalPaid) + parseFloat(payment.netPay)).toFixed(2);
      worker.updatedAt = new Date();
      await workerRepository.save(worker);
    }

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: 'status_change',
      changedField: 'status',
      oldValue: 'pending',
      newValue: 'completed',
      notes: `Payment processed via ${paymentMethod || 'unknown method'}`,
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'process_payment',
      description: `Processed payment #${paymentId} for ${payment.worker.name}`,
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
      message: 'Payment processed successfully',
      data: { payment: updatedPayment }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in processPayment:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to process payment: ${error.message}`,
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
      const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
      const debtHistory = debtHistoryRepository.create({
        debt,
        amountPaid: deductionAmount,
        previousBalance: debtBalance,
        newBalance: parseFloat(debt.balance),
        transactionType: 'payment',
        paymentMethod: payment.paymentMethod,
        notes: `Paid via payment #${payment.id}`,
        transactionDate: new Date()
      });

      await debtHistoryRepository.save(debtHistory);

      remainingDeduction -= deductionAmount;
    }
  }
}