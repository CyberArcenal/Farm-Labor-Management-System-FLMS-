// src/ipc/payment/add_note.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function addPaymentNote(params = {}, queryRunner = null) {
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
    const { paymentId, note, _userId } = params;

    if (!paymentId || !note) {
      return { status: false, message: "Payment ID and note are required", data: null };
    }

    if (!_userId) {
      return { status: false, message: "User ID is required for audit trail", data: null };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    const payment = await paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // 🚫 Prevent adding notes to cancelled payments
    const lockedStatuses = ["cancelled"];
    if (lockedStatuses.includes(payment.status)) {
      return { status: false, message: `Cannot add note to payment with status '${payment.status}'`, data: null };
    }

    const oldNotes = payment.notes || "";
    const timestamp = new Date().toISOString();
    payment.notes = oldNotes ? `${oldNotes}\n[${timestamp}] ${note}` : `[${timestamp}] ${note}`;
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: "update",
      changedField: "notes",
      oldValue: oldNotes,
      newValue: payment.notes,
      notes: `Note added to payment: ${note}`,
      performedBy: String(_userId),
      changeDate: new Date(),
      changeReason: "add_note", // 🔒 explicit reason
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "add_payment_note",
      description: `Added note to payment #${paymentId}`,
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
      message: "Note added successfully",
      data: { payment: updatedPayment, history: paymentHistory },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in addPaymentNote:", error);
    // @ts-ignore
    return { status: false, message: `Failed to add note: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};