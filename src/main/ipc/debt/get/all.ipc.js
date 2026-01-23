// src/ipc/debt/get/all.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .leftJoinAndSelect("debt.history", "history")
      .orderBy("debt.dateIncurred", "DESC");

    // Apply filters
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

    // @ts-ignore
    if (filters.date_from && filters.date_to) {
      query.andWhere("debt.dateIncurred BETWEEN :date_from AND :date_to", {
        // @ts-ignore
        date_from: filters.date_from,
        // @ts-ignore
        date_to: filters.date_to
      });
    }

    const debts = await query.getMany();

    return {
      status: true,
      message: "Debts retrieved successfully",
      data: debts
    };
  } catch (error) {
    console.error("Error getting all debts:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};