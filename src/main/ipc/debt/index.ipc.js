// src/ipc/debt/index.ipc.js
// Debt Management IPC Handler - UPDATED VERSION
// @ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { assignmentHandler } = require("../assignment/index.ipc");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class DebtHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllDebts = this.importHandler("./get/all.ipc");
    this.getDebtById = this.importHandler("./get/by_id.ipc");
    this.getDebtsByWorker = this.importHandler("./get/by_worker.ipc");
    this.getDebtsByStatus = this.importHandler("./get/by_status.ipc");
    this.getActiveDebts = this.importHandler("./get/active.ipc");
    this.getOverdueDebts = this.importHandler("./get/overdue.ipc");
    this.getDebtHistory = this.importHandler("./get/history.ipc");
    this.searchDebts = this.importHandler("./search.ipc");

    // 📊 REPORT HANDLERS
    this.getDebtReport = this.importHandler("./get/report.ipc");
    this.getWorkerDebtSummary = this.importHandler("./get/worker_summary.ipc");
    this.getDebtCollectionReport = this.importHandler(
      "./get/collection_report.ipc",
    );
    this.getPaymentHistory = this.importHandler("./get/payment_history.ipc"); // NEW

    // ✏️ WRITE OPERATION HANDLERS (with transactions)
    this.createDebt = this.importHandler("./create.ipc.js");
    this.updateDebt = this.importHandler("./update.ipc.js");
    this.deleteDebt = this.importHandler("./delete.ipc.js");
    this.updateDebtStatus = this.importHandler("./update_status.ipc.js");
    this.makePayment = this.importHandler("./make_payment.ipc.js");
    this.addInterest = this.importHandler("./add_interest.ipc.js");
    this.adjustDebt = this.importHandler("./adjust_debt.ipc.js");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateDebts = this.importHandler("./bulk_create.ipc.js");
    this.importDebtsFromCSV = this.importHandler("./import_csv.ipc.js");
    this.exportDebtsToCSV = this.importHandler("./export_csv.ipc.js");
    this.bulkUpdateStatus = this.importHandler("./bulk_update_status.ipc.js");
    this.processPayment = this.importHandler("./process_payment.ipc.js"); // NEW

    // 💰 PAYMENT OPERATIONS
    this.reversePayment = this.importHandler("./reverse_payment.ipc.js");

    // ⚙️ VALIDATION HANDLERS
    this.validateDebtData = this.importHandler("./validate_data.ipc.js");
    this.checkDebtLimit = this.importHandler("./check_debt_limit.ipc.js");
    this.calculateInterest = this.importHandler("./calculate_interest.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[DebtHandler] Failed to load handler: ${path}`,
        // @ts-ignore
        error.message,
      );
      return async () => ({
        status: false,
        message: `Handler not found: ${path}`,
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
        logger.info(`DebtHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllDebts":
          // @ts-ignore
          return await this.getAllDebts(enrichedParams.filters, userId);

        case "getDebtById":
          // @ts-ignore
          return await this.getDebtById(enrichedParams.id, userId);

        case "getDebtsByWorker":
          return await this.getDebtsByWorker(
            // @ts-ignore
            enrichedParams.worker_id,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getDebtsByStatus":
          return await this.getDebtsByStatus(
            // @ts-ignore
            enrichedParams.status,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getActiveDebts":
          // @ts-ignore
          return await this.getActiveDebts(enrichedParams.filters, userId);

        case "getOverdueDebts":
          // @ts-ignore
          return await this.getOverdueDebts(enrichedParams.filters, userId);

        case "getDebtHistory":
          return await this.getDebtHistory(
            // @ts-ignore
            enrichedParams.debt_id,
            userId,
          );

        case "searchDebts":
          // @ts-ignore
          return await this.searchDebts(enrichedParams.query, userId);

        // 📊 REPORT OPERATIONS
        case "getDebtReport":
          return await this.getDebtReport(
            // @ts-ignore
            enrichedParams.date_range,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getWorkerDebtSummary":
          return await this.getWorkerDebtSummary(
            // @ts-ignore
            enrichedParams.worker_id,
            userId,
          );

        case "getDebtCollectionReport":
          return await this.getDebtCollectionReport(
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getPaymentHistory":
          return await this.getPaymentHistory(
            // @ts-ignore
            enrichedParams.debt_id,
            userId,
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createDebt":
          return await this.handleWithTransaction(
            this.createDebt,
            enrichedParams,
          );

        case "updateDebt":
          return await this.handleWithTransaction(
            this.updateDebt,
            enrichedParams,
          );

        case "deleteDebt":
          return await this.handleWithTransaction(
            this.deleteDebt,
            enrichedParams,
          );

        case "updateDebtStatus":
          return await this.handleWithTransaction(
            this.updateDebtStatus,
            enrichedParams,
          );

        case "makePayment":
          return await this.handleWithTransaction(
            this.makePayment,
            enrichedParams,
          );

        case "addInterest":
          return await this.handleWithTransaction(
            this.addInterest,
            enrichedParams,
          );

        case "adjustDebt":
          return await this.handleWithTransaction(
            this.adjustDebt,
            enrichedParams,
          );

        // 🔄 BATCH OPERATIONS
        case "bulkCreateDebts":
          return await this.handleWithTransaction(
            this.bulkCreateDebts,
            enrichedParams,
          );

        case "importDebtsFromCSV":
          return await this.handleWithTransaction(
            this.importDebtsFromCSV,
            enrichedParams,
          );

        case "exportDebtsToCSV":
          return await this.exportDebtsToCSV(enrichedParams);

        case "bulkUpdateStatus":
          return await this.handleWithTransaction(
            this.bulkUpdateStatus,
            enrichedParams,
          );

        case "processPayment":
          return await this.handleWithTransaction(
            this.processPayment,
            enrichedParams,
          );

        // 💰 PAYMENT OPERATIONS
        case "reversePayment":
          return await this.handleWithTransaction(
            this.reversePayment,
            enrichedParams,
          );

        // ⚙️ VALIDATION OPERATIONS
        case "validateDebtData":
          return await this.validateDebtData(enrichedParams);

        case "checkDebtLimit":
          return await this.checkDebtLimit(enrichedParams);

        case "calculateInterest":
          return await this.calculateInterest(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("DebtHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("DebtHandler error:", error);
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
        // Log activity on success
        await this.logActivity(
          params._userId,
          handler.name,
          `Successfully executed ${handler.name}`,
          // @ts-ignore
          queryRunner,
        );
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
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log debt activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log debt activity:", error);
      }
    }
  }
}

// Register IPC handler
const debtHandler = new DebtHandler();

ipcMain.handle(
  "debt",
  withErrorHandling(
    // @ts-ignore
    debtHandler.handleRequest.bind(debtHandler),
    "IPC:debt",
  ),
);

module.exports = { DebtHandler, debtHandler };
