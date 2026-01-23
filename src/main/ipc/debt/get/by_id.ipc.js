// src/ipc/debt/get/by_id.ipc
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (/** @type {any} */ debtId, /** @type {any} */ userId) => {
  try {
    const debtRepository = AppDataSource.getRepository("Debt");
    
    const debt = await debtRepository.findOne({
      where: { id: debtId },
      relations: ["worker", "history", "history.payment"]
    });

    if (!debt) {
      return {
        status: false,
        message: "Debt not found",
        data: null
      };
    }

    return {
      status: true,
      message: "Debt retrieved successfully",
      data: debt
    };
  } catch (error) {
    console.error("Error getting debt by ID:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};