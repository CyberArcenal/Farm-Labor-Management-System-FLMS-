//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (/** @type {any} */ workerId, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    const debts = await debtRepository.find({
      where: { worker: { id: workerId } },
      order: { dateIncurred: "DESC" }
    });

    const summary = {
      totalDebts: debts.length,
      totalAmount: debts.reduce((/** @type {number} */ sum, /** @type {{ amount: string; }} */ debt) => sum + parseFloat(debt.amount), 0),
      totalBalance: debts.reduce((/** @type {number} */ sum, /** @type {{ balance: string; }} */ debt) => sum + parseFloat(debt.balance), 0),
      totalPaid: debts.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: string; }} */ debt) => sum + parseFloat(debt.totalPaid), 0),
      totalInterest: debts.reduce((/** @type {number} */ sum, /** @type {{ totalInterest: string; }} */ debt) => sum + parseFloat(debt.totalInterest), 0),
      
      // Count by status
      byStatus: debts.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ status: string | number; }} */ debt) => {
        if (!acc[debt.status]) acc[debt.status] = 0;
        acc[debt.status]++;
        return acc;
      }, {})
    };

    return {
      status: true,
      message: "Worker debt summary retrieved successfully",
      data: {
        summary,
        recentDebts: debts.slice(0, 5) // Last 5 debts
      }
    };
  } catch (error) {
    console.error("Error getting worker debt summary:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};