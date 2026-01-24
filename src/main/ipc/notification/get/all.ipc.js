// ipc/notification/get/all.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAllNotifications(params = {}) {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    const { 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      offset = 0, 
      // @ts-ignore
      sortBy = "timestamp", 
      // @ts-ignore
      sortOrder = "DESC" 
    } = params;

    // Build query
    const queryBuilder = notificationRepo.createQueryBuilder("notification");

    // Add sorting
    queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);

    // Add pagination
    queryBuilder.skip(offset).take(limit);

    // Execute query
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
    console.error('Error in getAllNotifications:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve notifications: ${error.message}`,
      data: null
    };
  }
};