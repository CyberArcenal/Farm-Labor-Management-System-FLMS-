// src/ipc/debt/update_status.ipc.js
//@ts-check

module.exports = async (/** @type {{ id: any; status: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { id, status } = params;
    
    const debtRepository = queryRunner.manager.getRepository("Debt");

    const debt = await debtRepository.findOne({ where: { id } });

    if (!debt) {
      return {
        status: false,
        message: "Debt not found",
        data: null
      };
    }

    const oldStatus = debt.status;
    debt.status = status;
    debt.updatedAt = new Date();

    const updatedDebt = await debtRepository.save(debt);

    return {
      status: true,
      message: `Debt status updated from '${oldStatus}' to '${status}'`,
      data: updatedDebt
    };
  } catch (error) {
    console.error("Error updating debt status:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};