// ipc/worker/update_status.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateWorkerStatus(params = {}, queryRunner = null) {
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
    const { id, status, notes, _userId } = params;
    
    if (!id || !status) {
      return {
        status: false,
        message: 'Worker ID and status are required',
        data: null
      };
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'on-leave', 'terminated'];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    const existingWorker = await workerRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!existingWorker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Store old status for logging
    const oldStatus = existingWorker.status;
    
    // Update worker status
    existingWorker.status = status;
    existingWorker.updatedAt = new Date();
    
    // Add notes if provided
    if (notes) {
      // You might want to store status change notes separately
      // For now, we'll just update the worker
    }

    // @ts-ignore
    const updatedWorker = await queryRunner.manager.save(existingWorker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_worker_status',
      description: `Updated worker status: ${existingWorker.name} from ${oldStatus} to ${status}`,
      details: JSON.stringify({ 
        workerId: id, 
        oldStatus, 
        newStatus: status,
        notes: notes || null
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
      message: 'Worker status updated successfully',
      data: { 
        worker: updatedWorker,
        change: {
          oldStatus,
          newStatus: status
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateWorkerStatus:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update worker status: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};