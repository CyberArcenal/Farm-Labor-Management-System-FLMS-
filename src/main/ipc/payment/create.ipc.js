// src/ipc/payment/create.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const PaymentHistory = require("../../../entities/PaymentHistory");
const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

module.exports = async function createPayment(params = {}, queryRunner = null) {
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
    const { workerId, pitakId, grossPay, periodStart, periodEnd, _userId } =
      params;

    if (!workerId || !grossPay) {
      return {
        status: false,
        message: "Worker ID and gross pay are required",
        data: null,
      };
    }

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return {
        status: false,
        message: "No default session configured. Please set one in Settings.",
        data: null,
      };
    }

    // Check if worker exists
    // @ts-ignore
    const worker = await queryRunner.manager.findOne(Worker, {
      where: { id: workerId },
    });

    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null,
      };
    }

    // Calculate net pay (initially same as gross, deductions will be applied later)
    const netPay = grossPay;

    // ✅ Create new payment tied to session
    // @ts-ignore
    const payment = queryRunner.manager.create(Payment, {
      worker: { id: workerId },
      pitak: pitakId ? { id: pitakId } : null,
      session: { id: sessionId }, // 🔑 tie to default session
      grossPay,
      netPay,
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // @ts-ignore
    const savedPayment = await queryRunner.manager.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistory = queryRunner.manager.create(PaymentHistory, {
      payment: savedPayment,
      actionType: "create",
      changedField: "status",
      oldValue: null,
      newValue: "pending",
      notes: "Payment created",
      performedBy: _userId,
      changeDate: new Date(),
    });
    // @ts-ignore
    await queryRunner.manager.save(paymentHistory);

    // ✅ Log activity with session context
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "create_payment",
      entity: "Payment",
      entity_id: savedPayment.id,
      session: { id: sessionId },
      description: `Created payment #${savedPayment.id} for worker ${worker.name}`,
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
      message: "Payment created successfully",
      data: { payment: savedPayment, sessionId },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in createPayment:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create payment: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};
