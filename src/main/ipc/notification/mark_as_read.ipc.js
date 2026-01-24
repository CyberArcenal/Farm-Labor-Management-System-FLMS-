// ipc/notification/mark_as_read.ipc.js
//@ts-check

// Note: This is a placeholder since the Notification entity doesn't have a read status field.
// In a real implementation, you'd need to add a read status or create a separate table for read notifications.

const Notification = require("../../../entities/Notification");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function markAsRead(params = {}, queryRunner = null) {
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
        message: 'Notification ID is required',
        data: null
      };
    }

    // @ts-ignore
    const notificationRepo = queryRunner.manager.getRepository(Notification);
    
    // Find existing notification
    const existingNotification = await notificationRepo.findOne({
      where: { id }
    });

    if (!existingNotification) {
      return {
        status: false,
        message: 'Notification not found',
        data: null
      };
    }

    // In a real implementation, you would update a read status field
    // For now, we'll just return success
    // Example: existingNotification.isRead = true;
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'mark_notification_read',
      description: `Marked notification as read ID: ${id}`,
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
      message: 'Notification marked as read',
      data: { notificationId: id }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in markAsRead:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to mark notification as read: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};