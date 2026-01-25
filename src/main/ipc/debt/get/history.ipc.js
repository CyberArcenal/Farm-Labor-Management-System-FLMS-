// src/ipc/debt/get/history.ipc
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (debtId, userId) => {
  try {
    const debtHistoryRepository = AppDataSource.getRepository("DebtHistory");
    
    const history = await debtHistoryRepository.find({
      where: { debt: { id: debtId } },
      relations: ["debt", "payment"],
      order: { transactionDate: "DESC" }
    });

    return {
      status: true,
      message: "Debt history retrieved successfully",
      data: history
    };
  } catch (error) {
    console.error("Error getting debt history:", error);
    return {
      status: false,
      message: error.message,
      data: null
    };
  }
};