// ipc/worker/get/by_status.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerByStatus(params = {}) {
  try {
    // @ts-ignore
    const { status, page = 1, limit = 50, _userId } = params;

    if (!status) {
      return {
        status: false,
        message: 'Status is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const [workers, total] = await workerRepository.findAndCount({
      where: { status },
      relations: ['kabisilya'],
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' }
    });

    return {
      status: true,
      message: 'Workers retrieved successfully',
      data: {
        workers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getWorkerByStatus:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve workers: ${error.message}`,
      data: null
    };
  }
};