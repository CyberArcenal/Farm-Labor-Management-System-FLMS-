// ipc/payment/update.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updatePayment(params = {}, queryRunner = null) {
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
      where: { id: paymentId }
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    // Store old values for history
    const oldValues = {
      grossPay: payment.grossPay,
      manualDeduction: payment.manualDeduction,
      otherDeductions: payment.otherDeductions,
      notes: payment.notes,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd
    };

    // Update fields if provided
    if (grossPay !== undefined) {
      payment.grossPay = grossPay;
      // Recalculate net pay
      payment.netPay = (
        parseFloat(grossPay) - 
        parseFloat(payment.totalDebtDeduction) - 
        parseFloat(payment.manualDeduction || 0) - 
        parseFloat(payment.otherDeductions || 0)
      ).toFixed(2);
    }

    if (manualDeduction !== undefined) {
      payment.manualDeduction = manualDeduction;
      payment.netPay = (
        parseFloat(payment.grossPay) - 
        parseFloat(payment.totalDebtDeduction) - 
        parseFloat(manualDeduction) - 
        parseFloat(payment.otherDeductions || 0)
      ).toFixed(2);
    }

    if (otherDeductions !== undefined) {
      payment.otherDeductions = otherDeductions;
      payment.netPay = (
        parseFloat(payment.grossPay) - 
        parseFloat(payment.totalDebtDeduction) - 
        parseFloat(payment.manualDeduction || 0) - 
        parseFloat(otherDeductions)
      ).toFixed(2);
    }

    if (notes !== undefined) {
      payment.notes = notes;
    }

    if (periodStart !== undefined) {
      payment.periodStart = periodStart ? new Date(periodStart) : null;
    }

    if (periodEnd !== undefined) {
      payment.periodEnd = periodEnd ? new Date(periodEnd) : null;
    }

    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry for each changed field
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    
    const changes = [];
    if (grossPay !== undefined && parseFloat(oldValues.grossPay) !== parseFloat(grossPay)) {
      changes.push({
        actionType: 'update',
        changedField: 'grossPay',
        oldAmount: parseFloat(oldValues.grossPay),
        newAmount: parseFloat(grossPay),
        notes: 'Gross pay updated'
      });
    }

    if (manualDeduction !== undefined && parseFloat(oldValues.manualDeduction || 0) !== parseFloat(manualDeduction || 0)) {
      changes.push({
        actionType: 'update',
        changedField: 'manualDeduction',
        oldAmount: parseFloat(oldValues.manualDeduction || 0),
        newAmount: parseFloat(manualDeduction || 0),
        notes: 'Manual deduction updated'
      });
    }

    if (otherDeductions !== undefined && parseFloat(oldValues.otherDeductions || 0) !== parseFloat(otherDeductions || 0)) {
      changes.push({
        actionType: 'update',
        changedField: 'otherDeductions',
        oldAmount: parseFloat(oldValues.otherDeductions || 0),
        newAmount: parseFloat(otherDeductions || 0),
        notes: 'Other deductions updated'
      });
    }

    // Save all history entries
    for (const change of changes) {
      const history = paymentHistoryRepository.create({
        payment: updatedPayment,
        ...change,
        performedBy: _userId,
        changeDate: new Date()
      });
      await paymentHistoryRepository.save(history);
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_payment',
      description: `Updated payment #${paymentId}`,
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
      message: 'Payment updated successfully',
      data: { payment: updatedPayment }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updatePayment:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update payment: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};