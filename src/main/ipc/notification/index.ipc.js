// ipc/notification/index.ipc.js - Notification Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class NotificationHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllNotifications = this.importHandler("./get/all.ipc");
    this.getNotificationById = this.importHandler("./get/by_id.ipc");
    this.getNotificationsByType = this.importHandler("./get/by_type.ipc");
    this.getRecentNotifications = this.importHandler("./get/recent.ipc");
    this.getUnreadNotifications = this.importHandler("./get/unread.ipc");
    this.getNotificationsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getNotificationStats = this.importHandler("./get/stats.ipc");
    this.searchNotifications = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createNotification = this.importHandler("./create.ipc");
    this.updateNotification = this.importHandler("./update.ipc");
    this.deleteNotification = this.importHandler("./delete.ipc");
    this.markAsRead = this.importHandler("./mark_as_read.ipc");
    this.markAllAsRead = this.importHandler("./mark_all_read.ipc");
    this.bulkDeleteNotifications = this.importHandler("./bulk_delete.ipc");

    // 📊 SYSTEM NOTIFICATION HANDLERS
    this.createSystemNotification = this.importHandler("./system/create.ipc");
    this.createWorkerNotification = this.importHandler("./worker/create.ipc");
    this.createDebtNotification = this.importHandler("./debt/create.ipc");
    this.createPaymentNotification = this.importHandler("./payment/create.ipc");

    // 🔔 NOTIFICATION PREFERENCES
    this.getUserPreferences = this.importHandler("./preferences/get.ipc");
    this.updateUserPreferences = this.importHandler("./preferences/update.ipc");
    this.getNotificationTypes = this.importHandler("./preferences/types.ipc");

    // 📤 EXPORT HANDLERS
    this.exportNotificationsToCSV = this.importHandler("./export_csv.ipc");
    this.exportNotificationReport = this.importHandler("./export_report.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      // Adjust path to be relative to current file
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[NotificationHandler] Failed to load handler: ${path}`,
        // @ts-ignore
        error.message,
      );
      // Return a fallback handler
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      // @ts-ignore
      const userId = params.userId || event.sender.id || 0;
      const enrichedParams = { ...params, _userId: userId };

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`NotificationHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllNotifications":
          return await this.getAllNotifications(enrichedParams);
        
        case "getNotificationById":
          return await this.getNotificationById(enrichedParams);
        
        case "getNotificationsByType":
          return await this.getNotificationsByType(enrichedParams);
        
        case "getRecentNotifications":
          return await this.getRecentNotifications(enrichedParams);
        
        case "getUnreadNotifications":
          return await this.getUnreadNotifications(enrichedParams);
        
        case "getNotificationsByDateRange":
          return await this.getNotificationsByDateRange(enrichedParams);
        
        case "getNotificationStats":
          return await this.getNotificationStats(enrichedParams);
        
        case "searchNotifications":
          return await this.searchNotifications(enrichedParams);

        // ✏️ WRITE OPERATIONS
        case "createNotification":
          return await this.handleWithTransaction(this.createNotification, enrichedParams);
        
        case "updateNotification":
          return await this.handleWithTransaction(this.updateNotification, enrichedParams);
        
        case "deleteNotification":
          return await this.handleWithTransaction(this.deleteNotification, enrichedParams);
        
        case "markAsRead":
          return await this.handleWithTransaction(this.markAsRead, enrichedParams);
        
        case "markAllAsRead":
          return await this.handleWithTransaction(this.markAllAsRead, enrichedParams);
        
        case "bulkDeleteNotifications":
          return await this.handleWithTransaction(this.bulkDeleteNotifications, enrichedParams);

        // 📊 SYSTEM NOTIFICATION OPERATIONS
        case "createSystemNotification":
          return await this.handleWithTransaction(this.createSystemNotification, enrichedParams);
        
        case "createWorkerNotification":
          return await this.handleWithTransaction(this.createWorkerNotification, enrichedParams);
        
        case "createDebtNotification":
          return await this.handleWithTransaction(this.createDebtNotification, enrichedParams);
        
        case "createPaymentNotification":
          return await this.handleWithTransaction(this.createPaymentNotification, enrichedParams);

        // 🔔 NOTIFICATION PREFERENCES
        case "getUserPreferences":
          return await this.getUserPreferences(enrichedParams);
        
        case "updateUserPreferences":
          return await this.handleWithTransaction(this.updateUserPreferences, enrichedParams);
        
        case "getNotificationTypes":
          return await this.getNotificationTypes(enrichedParams);

        // 📤 EXPORT OPERATIONS
        case "exportNotificationsToCSV":
          return await this.exportNotificationsToCSV(enrichedParams);
        
        case "exportNotificationReport":
          return await this.exportNotificationReport(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("NotificationHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("NotificationHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Wrap critical operations in a database transaction
   * @param {(arg0: any, arg1: import("typeorm").QueryRunner) => any} handler
   * @param {{ _userId: any; }} params
   */
  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);

      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * @param {any} user_id
   * @param {any} action
   * @param {any} description
   */
  async logActivity(user_id, action, description, qr = null) {
    try {
      let activityRepo;

      if (qr) {
        // @ts-ignore
        activityRepo = qr.manager.getRepository(UserActivity);
      } else {
        activityRepo = AppDataSource.getRepository(UserActivity);
      }
    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      throw new Error("No default session configured. Please set one in Settings.");
    }
      const activity = activityRepo.create({
        user_id: user_id,
        action,
        description,
        session: {id: sessionId},
        ip_address: "127.0.0.1",
        user_agent: "Kabisilya-Management-System",
        created_at: new Date()
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log notification activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log notification activity:", error);
      }
    }
  }
}

// Register IPC handler
const notificationHandler = new NotificationHandler();

ipcMain.handle(
  "notification",
  withErrorHandling(
    // @ts-ignore
    notificationHandler.handleRequest.bind(notificationHandler),
    "IPC:notification",
  ),
);

module.exports = { NotificationHandler, notificationHandler };