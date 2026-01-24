// ipc/notification/search.ipc.js
//@ts-check

const Notification = require("../../../entities/Notification");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function searchNotifications(params = {}) {
  try {
    const { 
      // @ts-ignore
      query, 
      // @ts-ignore
      type, 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      offset = 0 
    } = params;

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Build query
    const queryBuilder = notificationRepo.createQueryBuilder("notification");
    
    // Search in context JSON (simplified - in real app, you might need more complex JSON search)
    if (query) {
      queryBuilder.where(
        "notification.type LIKE :query OR notification.context::text LIKE :query",
        { query: `%${query}%` }
      );
    }
    
    if (type) {
      if (query) {
        queryBuilder.andWhere("notification.type = :type", { type });
      } else {
        queryBuilder.where("notification.type = :type", { type });
      }
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (query || type) {
        queryBuilder.andWhere("notification.timestamp BETWEEN :start AND :end", { start, end });
      } else {
        queryBuilder.where("notification.timestamp BETWEEN :start AND :end", { start, end });
      }
    } else if (startDate) {
      const start = new Date(startDate);
      if (query || type) {
        queryBuilder.andWhere("notification.timestamp >= :start", { start });
      } else {
        queryBuilder.where("notification.timestamp >= :start", { start });
      }
    } else if (endDate) {
      const end = new Date(endDate);
      if (query || type) {
        queryBuilder.andWhere("notification.timestamp <= :end", { end });
      } else {
        queryBuilder.where("notification.timestamp <= :end", { end });
      }
    }

    // Add sorting and pagination
    queryBuilder.orderBy("notification.timestamp", "DESC");
    queryBuilder.skip(offset).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Notifications search completed',
      data: {
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + notifications.length < total
        },
        searchParams: { query, type, startDate, endDate }
      }
    };
  } catch (error) {
    console.error('Error in searchNotifications:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search notifications: ${error.message}`,
      data: null
    };
  }
};