// src/ipc/payment/delete.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function deletePayment(params = {}, queryRunner = null) {
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
    const { paymentId, _userId } = params;

    if (!paymentId) {
      return { status: false, message: "Payment ID is required", data: null };
    }
    if (!_userId) {
      return { status: false, message: "User ID is required for audit trail", data: null };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["worker", "debtPayments", "history"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // Disallow deleting completed payments
    if (payment.status === "completed") {
      return { status: false, message: "Cannot delete completed payment", data: null };
    }

    // Prevent deletion if payment has applied debt payments (would orphan debt history / balances)
    if (payment.debtPayments && payment.debtPayments.length > 0) {
      return {
        status: false,
        message: "Cannot delete payment that has applied debt payments. Reverse deductions first.",
        data: null,
      };
    }

    // Prevent deletion if payment has any important history entries (optional policy)
    // If you prefer to allow deletion even with history, remove this block.
    if (payment.history && payment.history.length > 0) {
      // We still allow deletion, but we will keep history records in DB (do not delete them).
      // If your DB cascades history on payment delete, consider switching to soft-delete instead.
    }

    // Store payment details for logging
    const paymentDetails = {
      id: payment.id,
      workerName: payment.worker?.name || null,
      amount: parseFloat(payment.netPay || 0),
      status: payment.status,
    };

    // Create a PaymentHistory entry recording the deletion (audit)
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const deletionHistory = paymentHistoryRepository.create({
      payment: { id: payment.id },
      actionType: "delete",
      changedField: "payment",
      oldValue: payment.status,
      newValue: "deleted",
      oldAmount: parseFloat(payment.netPay || 0),
      newAmount: null,
      notes: `Payment deleted by user ${_userId}`,
      performedBy: String(_userId),
      changeDate: new Date(),
      changeReason: "delete_payment",
    });
    await paymentHistoryRepository.save(deletionHistory);

    // Delete the payment record
    // Note: we intentionally do NOT delete payment history records here to preserve audit trail.
    await paymentRepository.delete(paymentId);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "delete_payment",
      description: `Deleted payment #${paymentId} (${paymentDetails.workerName || "unknown"} - ${paymentDetails.amount})`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: "Payment deleted successfully",
      data: { deletedPayment: paymentDetails, deletionHistoryId: deletionHistory.id },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in deletePayment:", error);
    // @ts-ignore
    return { status: false, message: `Failed to delete payment: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};