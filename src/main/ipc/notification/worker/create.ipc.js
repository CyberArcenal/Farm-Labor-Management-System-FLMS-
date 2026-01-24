// ipc/notification/worker/create.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function createWorkerNotification(params = {}, queryRunner = null) {
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
    const { workerId, workerName, notificationType, message, context = {}, _userId } = params;
    
    if (!workerId || !notificationType || !message) {
      return {
        status: false,
        message: 'Worker ID, notification type, and message are required',
        data: null
      };
    }

    // Create worker notification
    // @ts-ignore
    const notification = queryRunner.manager.create(Notification, {
      type: 'worker',
      context: {
        workerId,
        workerName: workerName || `Worker ${workerId}`,
        notificationType, // 'assignment', 'payment', 'debt', 'status_change', etc.
        message,
        timestamp: new Date().toISOString(),
        ...context
      },
      timestamp: new Date()
    });

    // @ts-ignore
    const savedNotification = await queryRunner.manager.save(notification);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'create_worker_notification',
      description: `Created worker notification for ${workerName || `Worker ${workerId}`}`,
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
      message: 'Worker notification created successfully',
      data: { notification: savedNotification }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in createWorkerNotification:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create worker notification: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};