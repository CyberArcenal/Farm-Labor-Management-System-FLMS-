// ipc/worker/get/by_name.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerByName(params = {}) {
  try {
    // @ts-ignore
    const { name, _userId } = params;

    if (!name) {
      return {
        status: false,
        message: 'Worker name is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const workers = await workerRepository.find({
      where: { name }
      // removed kabisilya relation
    });

    return {
      status: true,
      message: 'Workers retrieved successfully',
      data: { workers }
    };
  } catch (error) {
    console.error('Error in getWorkerByName:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve workers: ${error.message}`,
      data: null
    };
  }
};