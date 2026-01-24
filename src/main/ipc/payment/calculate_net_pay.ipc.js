// ipc/payment/calculate_net_pay.ipc.js
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
      otherDeductions = 0 
    } = params;
    
    if (!grossPay || grossPay <= 0) {
      return {
        status: false,
        message: 'Gross pay must be greater than 0',
        data: null
      };
    }

    // Calculate net pay
    const totalDeductions = 
      parseFloat(manualDeduction || 0) + 
      parseFloat(debtDeductions || 0) + 
      parseFloat(otherDeductions || 0);
    
    const netPay = parseFloat(grossPay) - totalDeductions;

    // Ensure net pay is not negative
    const finalNetPay = Math.max(0, netPay);

    // Create deduction breakdown
    const deductionBreakdown = {
      manualDeduction: parseFloat(manualDeduction || 0),
      debtDeductions: parseFloat(debtDeductions || 0),
      otherDeductions: parseFloat(otherDeductions || 0),
      totalDeductions: totalDeductions
    };

    return {
      status: true,
      message: 'Net pay calculated successfully',
      data: {
        grossPay: parseFloat(grossPay),
        netPay: finalNetPay,
        totalDeductions,
        deductionBreakdown
      }
    };
  } catch (error) {
    console.error('Error in calculateNetPay:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to calculate net pay: ${error.message}`,
      data: null
    };
  }
};