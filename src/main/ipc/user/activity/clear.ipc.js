// ipc/user/activity/clear.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function clearUserActivity(params = {}, queryRunner = null) {
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
    const { userId, olderThanDays, _userId } = params;
    
    if (!userId) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    // @ts-ignore
    const activityRepository = queryRunner.manager.getRepository(UserActivity);
    
    let deletedCount = 0;
    
    if (olderThanDays) {
      // Delete activities older than specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
      
      const result = await activityRepository
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId: parseInt(userId) })
        .andWhere('created_at < :cutoffDate', { cutoffDate })
        .execute();
      
      deletedCount = result.affected || 0;
    } else {
      // Delete all activities for the user
      const result = await activityRepository
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId: parseInt(userId) })
        .execute();
      
      deletedCount = result.affected || 0;
    }

    // Log the clearing activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'clear_user_activity',
      description: `Cleared ${deletedCount} activity records for user ID: ${userId}`,
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
      message: `Cleared ${deletedCount} activity records`,
      data: { deletedCount }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in clearUserActivity:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to clear user activity: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};