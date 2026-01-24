// ipc/worker/get/by_id.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerById(params = {}) {
  try {
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
      relations: ['kabisilya', 'debts', 'payments', 'assignments']
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    return {
      status: true,
      message: 'Worker retrieved successfully',
      data: { worker }
    };
  } catch (error) {
    console.error('Error in getWorkerById:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker: ${error.message}`,
      data: null
    };
  }
};