// ipc/payment/index.ipc.js - Payment Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class PaymentHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllPayments = this.importHandler("./get/all.ipc");
    this.getPaymentById = this.importHandler("./get/by_id.ipc");
    this.getPaymentsByWorker = this.importHandler("./get/by_worker.ipc");
    this.getPaymentsByPitak = this.importHandler("./get/by_pitak.ipc");
    this.getPaymentsByStatus = this.importHandler("./get/by_status.ipc");
    this.getPaymentsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getPaymentWithDetails = this.importHandler("./get/with_details.ipc");
    this.getPaymentSummary = this.importHandler("./get/summary.ipc");
    this.getPendingPayments = this.importHandler("./get/pending.ipc");
    this.getPaymentStats = this.importHandler("./get/stats.ipc");
    this.searchPayments = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createPayment = this.importHandler("./create.ipc");
    this.updatePayment = this.importHandler("./update.ipc");
    this.deletePayment = this.importHandler("./delete.ipc");
    this.updatePaymentStatus = this.importHandler("./update_status.ipc");
    this.addPaymentNote = this.importHandler("./add_note.ipc");
    this.processPayment = this.importHandler("./process.ipc");
    this.cancelPayment = this.importHandler("./cancel.ipc");

    // 💰 PAYMENT CALCULATION & DEDUCTION HANDLERS
    this.calculateNetPay = this.importHandler("./calculate_net_pay.ipc");
    this.applyDebtDeduction = this.importHandler("./apply_debt_deduction.ipc");
    this.updateDeductions = this.importHandler("./update_deductions.ipc");
    this.generatePaymentBreakdown = this.importHandler("./generate_breakdown.ipc");

    // 🔗 RELATIONSHIP HANDLERS
    this.assignPaymentToWorker = this.importHandler("./assign_to_worker.ipc");
    this.assignPaymentToPitak = this.importHandler("./assign_to_pitak.ipc");
    this.linkDebtPayment = this.importHandler("./link_debt_payment.ipc");
    this.getPaymentHistory = this.importHandler("./get/get_history.ipc");

    // 📊 REPORTING HANDLERS
    this.generatePaymentReport = this.importHandler("./generate_report.ipc");
    this.getPaymentPeriods = this.importHandler("./get_periods.ipc");
    this.getWorkerPaymentSummary = this.importHandler("./get_worker_summary.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreatePayments = this.importHandler("./bulk_create.ipc");
    this.bulkUpdatePayments = this.importHandler("./bulk_update.ipc");
    this.bulkProcessPayments = this.importHandler("./bulk_process.ipc");
    this.importPaymentsFromCSV = this.importHandler("./import_csv.ipc");
    this.exportPaymentsToCSV = this.importHandler("./export_csv.ipc");
    this.exportPaymentSlip = this.importHandler("./export_slip.ipc");
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
        `[PaymentHandler] Failed to load handler: ${path}`,
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
        logger.info(`PaymentHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllPayments":
          return await this.getAllPayments(enrichedParams);
        
        case "getPaymentById":
          return await this.getPaymentById(enrichedParams);
        
        case "getPaymentsByWorker":
          return await this.getPaymentsByWorker(enrichedParams);
        
        case "getPaymentsByPitak":
          return await this.getPaymentsByPitak(enrichedParams);
        
        case "getPaymentsByStatus":
          return await this.getPaymentsByStatus(enrichedParams);
        
        case "getPaymentsByDateRange":
          return await this.getPaymentsByDateRange(enrichedParams);
        
        case "getPaymentWithDetails":
          return await this.getPaymentWithDetails(enrichedParams);
        
        case "getPaymentSummary":
          return await this.getPaymentSummary(enrichedParams);
        
        case "getPendingPayments":
          return await this.getPendingPayments(enrichedParams);
        
        case "getPaymentStats":
          return await this.getPaymentStats(enrichedParams);
        
        case "searchPayments":
          return await this.searchPayments(enrichedParams);

        // ✏️ WRITE OPERATIONS
        case "createPayment":
          return await this.handleWithTransaction(this.createPayment, enrichedParams);
        
        case "updatePayment":
          return await this.handleWithTransaction(this.updatePayment, enrichedParams);
        
        case "deletePayment":
          return await this.handleWithTransaction(this.deletePayment, enrichedParams);
        
        case "updatePaymentStatus":
          return await this.handleWithTransaction(this.updatePaymentStatus, enrichedParams);
        
        case "addPaymentNote":
          return await this.handleWithTransaction(this.addPaymentNote, enrichedParams);
        
        case "processPayment":
          return await this.handleWithTransaction(this.processPayment, enrichedParams);
        
        case "cancelPayment":
          return await this.handleWithTransaction(this.cancelPayment, enrichedParams);

        // 💰 PAYMENT CALCULATION OPERATIONS
        case "calculateNetPay":
          return await this.calculateNetPay(enrichedParams);
        
        case "applyDebtDeduction":
          return await this.handleWithTransaction(this.applyDebtDeduction, enrichedParams);
        
        case "updateDeductions":
          return await this.handleWithTransaction(this.updateDeductions, enrichedParams);
        
        case "generatePaymentBreakdown":
          return await this.generatePaymentBreakdown(enrichedParams);

        // 🔗 RELATIONSHIP OPERATIONS
        case "assignPaymentToWorker":
          return await this.handleWithTransaction(this.assignPaymentToWorker, enrichedParams);
        
        case "assignPaymentToPitak":
          return await this.handleWithTransaction(this.assignPaymentToPitak, enrichedParams);
        
        case "linkDebtPayment":
          return await this.handleWithTransaction(this.linkDebtPayment, enrichedParams);
        
        case "getPaymentHistory":
          return await this.getPaymentHistory(enrichedParams);

        // 📊 REPORTING OPERATIONS
        case "generatePaymentReport":
          return await this.generatePaymentReport(enrichedParams);
        
        case "getPaymentPeriods":
          return await this.getPaymentPeriods(enrichedParams);
        
        case "getWorkerPaymentSummary":
          return await this.getWorkerPaymentSummary(enrichedParams);

        // 🔄 BATCH OPERATIONS
        case "bulkCreatePayments":
          return await this.handleWithTransaction(this.bulkCreatePayments, enrichedParams);
        
        case "bulkUpdatePayments":
          return await this.handleWithTransaction(this.bulkUpdatePayments, enrichedParams);
        
        case "bulkProcessPayments":
          return await this.handleWithTransaction(this.bulkProcessPayments, enrichedParams);
        
        case "importPaymentsFromCSV":
          return await this.handleWithTransaction(this.importPaymentsFromCSV, enrichedParams);
        
        case "exportPaymentsToCSV":
          return await this.exportPaymentsToCSV(enrichedParams);
        
        case "exportPaymentSlip":
          return await this.exportPaymentSlip(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("PaymentHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("PaymentHandler error:", error);
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
      console.warn("Failed to log payment activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log payment activity:", error);
      }
    }
  }
}

// Register IPC handler
const paymentHandler = new PaymentHandler();

ipcMain.handle(
  "payment",
  withErrorHandling(
    // @ts-ignore
    paymentHandler.handleRequest.bind(paymentHandler),
    "IPC:payment",
  ),
);

module.exports = { PaymentHandler, paymentHandler };