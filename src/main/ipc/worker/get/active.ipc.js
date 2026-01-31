// ipc/worker/get/active.ipc.js (Optimized, no kabisilya)
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getActiveWorkers(params = {}) {
  try {
    const { 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 100, 
      // @ts-ignore
      sortBy = 'name', 
      // @ts-ignore
      sortOrder = 'ASC',
      // @ts-ignore
      includeStats = false,
      // @ts-ignore
      // @ts-ignore
      _userId 
    } = params;

    const workerRepository = AppDataSource.getRepository(Worker);

    const [workers, total] = await workerRepository.findAndCount({
      where: { status: 'active' },
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate additional stats if requested
    /**
       * @type {{ totalWorkers?: any; totalActive?: any; totalBalance?: any; totalDebt?: any; averageBalance?: number; averageDebt?: number; } | null}
       */
    let stats = null;
    if (includeStats) {
      stats = {
        totalWorkers: total,
        totalActive: total,
        totalBalance: workers.reduce(
          // @ts-ignore
          (sum, worker) => sum + parseFloat(worker.currentBalance || 0), 
          0
        ),
        totalDebt: workers.reduce(
          // @ts-ignore
          (sum, worker) => sum + parseFloat(worker.totalDebt || 0), 
          0
        ),
        averageBalance: total > 0 
          // @ts-ignore
          ? workers.reduce((sum, worker) => sum + parseFloat(worker.currentBalance || 0), 0) / total 
          : 0,
        averageDebt: total > 0 
          // @ts-ignore
          ? workers.reduce((sum, worker) => sum + parseFloat(worker.totalDebt || 0), 0) / total 
          : 0
      };
    }

    return {
      status: true,
      message: 'Active workers retrieved successfully',
      data: {
        workers,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getActiveWorkers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve active workers: ${error.message}`,
      data: null
    };
  }
};