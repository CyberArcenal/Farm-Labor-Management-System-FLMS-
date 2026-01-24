// ipc/worker/update_contact.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateWorkerContact(params = {}, queryRunner = null) {
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
    const { id, contact, email, address, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    // At least one contact field should be provided
    if (!contact && !email && !address) {
      return {
        status: false,
        message: 'At least one contact field (contact, email, or address) must be provided',
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

    // Store old values for logging
    const oldValues = {
      contact: existingWorker.contact,
      email: existingWorker.email,
      address: existingWorker.address
    };

    // Update contact information
    if (contact !== undefined) existingWorker.contact = contact;
    if (email !== undefined) existingWorker.email = email;
    if (address !== undefined) existingWorker.address = address;
    existingWorker.updatedAt = new Date();

    // @ts-ignore
    const updatedWorker = await queryRunner.manager.save(existingWorker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_worker_contact',
      description: `Updated contact information for worker: ${existingWorker.name}`,
      details: JSON.stringify({ 
        workerId: id,
        oldValues,
        newValues: {
          contact: updatedWorker.contact,
          email: updatedWorker.email,
          address: updatedWorker.address
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
      message: 'Worker contact information updated successfully',
      data: { worker: updatedWorker }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateWorkerContact:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update worker contact: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};