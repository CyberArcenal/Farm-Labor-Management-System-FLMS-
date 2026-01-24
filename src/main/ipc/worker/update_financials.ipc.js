// ipc/worker/update_financials.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateWorkerFinancials(params = {}, queryRunner = null) {
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
    const { id, totalDebt, totalPaid, currentBalance, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    // At least one financial field should be provided
    if (totalDebt === undefined && totalPaid === undefined && currentBalance === undefined) {
      return {
        status: false,
        message: 'At least one financial field must be provided',
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

    // Store old values for logging
    const oldValues = {
      totalDebt: existingWorker.totalDebt,
      totalPaid: existingWorker.totalPaid,
      currentBalance: existingWorker.currentBalance
    };

    // Update financial information
    if (totalDebt !== undefined) existingWorker.totalDebt = totalDebt;
    if (totalPaid !== undefined) existingWorker.totalPaid = totalPaid;
    if (currentBalance !== undefined) existingWorker.currentBalance = currentBalance;
    existingWorker.updatedAt = new Date();

    // @ts-ignore
    const updatedWorker = await queryRunner.manager.save(existingWorker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_worker_financials',
      description: `Updated financial information for worker: ${existingWorker.name}`,
      details: JSON.stringify({ 
        workerId: id,
        oldValues,
        newValues: {
          totalDebt: updatedWorker.totalDebt,
          totalPaid: updatedWorker.totalPaid,
          currentBalance: updatedWorker.currentBalance
        }
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
      message: 'Worker financial information updated successfully',
      data: { 
        worker: updatedWorker,
        changes: {
          oldValues,
          newValues: {
            totalDebt: updatedWorker.totalDebt,
            totalPaid: updatedWorker.totalPaid,
            currentBalance: updatedWorker.currentBalance
          }
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateWorkerFinancials:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update worker financials: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};