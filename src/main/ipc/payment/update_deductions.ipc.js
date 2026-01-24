// ipc/payment/update_deductions.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateDeductions(params = {}, queryRunner = null) {
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
      manualDeduction,
      // @ts-ignore
      otherDeductions,
      // @ts-ignore
      deductionBreakdown,
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

    // Store old values
    const oldValues = {
      manualDeduction: payment.manualDeduction,
      otherDeductions: payment.otherDeductions,
      deductionBreakdown: payment.deductionBreakdown,
      netPay: payment.netPay
    };

    // Update deductions
    let totalDeductions = parseFloat(payment.totalDebtDeduction);

    if (manualDeduction !== undefined) {
      payment.manualDeduction = manualDeduction;
      totalDeductions += parseFloat(manualDeduction || 0);
    } else {
      totalDeductions += parseFloat(payment.manualDeduction || 0);
    }

    if (otherDeductions !== undefined) {
      payment.otherDeductions = otherDeductions;
      totalDeductions += parseFloat(otherDeductions || 0);
    } else {
      totalDeductions += parseFloat(payment.otherDeductions || 0);
    }

    if (deductionBreakdown !== undefined) {
      payment.deductionBreakdown = deductionBreakdown;
    }

    // Recalculate net pay
    payment.netPay = Math.max(0, parseFloat(payment.grossPay) - totalDeductions).toFixed(2);
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const historyEntries = [];

    if (manualDeduction !== undefined && parseFloat(oldValues.manualDeduction || 0) !== parseFloat(manualDeduction || 0)) {
      historyEntries.push({
        actionType: 'update',
        changedField: 'manualDeduction',
        oldAmount: parseFloat(oldValues.manualDeduction || 0),
        newAmount: parseFloat(manualDeduction || 0),
        notes: 'Manual deduction updated'
      });
    }

    if (otherDeductions !== undefined && parseFloat(oldValues.otherDeductions || 0) !== parseFloat(otherDeductions || 0)) {
      historyEntries.push({
        actionType: 'update',
        changedField: 'otherDeductions',
        oldAmount: parseFloat(oldValues.otherDeductions || 0),
        newAmount: parseFloat(otherDeductions || 0),
        notes: 'Other deductions updated'
      });
    }

    // Save history entries
    for (const entry of historyEntries) {
      const history = paymentHistoryRepository.create({
        payment: updatedPayment,
        ...entry,
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
      action: 'update_payment_deductions',
      description: `Updated deductions for payment #${paymentId}`,
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
      message: 'Deductions updated successfully',
      data: { 
        payment: updatedPayment,
        summary: {
          grossPay: parseFloat(updatedPayment.grossPay),
          totalDeductions: totalDeductions,
          netPay: parseFloat(updatedPayment.netPay)
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateDeductions:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update deductions: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};