// src/ipc/payment/assign_to_worker.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function assignPaymentToWorker(params = {}, queryRunner = null) {
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
    const { paymentId, workerId, _userId } = params;

    if (!paymentId || !workerId) {
      return { status: false, message: "Payment ID and Worker ID are required", data: null };
    }
    if (!_userId) {
      return { status: false, message: "User ID is required for audit trail", data: null };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);

    // Load payment with related worker and session (session used for uniqueness checks)
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["worker", "pitak", "session"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // Prevent operations on cancelled payments
    if (payment.status === "cancelled") {
      return { status: false, message: `Cannot reassign worker for payment with status '${payment.status}'`, data: null };
    }

    const newWorker = await workerRepository.findOne({ where: { id: workerId } });
    if (!newWorker) {
      return { status: false, message: "Worker not found", data: null };
    }

    const oldWorker = payment.worker || null;

    // No-op if same worker
    if (oldWorker && oldWorker.id === newWorker.id) {
      return {
        status: true,
        message: "Payment already assigned to the specified worker",
        data: {
          payment,
          oldWorker: oldWorker ? { id: oldWorker.id, name: oldWorker.name } : null,
          newWorker: { id: newWorker.id, name: newWorker.name },
        },
      };
    }

    // Enforce composite uniqueness: pitak + worker + session (if payment has pitak/session)
    if (payment.pitak && payment.session) {
      const duplicate = await paymentRepository.findOne({
        where: {
          pitak: { id: payment.pitak.id },
          worker: { id: newWorker.id },
          session: { id: payment.session.id },
        },
      });
      if (duplicate && duplicate.id !== payment.id) {
        return {
          status: false,
          message: "Another payment already exists for this pitak, worker and session. Reassignment would violate uniqueness.",
          data: { conflictingPaymentId: duplicate.id },
        };
      }
    }

    // Adjust worker aggregates: move payment amounts from oldWorker -> newWorker
    // Use netPay as the primary transferred amount; guard numeric parsing
    const netPay = parseFloat(payment.netPay || 0);
    if (oldWorker) {
      oldWorker.totalPaid = Math.max(0, parseFloat(oldWorker.totalPaid || 0) - netPay);
      oldWorker.currentBalance = Math.max(0, parseFloat(oldWorker.currentBalance || 0) + netPay);
      await workerRepository.save(oldWorker);
    }

    newWorker.totalPaid = parseFloat(newWorker.totalPaid || 0) + netPay;
    newWorker.currentBalance = Math.max(0, parseFloat(newWorker.currentBalance || 0) - netPay);
    await workerRepository.save(newWorker);

    // Apply assignment
    payment.worker = newWorker;
    payment.updatedAt = new Date();
    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: "update",
      changedField: "worker",
      oldValue: oldWorker ? `${oldWorker.id}:${oldWorker.name}` : "None",
      newValue: `${newWorker.id}:${newWorker.name}`,
      notes: `Payment reassigned from ${oldWorker ? `${oldWorker.id}:${oldWorker.name}` : "No worker"} to ${newWorker.id}:${newWorker.name}`,
      performedBy: String(_userId),
      changeDate: new Date(),
      changeReason: "assign_worker",
    });
    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: "assign_payment_to_worker",
      description: `User ${_userId} reassigned payment #${paymentId} from ${oldWorker ? `${oldWorker.id}:${oldWorker.name}` : "none"} to ${newWorker.id}:${newWorker.name}`,
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
      message: "Payment assigned to worker successfully",
      data: {
        payment: updatedPayment,
        oldWorker: oldWorker ? { id: oldWorker.id, name: oldWorker.name } : null,
        newWorker: { id: newWorker.id, name: newWorker.name },
        history: paymentHistory,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in assignPaymentToWorker:", error);
    // @ts-ignore
    return { status: false, message: `Failed to assign payment to worker: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};