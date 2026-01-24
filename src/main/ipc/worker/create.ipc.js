// ipc/worker/create.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function createWorker(params = {}, queryRunner = null) {
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
    const { name, contact, email, address, status, hireDate, kabisilyaId, _userId } = params;
    
    if (!name) {
      return {
        status: false,
        message: 'Worker name is required',
        data: null
      };
    }

    // Check if worker with same email already exists
    if (email) {
      // @ts-ignore
      const existingWorker = await queryRunner.manager.findOne(Worker, {
        where: { email }
      });

      if (existingWorker) {
        return {
          status: false,
          message: 'Worker with this email already exists',
          data: null
        };
      }
    }

    // Create new worker
    // @ts-ignore
    const worker = queryRunner.manager.create(Worker, {
      name,
      contact: contact || null,
      email: email || null,
      address: address || null,
      status: status || 'active',
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      kabisilya: kabisilyaId ? { id: kabisilyaId } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // @ts-ignore
    const savedWorker = await queryRunner.manager.save(worker);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'create_worker',
      description: `Created worker: ${name}`,
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
      message: 'Worker created successfully',
      data: { worker: savedWorker }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in createWorker:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create worker: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};