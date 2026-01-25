// ipc/notification/bulk_delete.ipc.js
//@ts-check

const Notification = require("../../../entities/Notification");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkDeleteNotifications(params = {}, queryRunner = null) {
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
    const { ids, olderThan, type, _userId } = params;
    
    // @ts-ignore
    const notificationRepo = queryRunner.manager.getRepository(Notification);
    
    let deleteQuery = notificationRepo.createQueryBuilder("notification");
    
    // Build conditions
    if (ids && ids.length > 0) {
      deleteQuery.where("notification.id IN (:...ids)", { ids });
    }
    
    if (olderThan) {
      const cutoffDate = new Date(olderThan);
      if (ids && ids.length > 0) {
        deleteQuery.andWhere("notification.timestamp < :cutoffDate", { cutoffDate });
      } else {
        deleteQuery.where("notification.timestamp < :cutoffDate", { cutoffDate });
      }
    }
    
    if (type) {
      if ((ids && ids.length > 0) || olderThan) {
        deleteQuery.andWhere("notification.type = :type", { type });
      } else {
        deleteQuery.where("notification.type = :type", { type });
      }
    }

    // Get count before deletion for logging
    const countQuery = deleteQuery.clone();
    const count = await countQuery.getCount();

    // Execute deletion
    const result = await deleteQuery.delete().execute();

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'bulk_delete_notifications',
      description: `Bulk deleted ${result.affected} notifications`,
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
      message: `Successfully deleted ${result.affected} notifications`,
      data: { deletedCount: result.affected }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkDeleteNotifications:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk delete notifications: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};