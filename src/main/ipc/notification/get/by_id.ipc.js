// ipc/notification/get/by_id.ipc.js
//@ts-check

const Notification = require("../../../../entities/Notification");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getNotificationById(params = {}) {
  try {
    // @ts-ignore
    const { id } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Notification ID is required',
        data: null
      };
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    
    const notification = await notificationRepo.findOne({
      where: { id }
    });

    if (!notification) {
      return {
        status: false,
        message: 'Notification not found',
        data: null
      };
    }

    return {
      status: true,
      message: 'Notification retrieved successfully',
      data: { notification }
    };
  } catch (error) {
    console.error('Error in getNotificationById:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve notification: ${error.message}`,
      data: null
    };
  }
};