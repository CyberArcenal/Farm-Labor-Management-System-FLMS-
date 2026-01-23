// ipc/bukid/update.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");


module.exports = async function updateBukid(params = {}, queryRunner = null) {
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
    const { id, name, location, kabisilyaId, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Bukid ID is required',
        data: null
      };
    }

    // Find existing bukid
    // @ts-ignore
    const bukid = await queryRunner.manager.findOne(Bukid, {
      where: { id }
    });

    if (!bukid) {
      return {
        status: false,
        message: 'Bukid not found',
        data: null
      };
    }

    // Update fields
    const updates = {};
    if (name) {
      // @ts-ignore
      updates.name = name;
    }
    if (location !== undefined) {
      // @ts-ignore
      updates.location = location;
    }
    if (kabisilyaId !== undefined) {
      // @ts-ignore
      updates.kabisilya = kabisilyaId ? { id: kabisilyaId } : null;
    }
    updates.updatedAt = new Date();

    // @ts-ignore
    await queryRunner.manager.update(Bukid, id, updates);
    
    // Get updated bukid
    // @ts-ignore
    const updatedBukid = await queryRunner.manager.findOne(Bukid, {
      where: { id },
      relations: ['kabisilya']
    });

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_bukid',
      description: `Updated bukid ID: ${id}`,
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
      message: 'Bukid updated successfully',
      data: { bukid: updatedBukid }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateBukid:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update bukid: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};