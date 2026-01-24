// ipc/notification/get/by_date_range.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getNotificationsByDateRange(params = {}) {
  try {
    // @ts-ignore
    const { startDate, endDate, limit = 100, offset = 0 } = params;
    
    if (!startDate || !endDate) {
      return {
        status: false,
        message: 'Start date and end date are required',
        data: null
      };
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build query
    const queryBuilder = notificationRepo.createQueryBuilder("notification");
    
    queryBuilder.where("notification.timestamp BETWEEN :start AND :end", { start, end });
    queryBuilder.orderBy("notification.timestamp", "DESC");
    queryBuilder.skip(offset).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        dateRange: { startDate: start, endDate: end },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + notifications.length < total
        }
      }
    };
  } catch (error) {
    console.error('Error in getNotificationsByDateRange:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve notifications: ${error.message}`,
      data: null
    };
  }
};