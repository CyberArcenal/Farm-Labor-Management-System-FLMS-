// ipc/notification/get/stats.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getNotificationStats(params = {}) {
  try {
    // @ts-ignore
    const { days = 30 } = params;

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total count
    const totalQuery = notificationRepo.createQueryBuilder("notification");
    const totalCount = await totalQuery.getCount();

    // Get count by type
    const typeQuery = notificationRepo.createQueryBuilder("notification")
      .select("notification.type", "type")
      .addSelect("COUNT(*)", "count")
      .groupBy("notification.type");

    const typeStats = await typeQuery.getRawMany();

    // Get recent count (last 7 days)
    const recentQuery = notificationRepo.createQueryBuilder("notification")
      .where("notification.timestamp >= :startDate", { 
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
      });
    const recentCount = await recentQuery.getCount();

    // Get today's count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayQuery = notificationRepo.createQueryBuilder("notification")
      .where("notification.timestamp >= :todayStart", { todayStart });
    const todayCount = await todayQuery.getCount();

    return {
      status: true,
      message: 'Notification stats retrieved successfully',
      data: {
        stats: {
          totalCount,
          recentCount,
          todayCount,
          byType: typeStats.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ type: string | number; count: string; }} */ stat) => {
            acc[stat.type] = parseInt(stat.count);
            return acc;
          }, {})
        }
      }
    };
  } catch (error) {
    console.error('Error in getNotificationStats:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve notification stats: ${error.message}`,
      data: null
    };
  }
};