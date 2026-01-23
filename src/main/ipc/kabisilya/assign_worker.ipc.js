// src/ipc/kabisilya/assign_worker.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");

/**
 * Assign worker to Kabisilya
 * @param {Object} params - Assignment parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      workerId, 
      // @ts-ignore
      kabisilyaId,
      // @ts-ignore
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!workerId || !kabisilyaId) {
      return {
        status: false,
        message: "Missing required fields: workerId and kabisilyaId are required",
        data: null
      };
    }

    const workerRepo = queryRunner.manager.getRepository(Worker);
    
    // Find worker
    const worker = await workerRepo.findOne({
      where: { id: workerId },
      relations: ["kabisilya"]
    });

    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null
      };
    }

    // Check if already assigned to same kabisilya
    // @ts-ignore
    if (worker.kabisilya && worker.kabisilya.id === kabisilyaId) {
      return {
        status: false,
        message: "Worker is already assigned to this Kabisilya",
        data: null
      };
    }

    // Update worker's kabisilya
    // @ts-ignore
    worker.kabisilya = kabisilyaId;
    worker.updatedAt = new Date();

    const updatedWorker = await workerRepo.save(worker);

    return {
      status: true,
      message: "Worker assigned to Kabisilya successfully",
      data: {
        workerId: updatedWorker.id,
        workerName: updatedWorker.name,
        kabisilyaId: kabisilyaId
      }
    };

  } catch (error) {
    console.error("Error assigning worker to kabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign worker: ${error.message}`,
      data: null
    };
  }
};