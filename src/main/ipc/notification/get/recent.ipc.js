// ipc/notification/get/recent.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getRecentNotifications(params = {}) {
  try {
    // @ts-ignore
    const { limit = 20, days = 7 } = params;

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Calculate date for recent notifications
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - days);

    // Build query
    const queryBuilder = notificationRepo.createQueryBuilder("notification");
    
    queryBuilder.where("notification.timestamp >= :recentDate", { recentDate });
    queryBuilder.orderBy("notification.timestamp", "DESC");
    queryBuilder.take(limit);

    const notifications = await queryBuilder.getMany();

    return {
      status: true,
      message: 'Recent notifications retrieved successfully',
      data: { notifications }
    };
  } catch (error) {
    console.error('Error in getRecentNotifications:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve recent notifications: ${error.message}`,
      data: null
    };
  }
};