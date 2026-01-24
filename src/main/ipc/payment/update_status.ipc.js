// ipc/payment/update_status.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updatePaymentStatus(params = {}, queryRunner = null) {
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
    const { paymentId, status, notes, _userId } = params;
    
    if (!paymentId || !status) {
      return {
        status: false,
        message: 'Payment ID and status are required',
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
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

    // Validate status transition
    const validTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['completed', 'cancelled'],
      'completed': ['cancelled'], // Rare but possible
      'cancelled': [] // Cannot change from cancelled
    };

    if (payment.status === status) {
      return {
        status: false,
        message: `Payment is already ${status}`,
        data: null
      };
    }

    // @ts-ignore
    if (!validTransitions[payment.status]?.includes(status)) {
      return {
        status: false,
        message: `Cannot change status from ${payment.status} to ${status}`,
        data: null
      };
    }

    // Special validations
    if (status === 'completed' && !payment.paymentDate) {
      payment.paymentDate = new Date();
    }

    if (status === 'cancelled') {
      // Check if payment can be cancelled
      if (payment.status === 'completed') {
        // May need additional validation for completed payments
      }
    }

    const oldStatus = payment.status;
    payment.status = status;
    payment.updatedAt = new Date();
    
    if (notes) {
      payment.notes = payment.notes ? `${payment.notes}\n${notes}` : notes;
    }

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: 'status_change',
      changedField: 'status',
      oldValue: oldStatus,
      newValue: status,
      notes: notes || `Status changed from ${oldStatus} to ${status}`,
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_payment_status',
      description: `Changed payment #${paymentId} status from ${oldStatus} to ${status}`,
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
      message: 'Payment status updated successfully',
      data: { payment: updatedPayment }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updatePaymentStatus:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update payment status: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};