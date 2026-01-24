// ipc/notification/mark_all_read.ipc.js
//@ts-check

// Note: This is a placeholder since the Notification entity doesn't have a read status field.

const Notification = require("../../../entities/Notification");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function markAllAsRead(params = {}, queryRunner = null) {
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
    const { _userId, type } = params;

    // @ts-ignore
    const notificationRepo = queryRunner.manager.getRepository(Notification);
    
    // In a real implementation, you would update all notifications to read status
    // For now, we'll just return success
    // Example query:
    // await notificationRepo.update(
    //   type ? { type } : {},
    //   { isRead: true }
    // );
    
    const message = type 
      ? `Marked all ${type} notifications as read` 
      : 'Marked all notifications as read';

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'mark_all_notifications_read',
      description: message,
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
      message,
      data: { affected: 0 } // Would be actual count in real implementation
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in markAllAsRead:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to mark all notifications as read: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};