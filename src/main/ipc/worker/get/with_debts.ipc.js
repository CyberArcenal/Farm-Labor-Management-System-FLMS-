// ipc/worker/get/with_debts.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerWithDebts(params = {}) {
  try {
    // @ts-ignore
    // @ts-ignore
    const { id, _userId } = params;

    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const worker = await workerRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['debts', 'debts.history'] // removed kabisilya
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Calculate total active debt
    // @ts-ignore
    const activeDebts = worker.debts.filter((/** @type {{ status: string; }} */ debt) =>
      debt.status === 'pending' || debt.status === 'partially_paid'
    );
    
    const totalActiveDebt = activeDebts.reduce(
      (/** @type {number} */ sum, /** @type {{ balance: string; }} */ debt) => sum + parseFloat(debt.balance), 
      0
    );

    return {
      status: true,
      message: 'Worker with debts retrieved successfully',
      data: { 
        worker,
        debtSummary: {
          // @ts-ignore
          totalDebts: worker.debts.length,
          activeDebts: activeDebts.length,
          totalActiveDebt,
          // @ts-ignore
          paidDebts: worker.debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'paid').length
        }
      }
    };
  } catch (error) {
    console.error('Error in getWorkerWithDebts:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker debts: ${error.message}`,
      data: null
    };
  }
};