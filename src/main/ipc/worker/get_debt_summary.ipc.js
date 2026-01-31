// ipc/worker/get_debt_summary.ipc.js
//@ts-check

// @ts-ignore
// @ts-ignore
const Worker = require("../../../entities/Worker");
// @ts-ignore
// @ts-ignore
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
// @ts-ignore
// @ts-ignore
const Payment = require("../../../entities/Payment");
const Debt = require("../../../entities/Debt");
// @ts-ignore
// @ts-ignore
const Assignment = require("../../../entities/Assignment");

module.exports = async function getWorkerDebtSummary(params = {}) {
  try {
    // @ts-ignore
    // @ts-ignore
    const { workerId, includeHistory = false, _userId } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const debtRepository = AppDataSource.getRepository(Debt);

    const whereClause = { worker: { id: parseInt(workerId) } };
    const relations = includeHistory ? ['history'] : [];

    const debts = await debtRepository.find({
      // @ts-ignore
      where: whereClause,
      relations,
      order: { dueDate: 'ASC' }
    });

    // Calculate summary
    const summary = {
      totalDebts: debts.length,
      totalOriginalAmount: debts.reduce((/** @type {number} */ sum, /** @type {{ originalAmount: any; }} */ debt) => 
        sum + parseFloat(debt.originalAmount || 0), 0
      ),
      totalAmount: debts.reduce((/** @type {number} */ sum, /** @type {{ amount: any; }} */ debt) => 
        sum + parseFloat(debt.amount || 0), 0
      ),
      totalBalance: debts.reduce((/** @type {number} */ sum, /** @type {{ balance: any; }} */ debt) => 
        sum + parseFloat(debt.balance || 0), 0
      ),
      totalInterest: debts.reduce((/** @type {number} */ sum, /** @type {{ totalInterest: any; }} */ debt) => 
        sum + parseFloat(debt.totalInterest || 0), 0
      ),
      totalPaid: debts.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: any; }} */ debt) => 
        sum + parseFloat(debt.totalPaid || 0), 0
      ),
      byStatus: {
        // @ts-ignore
        pending: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'pending').length,
        // @ts-ignore
        partially_paid: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'partially_paid').length,
        // @ts-ignore
        paid: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'paid').length,
        // @ts-ignore
        cancelled: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'cancelled').length,
        // @ts-ignore
        overdue: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'overdue').length
      },
      // @ts-ignore
      overdueDebts: debts.filter((/** @type {{ status: string; dueDate: string | number | Date; }} */ debt) => {
        if (debt.status !== 'pending' && debt.status !== 'partially_paid') return false;
        if (!debt.dueDate) return false;
        return new Date(debt.dueDate) < new Date();
      })
    };

    // Calculate weighted average interest rate
    const totalInterestBearingAmount = debts
      // @ts-ignore
      .filter((/** @type {{ interestRate: string; }} */ d) => parseFloat(d.interestRate) > 0)
      .reduce((/** @type {number} */ sum, /** @type {{ amount: any; }} */ d) => sum + parseFloat(d.amount || 0), 0);
    
    const weightedInterest = debts
      // @ts-ignore
      .filter((/** @type {{ interestRate: string; }} */ d) => parseFloat(d.interestRate) > 0)
      // @ts-ignore
      .reduce((/** @type {number} */ sum, /** @type {{ amount: any; interestRate: string; }} */ d) => 
        sum + (parseFloat(d.amount || 0) * parseFloat(d.interestRate) / 100), 0
      );
    
    // @ts-ignore
    summary.averageInterestRate = totalInterestBearingAmount > 0 
      // @ts-ignore
      ? (weightedInterest / totalInterestBearingAmount) * 100 
      : 0;

    return {
      status: true,
      message: 'Worker debt summary retrieved successfully',
      data: {
        debts,
        summary,
        counts: {
          activeDebts: summary.byStatus.pending + summary.byStatus.partially_paid,
          completedDebts: summary.byStatus.paid + summary.byStatus.cancelled,
          overdueCount: summary.overdueDebts.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getWorkerDebtSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker debt summary: ${error.message}`,
      data: null
    };
  }
};