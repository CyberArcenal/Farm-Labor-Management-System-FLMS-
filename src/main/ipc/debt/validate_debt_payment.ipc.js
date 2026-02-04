// src/ipc/debt/get/validatePayment.ipc.js
// @ts-check

const Debt = require("../../../entities/Debt");
const { AppDataSource } = require("../../db/dataSource");
const Worker = require("../../../entities/Worker");
const { In } = require("typeorm");
const { farmSessionDefaultSessionId } = require("../../../utils/system");
const Payment = require("../../../entities/Payment");

/**
 * Validate a debt payment request
 * @param {{ workerId: number; paymentAmount: number }} filters
 * @param {number} [userId]
 */
// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const { workerId, paymentAmount } = filters;
    console.log("[validatePayment] Incoming filters:", filters);

    const debtRepository = AppDataSource.getRepository(Debt);
    const workerRepository = AppDataSource.getRepository(Worker);
    const sessionId = await farmSessionDefaultSessionId();
    const paymentRepository = AppDataSource.getRepository(Payment);

    // Basic validation
    if (!workerId || workerId <= 0) {
      console.warn("[validatePayment] Invalid workerId:", workerId);
      return {
        status: false,
        message: "Invalid workerId",
        data: {
          isValid: false,
          maxPaymentAllowed: 0,
          availablePaymentsTotal: 0,
          totalDebt: 0,
          errors: ["Invalid workerId"],
          warnings: [],
        },
      };
    }
    if (!paymentAmount || paymentAmount <= 0) {
      console.warn("[validatePayment] Invalid paymentAmount:", paymentAmount);
      return {
        status: false,
        message: "Payment amount must be greater than zero",
        data: {
          isValid: false,
          maxPaymentAllowed: 0,
          availablePaymentsTotal: 0,
          totalDebt: 0,
          errors: ["Payment amount must be greater than zero"],
          warnings: [],
        },
      };
    }

    // Check worker
    const worker = await workerRepository.findOne({ where: { id: workerId } });
    console.log("[validatePayment] Worker lookup result:", worker);

    if (!worker) {
      console.error("[validatePayment] Worker not found for id:", workerId);
      return {
        status: false,
        message: "Worker not found",
        data: {
          isValid: false,
          maxPaymentAllowed: 0,
          availablePaymentsTotal: 0,
          totalDebt: 0,
          errors: ["Worker not found"],
          warnings: [],
        },
      };
    }

    // Get active debts
    const activeDebts = await debtRepository.find({
      where: {
        // @ts-ignore
        worker: { id: workerId },
        status: In(["pending", "partially_paid"]),
      },
      relations: ["worker"], // para ma-resolve ang relation
    });

    console.log("[validatePayment] Active debts found:", activeDebts);

    const totalDebt = activeDebts.reduce(
      // @ts-ignore
      (sum, d) => sum + parseFloat(d.balance),
      0,
    );
    console.log("[validatePayment] Computed totalDebt:", totalDebt);

    const maxPaymentAllowed = totalDebt;
    // @ts-ignore
    const availablePaymentsTotal = parseFloat(worker.currentBalance || 0);
    console.log(
      "[validatePayment] availablePaymentsTotal:",
      availablePaymentsTotal,
    );

    const pendingPayments = await paymentRepository.find({
      where: {
        // @ts-ignore
        worker: { id: workerId },
        session: { id: sessionId },
        status: In(["pending", "partially_paid"]),
      },
      relations: ["worker", "session"],
    });

    if (pendingPayments.length === 0) {
      return {
        status: false,
        message:
          "No pending payroll payments found. Cannot process debt payment.",
        data: {
          isValid: false,
          maxPaymentAllowed: totalDebt,
          availablePaymentsTotal: availablePaymentsTotal,
          totalDebt: totalDebt,
          errors: ["No pending payroll payments found"],
          warnings: [],
        },
      };
    }

    // @ts-ignore
    const errors = [];
    const warnings = [];

    if (paymentAmount > maxPaymentAllowed) {
      warnings.push(
        `Payment amount (${paymentAmount}) exceeds total debt (${maxPaymentAllowed}).`,
      );
      console.warn("[validatePayment] Warning:", warnings[warnings.length - 1]);
    }
    if (paymentAmount > availablePaymentsTotal) {
      warnings.push(
        `Payment amount (${paymentAmount}) exceeds available balance (${availablePaymentsTotal}).`,
      );
      console.warn("[validatePayment] Warning:", warnings[warnings.length - 1]);
    }

    const isValid =
      paymentAmount > 0 &&
      activeDebts.length > 0 &&
      paymentAmount <= maxPaymentAllowed;

    console.log("[validatePayment] Final validation result:", {
      isValid,
      maxPaymentAllowed,
      availablePaymentsTotal,
      totalDebt,
      // @ts-ignore
      errors,
      warnings,
    });

    return {
      status: true,
      message: isValid
        ? "Debt payment validated successfully"
        : "Debt payment validation failed",
      data: {
        isValid,
        maxPaymentAllowed,
        availablePaymentsTotal,
        totalDebt,
        // @ts-ignore
        errors,
        warnings,
      },
    };
  } catch (error) {
    console.error("Error validating debt payment:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to validate debt payment",
      data: {
        isValid: false,
        maxPaymentAllowed: 0,
        availablePaymentsTotal: 0,
        totalDebt: 0,
        // @ts-ignore
        errors: [error.message],
        warnings: [],
      },
    };
  }
};
