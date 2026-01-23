// src/ipc/debt/get/report.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (dateRange = {}, filters = {}, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    // @ts-ignore
    const { startDate, endDate } = dateRange;
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1); // Last month
    
    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || new Date();

    // Base query
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .leftJoinAndSelect("debt.history", "history")
      .where("debt.dateIncurred BETWEEN :startDate AND :endDate", {
        startDate: queryStartDate,
        endDate: queryEndDate
      });

    // Apply additional filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      query.andWhere("debt.status = :status", { status: filters.status });
    }

    // @ts-ignore
    if (filters.worker_id) {
      // @ts-ignore
      query.andWhere("debt.worker_id = :worker_id", { worker_id: filters.worker_id });
    }

    query.orderBy("debt.dateIncurred", "DESC");

    const debts = await query.getMany();

    // Generate report summary
    const summary = {
      totalDebts: debts.length,
      totalAmount: debts.reduce((/** @type {number} */ sum, /** @type {{ amount: string; }} */ debt) => sum + parseFloat(debt.amount), 0),
      totalBalance: debts.reduce((/** @type {number} */ sum, /** @type {{ balance: string; }} */ debt) => sum + parseFloat(debt.balance), 0),
      totalPaid: debts.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: string; }} */ debt) => sum + parseFloat(debt.totalPaid), 0),
      totalInterest: debts.reduce((/** @type {number} */ sum, /** @type {{ totalInterest: string; }} */ debt) => sum + parseFloat(debt.totalInterest), 0),
      
      // Group by status
      byStatus: debts.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ status: string | number; balance: string; }} */ debt) => {
        if (!acc[debt.status]) acc[debt.status] = 0;
        acc[debt.status] += parseFloat(debt.balance);
        return acc;
      }, {}),
      
      // Group by worker
      byWorker: debts.reduce((/** @type {{ [x: string]: { count: number; }; }} */ acc, /** @type {{ worker: { id: string | number; name: any; }; amount: string; balance: string; }} */ debt) => {
        if (!acc[debt.worker.id]) {
          acc[debt.worker.id] = {
            // @ts-ignore
            workerName: debt.worker.name,
            totalDebt: 0,
            totalBalance: 0,
            count: 0
          };
        }
        // @ts-ignore
        acc[debt.worker.id].totalDebt += parseFloat(debt.amount);
        // @ts-ignore
        acc[debt.worker.id].totalBalance += parseFloat(debt.balance);
        acc[debt.worker.id].count++;
        return acc;
      }, {})
    };

    return {
      status: true,
      message: "Debt report generated successfully",
      data: {
        debts,
        summary,
        dateRange: {
          startDate: queryStartDate,
          endDate: queryEndDate
        }
      }
    };
  } catch (error) {
    console.error("Error generating debt report:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};