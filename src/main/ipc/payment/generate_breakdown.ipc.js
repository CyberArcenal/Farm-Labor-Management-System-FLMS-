// src/ipc/payment/generate_breakdown.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Debt = require("../../../entities/Debt");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Generate a safe, normalized payment breakdown for display and audit.
 * - Validates input
 * - Normalizes numeric values and deductionBreakdown
 * - Includes active debts and applied debt payments
 * - Flags when deductions exceed gross pay
 */
module.exports = async function generatePaymentBreakdown(params = {}) {
  try {
    // @ts-ignore
    const { paymentId } = params;

    if (!paymentId) {
      return { status: false, message: "Payment ID is required", data: null };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["worker", "debtPayments", "debtPayments.debt", "session", "pitak"],
    });

    if (!payment) {
      return { status: false, message: "Payment not found", data: null };
    }

    // @ts-ignore
    if (!payment.worker || !payment.worker.id) {
      return { status: false, message: "Payment has no associated worker", data: null };
    }

    // Safe numeric parsing helpers
    // @ts-ignore
    const toNum = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? parseFloat(n.toFixed(2)) : 0.0;
    };

    const grossPay = toNum(payment.grossPay);
    const totalDebtDeduction = toNum(payment.totalDebtDeduction);
    const manualDeduction = toNum(payment.manualDeduction);
    const otherDeductions = toNum(payment.otherDeductions);
    const netPay = toNum(payment.netPay);

    // Normalize deductionBreakdown (ensure numeric fields)
    let normalizedBreakdown = {
      manualDeduction,
      debtDeductions: totalDebtDeduction,
      otherDeductions,
      totalDeductions: parseFloat((manualDeduction + totalDebtDeduction + otherDeductions).toFixed(2)),
    };
    try {
      if (payment.deductionBreakdown) {
        const raw = typeof payment.deductionBreakdown === "object"
          ? payment.deductionBreakdown
          // @ts-ignore
          : JSON.parse(payment.deductionBreakdown);
        normalizedBreakdown = {
          manualDeduction: toNum(raw.manualDeduction ?? manualDeduction),
          debtDeductions: toNum(raw.debtDeductions ?? totalDebtDeduction),
          otherDeductions: toNum(raw.otherDeductions ?? otherDeductions),
          totalDeductions: parseFloat((
            toNum(raw.manualDeduction ?? manualDeduction) +
            toNum(raw.debtDeductions ?? totalDebtDeduction) +
            toNum(raw.otherDeductions ?? otherDeductions)
          ).toFixed(2)),
        };
      }
    } catch (e) {
      // keep default normalizedBreakdown on parse error
    }

    // Get worker's active debts
    const debtRepository = AppDataSource.getRepository(Debt);
    const activeDebts = await debtRepository.find({
      where: {
        // @ts-ignore
        worker: { id: payment.worker.id },
        status: ["pending", "partially_paid"],
      },
      order: { dueDate: "ASC" },
    });

    // Build debt list for display
    const activeDebtsList = activeDebts.map((debt) => ({
      id: debt.id,
      originalAmount: toNum(debt.originalAmount),
      balance: toNum(debt.balance),
      status: debt.status,
      // @ts-ignore
      dueDate: debt.dueDate ? debt.dueDate.toISOString().split("T")[0] : null,
      interestRate: debt.interestRate ? toNum(debt.interestRate) : null,
    }));

    // Build applied debt payments breakdown (if any)
    // @ts-ignore
    const appliedDebtBreakdown = (payment.debtPayments && payment.debtPayments.length > 0)
      // @ts-ignore
      ? payment.debtPayments.map((dp) => ({
          debtId: dp.debt && dp.debt.id ? dp.debt.id : null,
          amount: toNum(dp.amountPaid || dp.amount || 0),
          transactionType: dp.transactionType || null,
          previousBalance: toNum(dp.previousBalance),
          newBalance: toNum(dp.newBalance),
          transactionDate: dp.transactionDate ? new Date(dp.transactionDate).toISOString() : null,
        }))
      : [];

    // Calculation summary and flags
    const calculatedTotalDeductions = normalizedBreakdown.totalDeductions;
    const deductionExceeded = calculatedTotalDeductions > grossPay;

    const breakdown = {
      paymentDetails: {
        id: payment.id,
        // @ts-ignore
        workerId: payment.worker.id,
        // @ts-ignore
        workerName: payment.worker.name || null,
        // @ts-ignore
        sessionId: payment.session ? payment.session.id : null,
        // @ts-ignore
        pitakId: payment.pitak ? payment.pitak.id : null,
        grossPay,
        netPay,
        status: payment.status,
        period:
          payment.periodStart && payment.periodEnd
            // @ts-ignore
            ? `${payment.periodStart.toISOString().split("T")[0]} to ${payment.periodEnd.toISOString().split("T")[0]}`
            : null,
      },
      deductions: {
        total: calculatedTotalDeductions,
        byCategory: {
          debt: normalizedBreakdown.debtDeductions,
          manual: normalizedBreakdown.manualDeduction,
          other: normalizedBreakdown.otherDeductions,
        },
        debtBreakdown: appliedDebtBreakdown,
      },
      activeDebts: activeDebtsList,
      calculation: {
        grossPay,
        minusDebtDeductions: -normalizedBreakdown.debtDeductions,
        minusManualDeductions: -normalizedBreakdown.manualDeduction,
        minusOtherDeductions: -normalizedBreakdown.otherDeductions,
        equalsNetPay: netPay,
        deductionExceeded,
      },
      rawDeductionBreakdown: payment.deductionBreakdown || normalizedBreakdown,
    };

    // Formatted summary for quick display
    const formattedBreakdown = {
      summary: {
        Worker: breakdown.paymentDetails.workerName,
        "Gross Pay": `₱${breakdown.paymentDetails.grossPay.toFixed(2)}`,
        "Total Deductions": `₱${breakdown.deductions.total.toFixed(2)}`,
        "Net Pay": `₱${breakdown.paymentDetails.netPay.toFixed(2)}`,
        Status: breakdown.paymentDetails.status,
      },
      deductions: {
        debt: `₱${breakdown.deductions.byCategory.debt.toFixed(2)}`,
        manual: `₱${breakdown.deductions.byCategory.manual.toFixed(2)}`,
        other: `₱${breakdown.deductions.byCategory.other.toFixed(2)}`,
      },
      activeDebtsCount: breakdown.activeDebts.length,
      calculationSteps: [
        `Gross Pay: ₱${breakdown.calculation.grossPay.toFixed(2)}`,
        `Debt Deductions: -₱${Math.abs(breakdown.calculation.minusDebtDeductions).toFixed(2)}`,
        `Manual Deductions: -₱${Math.abs(breakdown.calculation.minusManualDeductions).toFixed(2)}`,
        `Other Deductions: -₱${Math.abs(breakdown.calculation.minusOtherDeductions).toFixed(2)}`,
        `Net Pay: ₱${breakdown.calculation.equalsNetPay.toFixed(2)}`,
      ],
      warnings: deductionExceeded ? ["Total deductions exceed gross pay; net pay set to 0 or needs review"] : [],
    };

    return {
      status: true,
      message: "Payment breakdown generated successfully",
      data: {
        breakdown: formattedBreakdown,
        detailed: breakdown,
        raw: payment.deductionBreakdown || {},
      },
    };
  } catch (error) {
    console.error("Error in generatePaymentBreakdown:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate payment breakdown: ${error.message}`,
      data: null,
    };
  }
};