// src/ipc/debt/get/by_worker.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ workerId, filters = {}, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .leftJoinAndSelect("debt.history", "history")
      .where("debt.worker_id = :workerId", { workerId })
      .orderBy("debt.dateIncurred", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      query.andWhere("debt.status = :status", { status: filters.status });
    }

    // @ts-ignore
    if (filters.date_from && filters.date_to) {
      query.andWhere("debt.dateIncurred BETWEEN :date_from AND :date_to", {
        // @ts-ignore
        date_from: filters.date_from,
        // @ts-ignore
        date_to: filters.date_to
      });
    }

    // @ts-ignore
    if (filters.only_active === true) {
      query.andWhere("debt.balance > 0");
    }

    const debts = await query.getMany();

    // Calculate totals
    const totals = {
      totalDebt: debts.reduce((/** @type {number} */ sum, /** @type {{ amount: string; }} */ debt) => sum + parseFloat(debt.amount), 0),
      totalBalance: debts.reduce((/** @type {number} */ sum, /** @type {{ balance: string; }} */ debt) => sum + parseFloat(debt.balance), 0),
      totalPaid: debts.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: string; }} */ debt) => sum + parseFloat(debt.totalPaid), 0),
      count: debts.length
    };

    return {
      status: true,
      message: "Worker debts retrieved successfully",
      data: {
        debts,
        totals
      }
    };
  } catch (error) {
    console.error("Error getting debts by worker:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};