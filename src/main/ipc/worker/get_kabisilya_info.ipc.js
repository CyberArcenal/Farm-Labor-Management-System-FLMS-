// ipc/worker/get_kabisilya_info.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
// @ts-ignore
const Payment = require("../../../entities/Payment");
// @ts-ignore
const Debt = require("../../../entities/Debt");
// @ts-ignore
const Assignment = require("../../../entities/Assignment");
const Kabisilya = require("../../../entities/Kabisilya");

module.exports = async function getKabisilyaInfo(params = {}) {
  try {
    // @ts-ignore
    const { workerId, _userId } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const worker = await workerRepository.findOne({
      where: { id: parseInt(workerId) },
      relations: ['kabisilya']
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    if (!worker.kabisilya) {
      return {
        status: true,
        message: 'Worker is not assigned to any kabisilya',
        data: { hasKabisilya: false }
      };
    }

    // Get additional kabisilya info with related data
    const kabisilyaRepository = AppDataSource.getRepository(Kabisilya);
    const kabisilya = await kabisilyaRepository.findOne({
      where: { id: worker.kabisilya.id },
      relations: ['workers', 'bukids']
    });

    if (!kabisilya) {
      return {
        status: true,
        message: 'Kabisilya not found (may have been deleted)',
        data: { 
          hasKabisilya: false,
          kabisilya: null 
        }
      };
    }

    // Get worker count for this kabisilya
    const workerCount = kabisilya.workers.length;
    
    // Get bukid count
    const bukidCount = kabisilya.bukids.length;

    // Get other workers in the same kabisilya (excluding current worker)
    const otherWorkers = kabisilya.workers
      // @ts-ignore
      .filter(w => w.id !== parseInt(workerId))
      // @ts-ignore
      .map(w => ({ id: w.id, name: w.name, status: w.status }));

    return {
      status: true,
      message: 'Kabisilya information retrieved successfully',
      data: {
        hasKabisilya: true,
        kabisilya: {
          id: kabisilya.id,
          name: kabisilya.name,
          createdAt: kabisilya.createdAt
        },
        stats: {
          totalWorkers: workerCount,
          totalBukids: bukidCount,
          otherWorkersCount: otherWorkers.length
        },
        otherWorkers,
        assignmentDate: worker.hireDate // Or you might want to track when they were assigned
      }
    };
  } catch (error) {
    console.error('Error in getKabisilyaInfo:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve kabisilya information: ${error.message}`,
      data: null
    };
  }
};