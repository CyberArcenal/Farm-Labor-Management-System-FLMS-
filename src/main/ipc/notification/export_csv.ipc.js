// ipc/notification/export_csv.ipc.js
//@ts-check

const Notification = require("../../../entities/Notification");
const { AppDataSource } = require("../../db/dataSource");
const { Parser } = require('json2csv');

module.exports = async function exportNotificationsToCSV(params = {}) {
  try {
    // @ts-ignore
    const { startDate, endDate, type } = params;

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Build query
    const queryBuilder = notificationRepo.createQueryBuilder("notification");
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      queryBuilder.where("notification.timestamp BETWEEN :start AND :end", { start, end });
    }
    
    if (type) {
      if (startDate && endDate) {
        queryBuilder.andWhere("notification.type = :type", { type });
      } else {
        queryBuilder.where("notification.type = :type", { type });
      }
    }

    queryBuilder.orderBy("notification.timestamp", "DESC");

    const notifications = await queryBuilder.getMany();

    // Transform data for CSV
    // @ts-ignore
    const csvData = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      timestamp: notification.timestamp,
      context: JSON.stringify(notification.context),
      created_at: notification.timestamp // Assuming timestamp is creation date
    }));

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Create filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const typeSuffix = type ? `_${type}` : '';
    const filename = `notifications${typeSuffix}_${timestamp}.csv`;

    return {
      status: true,
      message: 'Notifications exported successfully',
      data: {
        csv,
        filename,
        count: notifications.length
      }
    };
  } catch (error) {
    console.error('Error in exportNotificationsToCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export notifications: ${error.message}`,
      data: null
    };
  }
};