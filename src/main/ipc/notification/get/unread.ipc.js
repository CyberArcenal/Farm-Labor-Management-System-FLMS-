// ipc/notification/get/unread.ipc.js
//@ts-check

// Note: Since the Notification entity doesn't have a read status field,
// we'll need to modify the entity or use context field to track read status.
// For now, this is a placeholder implementation.

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUnreadNotifications(params = {}) {
  try {
    // @ts-ignore
    const { limit = 50, offset = 0, userId } = params;

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // This is a simplified implementation
    // In a real system, you'd have a read status field or a separate read_notifications table
    const queryBuilder = notificationRepo.createQueryBuilder("notification");
    
    // Get all notifications (since we don't have read status yet)
    queryBuilder.orderBy("notification.timestamp", "DESC");
    queryBuilder.skip(offset).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + notifications.length < total
        }
      }
    };
  } catch (error) {
    console.error('Error in getUnreadNotifications:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve unread notifications: ${error.message}`,
      data: null
    };
  }
};