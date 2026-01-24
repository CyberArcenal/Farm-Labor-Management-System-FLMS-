// ipc/worker/get/active.ipc.js (Optimized)
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
      includeKabisilya = true,
      // @ts-ignore
      includeStats = false,
      // @ts-ignore
      _userId 
    } = params;

    const workerRepository = AppDataSource.getRepository(Worker);

    const relations = [];
    if (includeKabisilya) {
      relations.push('kabisilya');
    }

    const [workers, total] = await workerRepository.findAndCount({
      where: { status: 'active' },
      relations,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate additional stats if requested
    /**
       * @type {{ byKabisilya: any; totalWorkers?: any; totalActive?: any; totalBalance?: any; totalDebt?: any; averageBalance?: number; averageDebt?: number; } | null}
       */
    let stats = null;
    if (includeStats) {
      stats = {
        totalWorkers: total,
        totalActive: total,
        totalBalance: workers.reduce((/** @type {number} */ sum, /** @type {{ currentBalance: any; }} */ worker) => 
          sum + parseFloat(worker.currentBalance || 0), 0
        ),
        totalDebt: workers.reduce((/** @type {number} */ sum, /** @type {{ totalDebt: any; }} */ worker) => 
          sum + parseFloat(worker.totalDebt || 0), 0
        ),
        byKabisilya: {},
        averageBalance: total > 0 ? 
          workers.reduce((/** @type {number} */ sum, /** @type {{ currentBalance: any; }} */ worker) => sum + parseFloat(worker.currentBalance || 0), 0) / total : 0,
        averageDebt: total > 0 ? 
          workers.reduce((/** @type {number} */ sum, /** @type {{ totalDebt: any; }} */ worker) => sum + parseFloat(worker.totalDebt || 0), 0) / total : 0
      };

      // Group by kabisilya
      workers.forEach((/** @type {{ kabisilya: { name: string; }; currentBalance: any; totalDebt: any; }} */ worker) => {
        const kabisilyaName = worker.kabisilya?.name || 'Unassigned';
        // @ts-ignore
        if (!stats.byKabisilya[kabisilyaName]) {
          // @ts-ignore
          stats.byKabisilya[kabisilyaName] = {
            count: 0,
            totalBalance: 0,
            totalDebt: 0
          };
        }
        // @ts-ignore
        stats.byKabisilya[kabisilyaName].count++;
        // @ts-ignore
        stats.byKabisilya[kabisilyaName].totalBalance += parseFloat(worker.currentBalance || 0);
        // @ts-ignore
        stats.byKabisilya[kabisilyaName].totalDebt += parseFloat(worker.totalDebt || 0);
      });
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