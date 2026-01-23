// src/ipc/debt/get/overdue.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    const today = new Date();
    
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .where("debt.balance > 0")
      .andWhere("debt.dueDate < :today", { today })
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

    const debts = await query.getMany();

    // Calculate overdue days for each debt
    // @ts-ignore
    const debtsWithOverdueDays = debts.map(debt => {
      const dueDate = new Date(debt.dueDate);
      // @ts-ignore
      const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return {
        ...debt,
        overdueDays: overdueDays > 0 ? overdueDays : 0
      };
    });

    return {
      status: true,
      message: "Overdue debts retrieved successfully",
      data: debtsWithOverdueDays
    };
  } catch (error) {
    console.error("Error getting overdue debts:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};