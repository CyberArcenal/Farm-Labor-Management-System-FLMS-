// ipc/payment/generate_breakdown.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Debt = require("../../../entities/Debt");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function generatePaymentBreakdown(params = {}) {
  try {
    // @ts-ignore
    const { paymentId } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['worker', 'debtPayments', 'debtPayments.debt']
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    // Get worker's active debts for breakdown
    const debtRepository = AppDataSource.getRepository(Debt);
    const activeDebts = await debtRepository.find({
      where: { 
        worker: { id: payment.worker.id },
        status: ['pending', 'partially_paid']
      },
      order: { dueDate: 'ASC' }
    });

    // Create detailed breakdown
    const breakdown = {
      paymentDetails: {
        id: payment.id,
        workerName: payment.worker.name,
        grossPay: parseFloat(payment.grossPay),
        netPay: parseFloat(payment.netPay),
        status: payment.status,
        period: payment.periodStart && payment.periodEnd 
          ? `${payment.periodStart.toISOString().split('T')[0]} to ${payment.periodEnd.toISOString().split('T')[0]}`
          : 'Not specified'
      },
      deductions: {
        total: parseFloat(payment.totalDebtDeduction) + 
               parseFloat(payment.manualDeduction || 0) + 
               parseFloat(payment.otherDeductions || 0),
        byCategory: {
          debt: parseFloat(payment.totalDebtDeduction),
          manual: parseFloat(payment.manualDeduction || 0),
          other: parseFloat(payment.otherDeductions || 0)
        },
        debtBreakdown: []
      },
      activeDebts: activeDebts.map((/** @type {{ id: any; originalAmount: string; balance: string; status: any; dueDate: any; interestRate: string; }} */ debt) => ({
        id: debt.id,
        originalAmount: parseFloat(debt.originalAmount),
        balance: parseFloat(debt.balance),
        status: debt.status,
        dueDate: debt.dueDate,
        interestRate: parseFloat(debt.interestRate)
      })),
      calculation: {
        grossPay: parseFloat(payment.grossPay),
        minusDebtDeductions: -parseFloat(payment.totalDebtDeduction),
        minusManualDeductions: -parseFloat(payment.manualDeduction || 0),
        minusOtherDeductions: -parseFloat(payment.otherDeductions || 0),
        equalsNetPay: parseFloat(payment.netPay)
      }
    };

    // Add debt payment breakdown if available
    if (payment.debtPayments && payment.debtPayments.length > 0) {
      breakdown.deductions.debtBreakdown = payment.debtPayments.map((/** @type {{ debt: { id: any; }; amountPaid: string; transactionType: any; previousBalance: string; newBalance: string; }} */ dp) => ({
        debtId: dp.debt.id,
        amount: parseFloat(dp.amountPaid),
        transactionType: dp.transactionType,
        previousBalance: parseFloat(dp.previousBalance),
        newBalance: parseFloat(dp.newBalance)
      }));
    }

    // Format for display
    const formattedBreakdown = {
      summary: {
        'Worker': breakdown.paymentDetails.workerName,
        'Gross Pay': `₱${breakdown.paymentDetails.grossPay.toFixed(2)}`,
        'Total Deductions': `₱${breakdown.deductions.total.toFixed(2)}`,
        'Net Pay': `₱${breakdown.paymentDetails.netPay.toFixed(2)}`,
        'Status': breakdown.paymentDetails.status
      },
      deductions: breakdown.deductions.byCategory,
      activeDebtsCount: breakdown.activeDebts.length,
      calculationSteps: [
        `Gross Pay: ₱${breakdown.calculation.grossPay.toFixed(2)}`,
        `Debt Deductions: -₱${Math.abs(breakdown.calculation.minusDebtDeductions).toFixed(2)}`,
        `Manual Deductions: -₱${Math.abs(breakdown.calculation.minusManualDeductions).toFixed(2)}`,
        `Other Deductions: -₱${Math.abs(breakdown.calculation.minusOtherDeductions).toFixed(2)}`,
        `Net Pay: ₱${breakdown.calculation.equalsNetPay.toFixed(2)}`
      ]
    };

    return {
      status: true,
      message: 'Payment breakdown generated successfully',
      data: {
        breakdown: formattedBreakdown,
        detailed: breakdown,
        raw: payment.deductionBreakdown || {}
      }
    };
  } catch (error) {
    console.error('Error in generatePaymentBreakdown:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate payment breakdown: ${error.message}`,
      data: null
    };
  }
};