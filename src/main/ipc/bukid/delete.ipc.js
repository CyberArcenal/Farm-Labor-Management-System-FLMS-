// ipc/bukid/delete.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");


module.exports = async function deleteBukid(params = {}, queryRunner = null) {
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
    const { id, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Bukid ID is required',
        data: null
      };
    }

    // Find existing bukid with relations to check dependencies
    // @ts-ignore
    const bukid = await queryRunner.manager.findOne(Bukid, {
      where: { id },
      relations: ['pitaks']
    });

    if (!bukid) {
      return {
        status: false,
        message: 'Bukid not found',
        data: null
      };
    }

    // Check if bukid has pitaks
    if (bukid.pitaks && bukid.pitaks.length > 0) {
      return {
        status: false,
        message: 'Cannot delete bukid with existing pitaks. Remove pitaks first.',
        data: null
      };
    }

    // Delete bukid
    // @ts-ignore
    await queryRunner.manager.delete(Bukid, id);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'delete_bukid',
      description: `Deleted bukid ID: ${id}`,
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
      message: 'Bukid deleted successfully',
      data: { id }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in deleteBukid:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete bukid: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};