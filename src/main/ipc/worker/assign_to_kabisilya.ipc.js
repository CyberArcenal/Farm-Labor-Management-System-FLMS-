// ipc/worker/assign_to_kabisilya.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function assignToKabisilya(params = {}, queryRunner = null) {
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
    const { workerId, kabisilyaId, _userId } = params;
    
    if (!workerId || !kabisilyaId) {
      return {
        status: false,
        message: 'Worker ID and Kabisilya ID are required',
        data: null
      };
    }

    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    const existingWorker = await workerRepository.findOne({
      where: { id: parseInt(workerId) }
    });

    if (!existingWorker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Check if kabisilya exists (optional, depends on your validation needs)
    // @ts-ignore
    const kabisilyaRepository = queryRunner.manager.getRepository("Kabisilya");
    const kabisilya = await kabisilyaRepository.findOne({
      where: { id: parseInt(kabisilyaId) }
    });

    if (!kabisilya) {
      return {
        status: false,
        message: 'Kabisilya not found',
        data: null
      };
    }

    // Store old kabisilya for logging
    const oldKabisilyaId = existingWorker.kabisilya ? existingWorker.kabisilya.id : null;
    const oldKabisilyaName = existingWorker.kabisilya ? existingWorker.kabisilya.name : null;

    // Assign to kabisilya
    existingWorker.kabisilya = { id: parseInt(kabisilyaId) };
    existingWorker.updatedAt = new Date();

    // @ts-ignore
    const updatedWorker = await queryRunner.manager.save(existingWorker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'assign_worker_to_kabisilya',
      description: `Assigned worker ${existingWorker.name} to kabisilya ${kabisilya.name}`,
      details: JSON.stringify({ 
        workerId,
        workerName: existingWorker.name,
        oldKabisilyaId,
        oldKabisilyaName,
        newKabisilyaId: kabisilyaId,
        newKabisilyaName: kabisilya.name
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
      message: `Worker assigned to kabisilya ${kabisilya.name} successfully`,
      data: { 
        worker: updatedWorker,
        kabisilya: kabisilya,
        assignment: {
          oldKabisilya: oldKabisilyaName,
          newKabisilya: kabisilya.name
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in assignToKabisilya:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign worker to kabisilya: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};