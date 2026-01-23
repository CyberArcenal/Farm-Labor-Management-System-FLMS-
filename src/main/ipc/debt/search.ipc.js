// src/ipc/debt/search.ipc
//@ts-check

const { AppDataSource } = require("../../db/dataSource");

module.exports = async (/** @type {any} */ searchQuery, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .where("debt.reason LIKE :query", { query: `%${searchQuery}%` })
      .orWhere("debt.notes LIKE :query", { query: `%${searchQuery}%` })
      .orWhere("worker.name LIKE :query", { query: `%${searchQuery}%` })
      .orWhere("worker.contact LIKE :query", { query: `%${searchQuery}%` })
      .orderBy("debt.dateIncurred", "DESC")
      .limit(50); // Limit results for performance

    const debts = await query.getMany();

    return {
      status: true,
      message: "Debts search completed",
      data: debts
    };
  } catch (error) {
    console.error("Error searching debts:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};