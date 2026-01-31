// src/ipc/payment/calculate_net_pay.ipc.js
//@ts-check

module.exports = async function calculateNetPay(params = {}) {
  try {
    const {
      // @ts-ignore
      grossPay,
      // @ts-ignore
      manualDeduction = 0,
      // @ts-ignore
      debtDeductions = 0,
      // @ts-ignore
      otherDeductions = 0,
    } = params;

    // Validate grossPay
    const gross = parseFloat(grossPay);
    if (isNaN(gross) || gross <= 0) {
      return {
        status: false,
        message: "Gross pay must be a number greater than 0",
        data: null,
      };
    }

    // Parse and validate deductions (must be non-negative numbers)
    const manual = parseFloat(manualDeduction || 0);
    const debt = parseFloat(debtDeductions || 0);
    const other = parseFloat(otherDeductions || 0);

    if ([manual, debt, other].some((v) => isNaN(v) || v < 0)) {
      return {
        status: false,
        message: "Deductions must be non-negative numbers",
        data: null,
      };
    }

    // Compute totals with safe rounding
    const totalDeductionsRaw = manual + debt + other;
    const totalDeductions = parseFloat(totalDeductionsRaw.toFixed(2));

    // If deductions exceed gross, final net pay is 0 and we flag it
    const rawNet = gross - totalDeductions;
    const deductionExceeded = rawNet < 0;
    const finalNetPay = parseFloat(Math.max(0, rawNet).toFixed(2));

    const deductionBreakdown = {
      manualDeduction: parseFloat(manual.toFixed(2)),
      debtDeductions: parseFloat(debt.toFixed(2)),
      otherDeductions: parseFloat(other.toFixed(2)),
      totalDeductions,
    };

    return {
      status: true,
      message: "Net pay calculated successfully",
      data: {
        grossPay: parseFloat(gross.toFixed(2)),
        netPay: finalNetPay,
        totalDeductions,
        deductionBreakdown,
        deductionExceeded, // true when deductions > grossPay
      },
    };
  } catch (error) {
    console.error("Error in calculateNetPay:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to calculate net pay: ${error.message}`,
      data: null,
    };
  }
};