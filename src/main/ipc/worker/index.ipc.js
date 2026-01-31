// ipc/worker/index.ipc.js - Worker Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class WorkerHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllWorkers = this.importHandler("./get/all.ipc");
    this.getWorkerById = this.importHandler("./get/by_id.ipc");
    this.getWorkerByName = this.importHandler("./get/by_name.ipc");
    this.getWorkerByStatus = this.importHandler("./get/by_status.ipc");
    this.getWorkerWithDebts = this.importHandler("./get/with_debts.ipc");
    this.getWorkerWithPayments = this.importHandler("./get/with_payments.ipc");
    this.getWorkerWithAssignments = this.importHandler("./get/with_assignments.ipc");
    this.getWorkerSummary = this.importHandler("./get/summary.ipc");
    this.getActiveWorkers = this.importHandler("./get/active.ipc");
    this.getWorkerStats = this.importHandler("./get/stats.ipc");
    this.searchWorkers = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createWorker = this.importHandler("./create.ipc");
    this.updateWorker = this.importHandler("./update.ipc");
    this.deleteWorker = this.importHandler("./delete.ipc");
    this.updateWorkerStatus = this.importHandler("./update_status.ipc");
    this.updateWorkerContact = this.importHandler("./update_contact.ipc");
    this.updateWorkerFinancials = this.importHandler("./update_financials.ipc");

    // 💰 FINANCIAL HANDLERS
    this.getWorkerDebtSummary = this.importHandler("./get_debt_summary.ipc");
    this.getWorkerPaymentSummary = this.importHandler("./get_payment_summary.ipc");
    this.getWorkerAssignmentSummary = this.importHandler("./get_assignment_summary.ipc");
    this.calculateWorkerBalance = this.importHandler("./calculate_balance.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateWorkers = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateWorkers = this.importHandler("./bulk_update.ipc");
    this.importWorkersFromCSV = this.importHandler("./import_csv.ipc");
    this.exportWorkersToCSV = this.importHandler("./export_csv.ipc");

    // 📊 REPORT HANDLERS
    this.generateWorkerReport = this.importHandler("./generate_report.ipc");
    this.getWorkerAttendance = this.importHandler("./get_attendance.ipc");
    this.getWorkerPerformance = this.importHandler("./get_performance.ipc");
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
        `[WorkerHandler] Failed to load handler: ${path}`,
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
        logger.info(`WorkerHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllWorkers":
          return await this.getAllWorkers(enrichedParams);
        
        case "getWorkerById":
          return await this.getWorkerById(enrichedParams);
        
        case "getWorkerByName":
          return await this.getWorkerByName(enrichedParams);
        
        case "getWorkerByStatus":
          return await this.getWorkerByStatus(enrichedParams);
        
        case "getWorkerWithDebts":
          return await this.getWorkerWithDebts(enrichedParams);
        
        case "getWorkerWithPayments":
          return await this.getWorkerWithPayments(enrichedParams);
        
        case "getWorkerWithAssignments":
          return await this.getWorkerWithAssignments(enrichedParams);
        
        case "getWorkerSummary":
          return await this.getWorkerSummary(enrichedParams);
        
        case "getActiveWorkers":
          return await this.getActiveWorkers(enrichedParams);
        
        case "getWorkerStats":
          return await this.getWorkerStats(enrichedParams);
        
        case "searchWorkers":
          return await this.searchWorkers(enrichedParams);

        // ✏️ WRITE OPERATIONS
        case "createWorker":
          return await this.handleWithTransaction(this.createWorker, enrichedParams);
        
        case "updateWorker":
          return await this.handleWithTransaction(this.updateWorker, enrichedParams);
        
        case "deleteWorker":
          return await this.handleWithTransaction(this.deleteWorker, enrichedParams);
        
        case "updateWorkerStatus":
          return await this.handleWithTransaction(this.updateWorkerStatus, enrichedParams);
        
        case "updateWorkerContact":
          return await this.handleWithTransaction(this.updateWorkerContact, enrichedParams);
        
        case "updateWorkerFinancials":
          return await this.handleWithTransaction(this.updateWorkerFinancials, enrichedParams);

        // 💰 FINANCIAL OPERATIONS
        case "getWorkerDebtSummary":
          return await this.getWorkerDebtSummary(enrichedParams);
        
        case "getWorkerPaymentSummary":
          return await this.getWorkerPaymentSummary(enrichedParams);
        
        case "getWorkerAssignmentSummary":
          return await this.getWorkerAssignmentSummary(enrichedParams);
        
        case "calculateWorkerBalance":
          return await this.calculateWorkerBalance(enrichedParams);

        // 🔄 BATCH OPERATIONS
        case "bulkCreateWorkers":
          return await this.handleWithTransaction(this.bulkCreateWorkers, enrichedParams);
        
        case "bulkUpdateWorkers":
          return await this.handleWithTransaction(this.bulkUpdateWorkers, enrichedParams);
        
        case "importWorkersFromCSV":
          return await this.handleWithTransaction(this.importWorkersFromCSV, enrichedParams);
        
        case "exportWorkersToCSV":
          return await this.exportWorkersToCSV(enrichedParams);

        // 📊 REPORT OPERATIONS
        case "generateWorkerReport":
          return await this.generateWorkerReport(enrichedParams);
        
        case "getWorkerAttendance":
          return await this.getWorkerAttendance(enrichedParams);
        
        case "getWorkerPerformance":
          return await this.getWorkerPerformance(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("WorkerHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("WorkerHandler error:", error);
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
        session:{id:sessionId},
        ip_address: "127.0.0.1",
        user_agent: "Kabisilya-Management-System",
        created_at: new Date()
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log worker activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log worker activity:", error);
      }
    }
  }
}

// Register IPC handler
const workerHandler = new WorkerHandler();

ipcMain.handle(
  "worker",
  withErrorHandling(
    // @ts-ignore
    workerHandler.handleRequest.bind(workerHandler),
    "IPC:worker",
  ),
);

module.exports = { WorkerHandler, workerHandler };