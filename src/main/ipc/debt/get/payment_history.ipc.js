//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (/** @type {any} */ debtId, /** @type {any} */ userId) => {
  try {
    const debtHistoryRepository = AppDataSource.getRepository("DebtHistory");
    
    const paymentHistory = await debtHistoryRepository.find({
      where: { 
        debt: { id: debtId },
        transactionType: "payment"
      },
      order: { transactionDate: "DESC" }
    });

    return {
      status: true,
      message: "Payment history retrieved successfully",
      data: paymentHistory
    };
  } catch (error) {
    console.error("Error getting payment history:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};