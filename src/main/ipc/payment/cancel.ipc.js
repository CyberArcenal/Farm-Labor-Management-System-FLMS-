// src/ipc/payment/cancel.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function cancelPayment(params = {}, queryRunner = null) {
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
    const { paymentId, reason, _userId } = params;

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
      relations: ["worker", "debtPayments"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // NEW: disallow cancelling completed payments
    if (payment.status === "completed") {
      return {
        status: false,
        message: "Cancellation of completed payments is not allowed",
        data: null,
      };
    }

    if (payment.status === "cancelled") {
      return { status: false, message: "Payment is already cancelled", data: null };
    }

    const oldStatus = payment.status;
    const timestamp = new Date().toISOString();
    payment.status = "cancelled";
    payment.notes = payment.notes
      ? `${payment.notes}\n[${timestamp}] CANCELLED: ${reason || "No reason provided"}`
      : `[${timestamp}] CANCELLED: ${reason || "No reason provided"}`;
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: "status_change",
      changedField: "status",
      oldValue: oldStatus,
      newValue: "cancelled",
      notes: `Payment cancelled: ${reason || "No reason provided"}`,
      performedBy: String(_userId),
      changeDate: new Date(),
      changeReason: "cancel_payment",
    });
    await paymentHistoryRepository.save(paymentHistory);

    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "cancel_payment",
      description: `Cancelled payment #${paymentId} (was ${oldStatus})`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return { status: true, message: "Payment cancelled successfully", data: { payment: updatedPayment } };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in cancelPayment:", error);
    // @ts-ignore
    return { status: false, message: `Failed to cancel payment: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};