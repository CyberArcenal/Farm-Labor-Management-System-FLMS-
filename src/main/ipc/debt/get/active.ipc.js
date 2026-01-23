// src/ipc/debt/get/active.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (filters = {}, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .where("debt.balance > 0")
      .andWhere("debt.status NOT IN (:...statuses)", { 
        statuses: ["paid", "cancelled"] 
      })
      .orderBy("debt.dueDate", "ASC");

    // Apply additional filters
    // @ts-ignore
    if (filters.worker_id) {
      // @ts-ignore
      query.andWhere("debt.worker_id = :worker_id", { worker_id: filters.worker_id });
    }

    // @ts-ignore
    if (filters.due_soon === true) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.andWhere("debt.dueDate <= :dueDate", { dueDate: tomorrow });
    }

    const debts = await query.getMany();

    return {
      status: true,
      message: "Active debts retrieved successfully",
      data: debts
    };
  } catch (error) {
    console.error("Error getting active debts:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};