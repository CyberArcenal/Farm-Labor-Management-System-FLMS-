// ipc/worker/update.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateWorker(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
    // @ts-ignore
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { id, name, contact, email, address, status, hireDate, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
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

    // Check if email is being changed and if it's already taken
    if (email && email !== existingWorker.email) {
      const emailExists = await workerRepository.findOne({ where: { email } });
      if (emailExists) {
        return {
          status: false,
          message: 'Worker with this email already exists',
          data: null
        };
      }
    }

    // Update worker
    existingWorker.name = name || existingWorker.name;
    existingWorker.contact = contact !== undefined ? contact : existingWorker.contact;
    existingWorker.email = email !== undefined ? email : existingWorker.email;
    existingWorker.address = address !== undefined ? address : existingWorker.address;
    existingWorker.status = status || existingWorker.status;
    existingWorker.hireDate = hireDate ? new Date(hireDate) : existingWorker.hireDate;
    existingWorker.updatedAt = new Date();

    // @ts-ignore
    const updatedWorker = await queryRunner.manager.save(existingWorker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_worker',
      description: `Updated worker: ${existingWorker.name} (ID: ${id})`,
      ip_address: "127.0.0.1",
      user_agent: "Worker-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: 'Worker updated successfully',
      data: { worker: updatedWorker }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateWorker:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update worker: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};