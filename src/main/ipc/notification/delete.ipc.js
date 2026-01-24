// ipc/notification/delete.ipc.js
//@ts-check

const Notification = require("../../../entities/Notification");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function deleteNotification(params = {}, queryRunner = null) {
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

    // Delete notification
    // @ts-ignore
    await queryRunner.manager.remove(existingNotification);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'delete_notification',
      description: `Deleted notification ID: ${id}`,
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
      message: 'Notification deleted successfully',
      data: { deletedId: id }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in deleteNotification:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete notification: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};