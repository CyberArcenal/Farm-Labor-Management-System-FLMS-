// ipc/worker/calculate_balance.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const Debt = require("../../../entities/Debt");
const Payment = require("../../../entities/Payment");

module.exports = async function calculateWorkerBalance(params = {}) {
  try {
    // @ts-ignore
    const { workerId, recalculate = false, _userId } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get worker
      const workerRepository = queryRunner.manager.getRepository(Worker);
      const worker = await workerRepository.findOne({
        where: { id: parseInt(workerId) }
      });

      if (!worker) {
        await queryRunner.release();
        return {
          status: false,
          message: 'Worker not found',
          data: null
        };
      }

      // Get all active debts
      const debtRepository = queryRunner.manager.getRepository(Debt);
      const activeDebts = await debtRepository.find({
        where: { 
          worker: { id: parseInt(workerId) },
          status: ['pending', 'partially_paid']
        }
      });

      // Get all payments
      const paymentRepository = queryRunner.manager.getRepository(Payment);
      const payments = await paymentRepository.find({
        where: { worker: { id: parseInt(workerId) } }
      });

      // Calculate totals
      const calculations = {
        debts: {
          totalOriginalAmount: activeDebts.reduce((/** @type {number} */ sum, /** @type {{ originalAmount: any; }} */ debt) => 
            sum + parseFloat(debt.originalAmount || 0), 0
          ),
          totalAmount: activeDebts.reduce((/** @type {number} */ sum, /** @type {{ amount: any; }} */ debt) => 
            sum + parseFloat(debt.amount || 0), 0
          ),
          totalBalance: activeDebts.reduce((/** @type {number} */ sum, /** @type {{ balance: any; }} */ debt) => 
            sum + parseFloat(debt.balance || 0), 0
          ),
          totalInterest: activeDebts.reduce((/** @type {number} */ sum, /** @type {{ totalInterest: any; }} */ debt) => 
            sum + parseFloat(debt.totalInterest || 0), 0
          ),
          count: activeDebts.length,
          overdueDebts: activeDebts.filter((/** @type {{ dueDate: string | number | Date; }} */ debt) => {
            if (!debt.dueDate) return false;
            return new Date(debt.dueDate) < new Date();
          })
        },
        payments: {
          totalGrossPay: payments.reduce((/** @type {number} */ sum, /** @type {{ grossPay: any; }} */ payment) => 
            sum + parseFloat(payment.grossPay || 0), 0
          ),
          totalNetPay: payments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ payment) => 
            sum + parseFloat(payment.netPay || 0), 0
          ),
          totalDebtDeduction: payments.reduce((/** @type {number} */ sum, /** @type {{ totalDebtDeduction: any; }} */ payment) => 
            sum + parseFloat(payment.totalDebtDeduction || 0), 0
          ),
          totalOtherDeductions: payments.reduce((/** @type {number} */ sum, /** @type {{ otherDeductions: any; }} */ payment) => 
            sum + parseFloat(payment.otherDeductions || 0), 0
          ),
          count: payments.length
        }
      };

      // Calculate derived values
      const totalDebt = calculations.debts.totalBalance;
      const totalPaid = calculations.payments.totalDebtDeduction;
      const currentBalance = totalDebt - totalPaid;

      // Update worker if recalculate is true
      if (recalculate) {
        worker.totalDebt = totalDebt;
        worker.totalPaid = totalPaid;
        worker.currentBalance = currentBalance;
        worker.updatedAt = new Date();

        await queryRunner.manager.save(worker);
      }

      await queryRunner.release();

      return {
        status: true,
        message: 'Worker balance calculated successfully',
        data: {
          worker: recalculate ? worker : null,
          calculations,
          summary: {
            totalDebt,
            totalPaid,
            currentBalance,
            netPosition: calculations.payments.totalNetPay - totalDebt,
            debtToIncomeRatio: calculations.payments.totalNetPay > 0 
              ? (totalDebt / calculations.payments.totalNetPay) * 100 
              : 0,
            paymentCoverage: totalDebt > 0 
              ? (totalPaid / totalDebt) * 100 
              : 100
          },
          recommendations: getFinancialRecommendations(
            totalDebt, 
            currentBalance, 
            // @ts-ignore
            calculations.payments.averageNetPay
          )
        }
      };
    } catch (error) {
      await queryRunner.release();
      throw error;
    }
  } catch (error) {
    console.error('Error in calculateWorkerBalance:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to calculate worker balance: ${error.message}`,
      data: null
    };
  }
};

/**
 * Generate financial recommendations based on worker's financial position
 * @param {number} totalDebt
 * @param {number} currentBalance
 * @param {number} averageNetPay
 */
function getFinancialRecommendations(totalDebt, currentBalance, averageNetPay) {
  const recommendations = [];
  
  if (currentBalance > 0) {
    if (currentBalance > averageNetPay * 3) {
      recommendations.push({
        type: 'warning',
        message: 'High debt load detected',
        suggestion: 'Consider debt restructuring or payment plan'
      });
    }
    
    if (totalDebt > averageNetPay * 6) {
      recommendations.push({
        type: 'critical',
        message: 'Very high debt-to-income ratio',
        suggestion: 'Immediate action needed. Consider debt consolidation.'
      });
    }
    
    // Calculate suggested monthly payment
    const suggestedMonthlyPayment = Math.min(currentBalance * 0.1, averageNetPay * 0.3);
    if (suggestedMonthlyPayment > 0) {
      recommendations.push({
        type: 'suggestion',
        message: 'Suggested monthly payment',
        suggestion: `Pay ₱${suggestedMonthlyPayment.toFixed(2)} monthly to clear debt in reasonable time`
      });
    }
  } else {
    recommendations.push({
      type: 'positive',
      message: 'No outstanding debt',
      suggestion: 'Good financial standing'
    });
  }
  
  return recommendations;
}