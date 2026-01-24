// ipc/worker/get/all.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAllWorkers(params = {}) {
  try {
    const { 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      sortBy = 'id', 
      // @ts-ignore
      sortOrder = 'ASC',
      // @ts-ignore
      _userId 
    } = params;

    const workerRepository = AppDataSource.getRepository(Worker);

    const [workers, total] = await workerRepository.findAndCount({
      relations: ['kabisilya'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
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
    console.error('Error in getAllWorkers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve workers: ${error.message}`,
      data: null
    };
  }
};