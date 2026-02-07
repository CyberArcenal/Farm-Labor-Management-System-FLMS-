// ipc/user/index.ipc.js - User Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class UserHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllUsers = this.importHandler("./get/all.ipc");
    this.getUserById = this.importHandler("./get/by_id.ipc");
    this.getUserByUsername = this.importHandler("./get/by_username.ipc");
    this.getUserByEmail = this.importHandler("./get/by_email.ipc");
    this.getUsersByRole = this.importHandler("./get/by_role.ipc");
    this.getActiveUsers = this.importHandler("./get/active.ipc");
    this.getUserStats = this.importHandler("./get/stats.ipc");
    this.searchUsers = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createUser = this.importHandler("./create.ipc");
    this.updateUser = this.importHandler("./update.ipc");
    this.deleteUser = this.importHandler("./delete.ipc");
    this.updateUserStatus = this.importHandler("./update_status.ipc");
    this.changePassword = this.importHandler("./change_password.ipc");
    this.updateUserRole = this.importHandler("./update_role.ipc");

    // 🔐 AUTHENTICATION HANDLERS
    this.loginUser = this.importHandler("./auth/login.ipc");
    this.logoutUser = this.importHandler("./auth/logout.ipc");
    this.refreshToken = this.importHandler("./auth/refresh_token.ipc");
    this.resetPassword = this.importHandler("./auth/reset_password.ipc");
    this.forgotPassword = this.importHandler("./auth/forgot_password.ipc");

    // 📊 ACTIVITY HANDLERS
    this.getUserActivity = this.importHandler("./activity/get.ipc");
    this.clearUserActivity = this.importHandler("./activity/clear.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateUsers = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateUsers = this.importHandler("./bulk_update.ipc");
    this.importUsersFromCSV = this.importHandler("./import_csv.ipc");
    this.exportUsersToCSV = this.importHandler("./export_csv.ipc");

    // 👥 PROFILE HANDLERS
    this.updateProfile = this.importHandler("./profile/update.ipc");
    this.uploadProfilePicture = this.importHandler("./profile/upload_picture.ipc");
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
        `[UserHandler] Failed to load handler: ${path}`,
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
  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      // @ts-ignore
      const enrichedParams = { ...params };

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`UserHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllUsers":
          return await this.getAllUsers(enrichedParams);
        
        case "getUserById":
          return await this.getUserById(enrichedParams);
        
        case "getUserByUsername":
          return await this.getUserByUsername(enrichedParams);
        
        case "getUserByEmail":
          return await this.getUserByEmail(enrichedParams);
        
        case "getUsersByRole":
          return await this.getUsersByRole(enrichedParams);
        
        case "getActiveUsers":
          return await this.getActiveUsers(enrichedParams);
        
        case "getUserStats":
          return await this.getUserStats(enrichedParams);
        
        case "searchUsers":
          return await this.searchUsers(enrichedParams);

        // ✏️ WRITE OPERATIONS
        case "createUser":
          // @ts-ignore
          return await this.handleWithTransaction(this.createUser, enrichedParams);
        
        case "updateUser":
          // @ts-ignore
          return await this.handleWithTransaction(this.updateUser, enrichedParams);
        
        case "deleteUser":
          // @ts-ignore
          return await this.handleWithTransaction(this.deleteUser, enrichedParams);
        
        case "updateUserStatus":
          // @ts-ignore
          return await this.handleWithTransaction(this.updateUserStatus, enrichedParams);
        
        case "changePassword":
          // @ts-ignore
          return await this.handleWithTransaction(this.changePassword, enrichedParams);
        
        case "updateUserRole":
          // @ts-ignore
          return await this.handleWithTransaction(this.updateUserRole, enrichedParams);

        // 🔐 AUTHENTICATION OPERATIONS
        case "loginUser":
          return await this.loginUser(enrichedParams);
        
        case "logoutUser":
          return await this.logoutUser(enrichedParams);
        
        case "refreshToken":
          return await this.refreshToken(enrichedParams);
        
        case "resetPassword":
          return await this.resetPassword(enrichedParams);
        
        case "forgotPassword":
          return await this.forgotPassword(enrichedParams);

        // 📊 ACTIVITY OPERATIONS
        case "getUserActivity":
          return await this.getUserActivity(enrichedParams);
        
        case "clearUserActivity":
          // @ts-ignore
          return await this.handleWithTransaction(this.clearUserActivity, enrichedParams);

        // 🔄 BATCH OPERATIONS
        case "bulkCreateUsers":
          // @ts-ignore
          return await this.handleWithTransaction(this.bulkCreateUsers, enrichedParams);
        
        case "bulkUpdateUsers":
          // @ts-ignore
          return await this.handleWithTransaction(this.bulkUpdateUsers, enrichedParams);
        
        case "importUsersFromCSV":
          // @ts-ignore
          return await this.handleWithTransaction(this.importUsersFromCSV, enrichedParams);
        
        case "exportUsersToCSV":
          return await this.exportUsersToCSV(enrichedParams);

        // 👥 PROFILE OPERATIONS
        case "updateProfile":
          // @ts-ignore
          return await this.handleWithTransaction(this.updateProfile, enrichedParams);
        
        case "uploadProfilePicture":
          // @ts-ignore
          return await this.handleWithTransaction(this.uploadProfilePicture, enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("UserHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("UserHandler error:", error);
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
        session: {id:sessionId},
        ip_address: "127.0.0.1",
        user_agent: "Kabisilya-Management-System",
        created_at: new Date()
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log user activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log user activity:", error);
      }
    }
  }
}

// Register IPC handler
const userHandler = new UserHandler();

ipcMain.handle(
  "user",
  withErrorHandling(
    // @ts-ignore
    userHandler.handleRequest.bind(userHandler),
    "IPC:user",
  ),
);

module.exports = { UserHandler, userHandler };