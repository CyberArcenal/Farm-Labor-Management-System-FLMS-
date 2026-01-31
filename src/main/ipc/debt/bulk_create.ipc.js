// src/ipc/payment/bulk_create.ipc.js
//@ts-check

const { farmSessionDefaultSessionId } = require("../../../utils/system");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { payments, _userId } = params;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return {
        status: false,
        message: "Payments array is required and cannot be empty",
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

    const paymentRepository = queryRunner.manager.getRepository("Payment");
    const paymentHistoryRepository = queryRunner.manager.getRepository("PaymentHistory");
    const workerRepository = queryRunner.manager.getRepository("Worker");
    // @ts-ignore
    const debtRepository = queryRunner.manager.getRepository("Debt");

    const results = [];
    const errors = [];

    for (let i = 0; i < payments.length; i++) {
      const paymentData = payments[i];

      try {
        if (!paymentData.worker_id || !paymentData.grossPay) {
          errors.push(`Payment ${i + 1}: Missing required fields (worker_id or grossPay)`);
          continue;
        }

        const worker = await workerRepository.findOne({ where: { id: paymentData.worker_id } });
        if (!worker) {
          errors.push(`Payment ${i + 1}: Worker with ID ${paymentData.worker_id} not found`);
          continue;
        }

        const grossPay = parseFloat(paymentData.grossPay);
        const manualDeduction = parseFloat(paymentData.manualDeduction || 0);
        const totalDebtDeduction = parseFloat(paymentData.totalDebtDeduction || 0);
        const otherDeductions = parseFloat(paymentData.otherDeductions || 0);

        const netPay = grossPay - manualDeduction - totalDebtDeduction - otherDeductions;

        // ✅ Create payment tied to session
        const payment = paymentRepository.create({
          worker: { id: paymentData.worker_id },
          pitak: paymentData.pitak_id ? { id: paymentData.pitak_id } : null,
          session: { id: sessionId }, // 🔑 tie to default session
          grossPay,
          manualDeduction,
          netPay,
          totalDebtDeduction,
          otherDeductions,
          deductionBreakdown: paymentData.deductionBreakdown || null,
          status: paymentData.status || "pending",
          paymentDate: paymentData.paymentDate || null,
          paymentMethod: paymentData.paymentMethod || null,
          referenceNumber: paymentData.referenceNumber || null,
          periodStart: paymentData.periodStart || null,
          periodEnd: paymentData.periodEnd || null,
          notes: paymentData.notes || null,
        });

        const savedPayment = await paymentRepository.save(payment);

        const paymentHistory = paymentHistoryRepository.create({
          payment: { id: savedPayment.id },
          actionType: "create",
          changedField: "all",
          oldValue: null,
          newValue: "Payment created",
          oldAmount: 0,
          newAmount: grossPay,
          notes: "Bulk payment creation",
          performedBy: _userId ? String(_userId) : "system",
          changeDate: new Date(),
        });

        await paymentHistoryRepository.save(paymentHistory);

        if (totalDebtDeduction > 0) {
          worker.totalPaid = parseFloat(worker.totalPaid) + totalDebtDeduction;
          worker.currentBalance = Math.max(0, parseFloat(worker.currentBalance) - totalDebtDeduction);
          await workerRepository.save(worker);
        }

        results.push({
          index: i,
          paymentId: savedPayment.id,
          workerId: paymentData.worker_id,
          sessionId,
          status: "success",
          message: "Payment created successfully",
        });
      } catch (error) {
        // @ts-ignore
        errors.push(`Payment ${i + 1}: ${error.message}`);
        results.push({
          index: i,
          status: "error",
          // @ts-ignore
          message: error.message,
        });
      }
    }

    return {
      status: errors.length === 0,
      message:
        errors.length > 0
          ? `Processed ${results.length} payments with ${errors.length} errors`
          : `Successfully created ${results.length} payments`,
      data: {
        results,
        errors: errors.length > 0 ? errors : null,
        summary: {
          total: payments.length,
          successful: results.filter((r) => r.status === "success").length,
          failed: results.filter((r) => r.status === "error").length,
          sessionId,
        },
      },
    };
  } catch (error) {
    console.error("Error in bulk create payments:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null,
    };
  }
};