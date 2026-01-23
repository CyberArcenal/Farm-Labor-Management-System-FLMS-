// src/ipc/kabisilya/get/workers.ipc.js
//@ts-check

const Kabisilya = require("../../../../entities/Kabisilya");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get all workers assigned to a Kabisilya
 * @param {number} kabisilyaId - Kabisilya ID
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
module.exports = async (kabisilyaId, userId) => {
  try {
    if (!kabisilyaId) {
      return {
        status: false,
        message: "Kabisilya ID is required",
        data: null
      };
    }

    const kabisilyaRepo = AppDataSource.getRepository(Kabisilya);
    
    const kabisilya = await kabisilyaRepo.findOne({
      where: { id: kabisilyaId },
      relations: ["workers", "workers.debts", "workers.assignments"]
    });

    if (!kabisilya) {
      return {
        status: false,
        message: "Kabisilya not found",
        data: null
      };
    }

    // Calculate additional stats for each worker
    const workersWithStats = kabisilya.workers ? kabisilya.workers.map((/** @type {{ debts: any[]; assignments: { filter: (arg0: (a: any) => boolean) => { (): any; new (): any; length: any; }; }; id: any; name: any; contact: any; email: any; status: any; hireDate: any; currentBalance: any; createdAt: any; }} */ worker) => {
      const totalDebt = worker.debts 
        ? worker.debts.reduce((/** @type {number} */ sum, /** @type {{ balance: string; }} */ debt) => sum + parseFloat(debt.balance), 0)
        : 0;
      
      const activeAssignments = worker.assignments 
        ? worker.assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'active').length
        : 0;

      return {
        id: worker.id,
        name: worker.name,
        contact: worker.contact,
        email: worker.email,
        status: worker.status,
        hireDate: worker.hireDate,
        totalDebt,
        currentBalance: worker.currentBalance,
        activeAssignments,
        createdAt: worker.createdAt
      };
    }) : [];

    return {
      status: true,
      message: "Workers retrieved successfully",
      data: {
        kabisilyaId: kabisilya.id,
        kabisilyaName: kabisilya.name,
        workerCount: workersWithStats.length,
        workers: workersWithStats
      }
    };

  } catch (error) {
    console.error("Error getting kabisilya workers:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get workers: ${error.message}`,
      data: null
    };
  }
};