// ipc/bukid/get_worker_counts.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const Bukid = require("../../../entities/Bukid");

module.exports = async function getWorkerCounts(params = {}) {
  try {
    // @ts-ignore
    const { bukidId, _userId } = params;
    
    const bukidRepository = AppDataSource.getRepository(Bukid);

    let query = bukidRepository
      .createQueryBuilder('bukid')
      .leftJoin('bukid.pitaks', 'pitak')
      .leftJoin('pitak.assignments', 'assignment')
      .leftJoin('assignment.worker', 'worker')
      .select('bukid.id', 'id')
      .addSelect('bukid.name', 'name')
      .addSelect('COUNT(DISTINCT worker.id)', 'workerCount')
      .addSelect('COUNT(assignment.id)', 'assignmentCount')
      .groupBy('bukid.id');

    if (bukidId) {
      query = query.where('bukid.id = :bukidId', { bukidId });
    }

    const workerCounts = await query.getRawMany();

    return {
      status: true,
      message: 'Worker counts retrieved successfully',
      data: { 
        workerCounts: workerCounts.map((/** @type {{ workerCount: string; assignmentCount: string; }} */ item) => ({
          ...item,
          workerCount: parseInt(item.workerCount) || 0,
          assignmentCount: parseInt(item.assignmentCount) || 0
        }))
      }
    };
  } catch (error) {
    console.error('Error in getWorkerCounts:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get worker counts: ${error.message}`,
      data: null
    };
  }
};