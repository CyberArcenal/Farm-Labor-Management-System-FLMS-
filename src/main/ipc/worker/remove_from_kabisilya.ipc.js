// ipc/worker/remove_from_kabisilya.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function removeFromKabisilya(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

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

    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    const existingWorker = await workerRepository.findOne({
      where: { id: parseInt(workerId) },
      relations: ['kabisilya']
    });

    if (!existingWorker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Check if worker is already not assigned to any kabisilya
    if (!existingWorker.kabisilya) {
      return {
        status: false,
        message: 'Worker is not assigned to any kabisilya',
        data: null
      };
    }

    // Store old kabisilya for logging
    const oldKabisilyaId = existingWorker.kabisilya.id;
    const oldKabisilyaName = existingWorker.kabisilya.name;

    // Remove from kabisilya
    existingWorker.kabisilya = null;
    existingWorker.updatedAt = new Date();

    // @ts-ignore
    const updatedWorker = await queryRunner.manager.save(existingWorker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'remove_worker_from_kabisilya',
      description: `Removed worker ${existingWorker.name} from kabisilya ${oldKabisilyaName}`,
      details: JSON.stringify({ 
        workerId,
        workerName: existingWorker.name,
        oldKabisilyaId,
        oldKabisilyaName
      }),
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: `Worker removed from kabisilya ${oldKabisilyaName} successfully`,
      data: { 
        worker: updatedWorker,
        removal: {
          oldKabisilya: oldKabisilyaName
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in removeFromKabisilya:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to remove worker from kabisilya: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};