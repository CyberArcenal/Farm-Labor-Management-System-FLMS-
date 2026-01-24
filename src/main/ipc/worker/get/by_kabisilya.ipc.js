// ipc/worker/get/by_kabisilya.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerByKabisilya(params = {}) {
  try {
    // @ts-ignore
    const { kabisilyaId, status = 'active', _userId } = params;

    if (!kabisilyaId) {
      return {
        status: false,
        message: 'Kabisilya ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const whereClause = {
      kabisilya: { id: parseInt(kabisilyaId) }
    };

    if (status) {
      // @ts-ignore
      whereClause.status = status;
    }

    const workers = await workerRepository.find({
      where: whereClause,
      relations: ['kabisilya'],
      order: { name: 'ASC' }
    });

    return {
      status: true,
      message: 'Workers retrieved successfully',
      data: { workers }
    };
  } catch (error) {
    console.error('Error in getWorkerByKabisilya:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve workers: ${error.message}`,
      data: null
    };
  }
};