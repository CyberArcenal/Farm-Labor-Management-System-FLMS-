//@ts-check

module.exports = async (/** @type {{ debt_ids: any; status: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
  try {
    const { debt_ids, status } = params;

    if (!Array.isArray(debt_ids) || debt_ids.length === 0) {
      return {
        status: false,
        message: "Debt IDs array is required",
        data: null
      };
    }

    const debtRepository = queryRunner.manager.getRepository("Debt");
    
    // Update multiple debts
    await debtRepository
      .createQueryBuilder()
      .update()
      .set({ 
        status: status,
        updatedAt: new Date()
      })
      .where("id IN (:...ids)", { ids: debt_ids })
      .execute();

    // Fetch updated debts
    const updatedDebts = await debtRepository
      .createQueryBuilder("debt")
      .where("debt.id IN (:...ids)", { ids: debt_ids })
      .getMany();

    return {
      status: true,
      message: `Updated ${updatedDebts.length} debts to status '${status}'`,
      data: updatedDebts
    };
  } catch (error) {
    console.error("Error in bulk update status:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};