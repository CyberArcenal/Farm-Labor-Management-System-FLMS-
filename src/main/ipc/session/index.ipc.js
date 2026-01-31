// src/ipc/session/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class SessionHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllSessions = require("./get/all.ipc");
    this.getSessionById = require("./get/by_id.ipc");
    this.getActiveSessions = require("./get/active.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createSession = require("./create.ipc");
    this.updateSession = require("./update.ipc");
    this.deleteSession = require("./delete.ipc");
    this.duplicateSession = require("./duplicate.ipc");
    
    // 🔄 STATUS HANDLERS
    this.closeSession = require("./close.ipc");
    this.archiveSession = require("./archive.ipc");
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
        logger.info(`SessionHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllSessions":
          // @ts-ignore
          return await this.getAllSessions(enrichedParams.filters, userId);

        case "getSessionById":
          // @ts-ignore
          return await this.getSessionById(enrichedParams.id, userId);

        case "getActiveSessions":
          // @ts-ignore
          return await this.getActiveSessions(enrichedParams);

        // ✏️ WRITE OPERATIONS
        case "createSession":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.createSession,
            enrichedParams,
          );

        case "updateSession":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.updateSession,
            enrichedParams,
          );

        case "deleteSession":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.deleteSession,
            enrichedParams,
          );

        case "duplicateSession":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.duplicateSession,
            enrichedParams,
          );

        // 🔄 STATUS OPERATIONS
        case "closeSession":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.closeSession,
            enrichedParams,
          );

        case "archiveSession":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.archiveSession,
            enrichedParams,
          );

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("SessionHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("SessionHandler error:", error);
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
        user_agent: "Session-Management-System",
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log session activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log session activity:", error);
      }
    }
  }
}

// Register IPC handler
const sessionHandler = new SessionHandler();

ipcMain.handle(
  "session",
  withErrorHandling(
    // @ts-ignore
    sessionHandler.handleRequest.bind(sessionHandler),
    "IPC:session",
  ),
);

module.exports = { SessionHandler, sessionHandler };