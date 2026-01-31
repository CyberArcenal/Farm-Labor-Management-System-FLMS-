// ipc/payment/update_status.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updatePaymentStatus(params = {}, queryRunner = null) {
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
    const { paymentId, status, notes, _userId, paymentMethod, referenceNumber } = params;

    if (!paymentId || !status) {
      return {
        status: false,
        message: "Payment ID and status are required",
        data: null,
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["worker", "pitak", "session"],
    });

    if (!payment) {
      return {
        status: false,
        message: "Payment not found",
        data: null,
      };
    }

    const validTransitions = {
      pending: ["processing", "cancelled"],
      processing: ["completed", "cancelled"],
      completed: ["cancelled"], // rare, but allowed with strict validation
      cancelled: [], // cannot change from cancelled
    };

    if (payment.status === status) {
      return {
        status: false,
        message: `Payment is already ${status}`,
        data: null,
      };
    }

    // @ts-ignore
    if (!validTransitions[payment.status]?.includes(status)) {
      return {
        status: false,
        message: `Cannot change status from ${payment.status} to ${status}`,
        data: null,
      };
    }

    // Special validations
    if (status === "completed") {
      if (!payment.paymentDate) payment.paymentDate = new Date();
      if (!paymentMethod || !referenceNumber) {
        return {
          status: false,
          message: "Payment method and reference number are required to complete payment",
          data: null,
        };
      }
      payment.paymentMethod = paymentMethod;
      payment.referenceNumber = referenceNumber;
    }

    if (status === "cancelled" && payment.status === "completed") {
      // add stricter checks here if needed (e.g., ensure no downstream records)
    }

    const oldStatus = payment.status;
    payment.status = status;
    payment.updatedAt = new Date();

    if (notes) {
      payment.notes =
        (payment.notes ? payment.notes + "\n" : "") +
        `[${new Date().toISOString()}] ${notes}`;
    }

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: "update",
      changedField: "status",
      oldValue: oldStatus,
      newValue: status,
      oldAmount: parseFloat(updatedPayment.netPay),
      newAmount: parseFloat(updatedPayment.netPay),
      notes: notes
        ? `[${new Date().toISOString()}] ${notes}`
        : `Status changed from ${oldStatus} to ${status}`,
      performedBy: String(_userId),
      changeDate: new Date(),
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "update_payment_status",
      entity: "Payment",
      entity_id: updatedPayment.id,
      description: `Changed payment #${paymentId} status from ${oldStatus} to ${status}`,
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
      message: `Payment #${paymentId} status updated from ${oldStatus} to ${status}`,
      data: {
        id: updatedPayment.id,
        oldStatus,
        newStatus: updatedPayment.status,
        worker: updatedPayment.worker
          ? { id: updatedPayment.worker.id, name: updatedPayment.worker.name }
          : null,
        pitak: updatedPayment.pitak
          ? { id: updatedPayment.pitak.id, name: updatedPayment.pitak.name }
          : null,
        session: updatedPayment.session ? { id: updatedPayment.session.id } : null,
        netPay: updatedPayment.netPay,
        paymentDate: updatedPayment.paymentDate,
        paymentMethod: updatedPayment.paymentMethod,
        referenceNumber: updatedPayment.referenceNumber,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in updatePaymentStatus:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update payment status: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};