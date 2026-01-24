// ipc/notification/get/by_type.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getNotificationsByType(params = {}) {
  try {
    // @ts-ignore
    const { type, limit = 50, offset = 0 } = params;
    
    if (!type) {
      return {
        status: false,
        message: 'Notification type is required',
        data: null
      };
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Build query
    const queryBuilder = notificationRepo.createQueryBuilder("notification");
    
    queryBuilder.where("notification.type = :type", { type });
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
    console.error('Error in getNotificationsByType:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve notifications: ${error.message}`,
      data: null
    };
  }
};