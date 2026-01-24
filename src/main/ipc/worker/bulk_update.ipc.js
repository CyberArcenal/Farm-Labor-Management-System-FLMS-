// ipc/worker/bulk_update.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkUpdateWorkers(params = {}, queryRunner = null) {
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
    const { updates, _userId } = params;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return {
        status: false,
        message: 'Updates array is required and must not be empty',
        data: null
      };
    }

    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    
    const results = {
      updated: [],
      notFound: [],
      failed: [],
      errors: []
    };

    const currentDate = new Date();

    // Process updates sequentially to handle dependencies
    for (const update of updates) {
      const { id, ...updateData } = update;
      
      if (!id) {
        // @ts-ignore
        results.errors.push(`Missing worker ID for update: ${JSON.stringify(updateData)}`);
        continue;
      }

      try {
        // Find worker
        const worker = await workerRepository.findOne({
          where: { id: parseInt(id) }
        });

        if (!worker) {
          // @ts-ignore
          results.notFound.push(id);
          continue;
        }

        // Validate email uniqueness if email is being updated
        if (updateData.email && updateData.email !== worker.email) {
          const emailExists = await workerRepository.findOne({
            where: { email: updateData.email }
          });
          
          if (emailExists) {
            // @ts-ignore
            results.errors.push(`Worker ID ${id}: Email ${updateData.email} already exists`);
            continue;
          }
        }

        // Update worker fields
        if (updateData.name !== undefined) worker.name = updateData.name;
        if (updateData.contact !== undefined) worker.contact = updateData.contact;
        if (updateData.email !== undefined) worker.email = updateData.email;
        if (updateData.address !== undefined) worker.address = updateData.address;
        if (updateData.status !== undefined) worker.status = updateData.status;
        if (updateData.hireDate !== undefined) worker.hireDate = new Date(updateData.hireDate);
        
        if (updateData.kabisilyaId !== undefined) {
          worker.kabisilya = updateData.kabisilyaId ? { id: updateData.kabisilyaId } : null;
        }
        
        if (updateData.totalDebt !== undefined) worker.totalDebt = updateData.totalDebt;
        if (updateData.totalPaid !== undefined) worker.totalPaid = updateData.totalPaid;
        if (updateData.currentBalance !== undefined) worker.currentBalance = updateData.currentBalance;
        
        worker.updatedAt = currentDate;

        // @ts-ignore
        const updatedWorker = await queryRunner.manager.save(worker);
        // @ts-ignore
        results.updated.push({
          id: updatedWorker.id,
          name: updatedWorker.name
        });

      } catch (error) {
        // @ts-ignore
        results.failed.push({
          id,
          // @ts-ignore
          error: error.message
        });
        console.error(`Failed to update worker ${id}:`, error);
      }
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'bulk_update_workers',
      description: `Bulk updated ${results.updated.length} workers`,
      details: JSON.stringify({
        totalRequested: updates.length,
        updated: results.updated.length,
        notFound: results.notFound.length,
        failed: results.failed.length,
        errors: results.errors.length
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
      message: `Bulk update completed: ${results.updated.length} updated, ${results.notFound.length} not found, ${results.failed.length} failed`,
      data: { results }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkUpdateWorkers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk update workers: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};