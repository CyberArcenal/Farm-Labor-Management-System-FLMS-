// src/ipc/pitak/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class PitakHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllPitaks = this.importHandler("./get/all.ipc");
    this.getPitakById = this.importHandler("./get/by_id.ipc");
    this.getPitaksByStatus = this.importHandler("./get/by_status.ipc");
    this.getPitaksByBukid = this.importHandler("./get/by_bukid.ipc");
    this.getActivePitaks = this.importHandler("./get/active.ipc");
    this.getInactivePitaks = this.importHandler("./get/inactive.ipc");
    this.getCompletedPitaks = this.importHandler("./get/completed.ipc");
    this.getPitakStats = this.importHandler("./get/stats.ipc");
    this.getPitakWithAssignments = this.importHandler(
      "./get/with_assignments.ipc",
    );
    this.getPitakWithPayments = this.importHandler("./get/with_payments.ipc");
    this.searchPitaks = this.importHandler("./search.ipc");

    // 📊 REPORT HANDLERS
    this.getPitakReport = this.importHandler("./get/report.ipc");
    this.getPitakSummaryReport = this.importHandler("./get/summary.ipc");
    this.getPitakPerformanceReport = this.importHandler(
      "./get/performance.ipc",
    );
    this.getPitakLuWangReport = this.importHandler("./get/luwang_report.ipc");

    // ✏️ WRITE OPERATION HANDLERS (with transactions)
    this.createPitak = this.importHandler("./create.ipc.js");
    this.updatePitak = this.importHandler("./update.ipc.js");
    this.deletePitak = this.importHandler("./delete.ipc.js");
    this.updatePitakStatus = this.importHandler("./update_status.ipc.js");
    this.updatePitakLuWang = this.importHandler("./update_luwang.ipc.js");
    this.updatePitakLocation = this.importHandler("./update_location.ipc.js");
    this.transferPitakBukid = this.importHandler("./transfer_bukid.ipc.js");
    this.bulkUpdatePitaks = this.importHandler("./bulk_update.ipc.js");

    // 🔄 BATCH OPERATIONS
    this.bulkCreatePitaks = this.importHandler("./bulk_create.ipc.js");
    this.importPitaksFromCSV = this.importHandler("./import_csv.ipc.js");
    this.exportPitaksToCSV = this.importHandler("./export_csv.ipc.js");
    this.exportPitakAssignments = this.importHandler(
      "./export_assignments.ipc.js",
    );
    this.exportPitakPayments = this.importHandler("./export_payments.ipc.js");

    // 📈 ANALYTICS HANDLERS
    this.getPitakProductivity = this.importHandler(
      "./analytics/productivity.ipc",
    );
    this.getPitakUtilization = this.importHandler(
      "./analytics/utilization.ipc",
    );
    this.getPitakForecast = this.importHandler("./analytics/forecast.ipc");
    this.getPitakTrends = this.importHandler("./analytics/trends.ipc");

    // ⚙️ VALIDATION HANDLERS
    this.validatePitakData = this.importHandler("./validate_data.ipc.js");
    this.checkPitakAvailability = this.importHandler(
      "./check_availability.ipc.js",
    );
    this.validateLuWangCapacity = this.importHandler(
      "./validate_capacity.ipc.js",
    );
    this.checkDuplicatePitak = this.importHandler("./check_duplicate.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[PitakHandler] Failed to load handler: ${path}`,
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
        logger.info(`PitakHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllPitaks":
          // @ts-ignore
          return await this.getAllPitaks(enrichedParams.filters, userId);

        case "getPitakById":
          // @ts-ignore
          return await this.getPitakById(enrichedParams.id, userId);

        case "getPitaksByStatus":
          return await this.getPitaksByStatus(
            // @ts-ignore
            enrichedParams.status,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getPitaksByBukid":
          return await this.getPitaksByBukid(
            // @ts-ignore
            enrichedParams.bukid_id,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getActivePitaks":
          // @ts-ignore
          return await this.getActivePitaks(enrichedParams.filters, userId);

        case "getInactivePitaks":
          // @ts-ignore
          return await this.getInactivePitaks(enrichedParams.filters, userId);

        case "getCompletedPitaks":
          // @ts-ignore
          return await this.getCompletedPitaks(enrichedParams.filters, userId);

        case "getPitakStats":
          // @ts-ignore
          return await this.getPitakStats(enrichedParams.date_range, userId);

        case "getPitakWithAssignments":
          return await this.getPitakWithAssignments(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getPitakWithPayments":
          return await this.getPitakWithPayments(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "searchPitaks":
          // @ts-ignore
          return await this.searchPitaks(enrichedParams.query, userId);

        // 📊 REPORT OPERATIONS
        case "getPitakReport":
          return await this.getPitakReport(
            // @ts-ignore
            enrichedParams.date_range,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getPitakSummaryReport":
          return await this.getPitakSummaryReport(
            // @ts-ignore
            enrichedParams.bukid_id,
            // @ts-ignore
            enrichedParams.status,
            userId,
          );

        case "getPitakPerformanceReport":
          return await this.getPitakPerformanceReport(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getPitakLuWangReport":
          return await this.getPitakLuWangReport(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createPitak":
          return await this.handleWithTransaction(
            this.createPitak,
            enrichedParams,
          );

        case "updatePitak":
          return await this.handleWithTransaction(
            this.updatePitak,
            enrichedParams,
          );

        case "deletePitak":
          return await this.handleWithTransaction(
            this.deletePitak,
            enrichedParams,
          );

        case "updatePitakStatus":
          return await this.handleWithTransaction(
            this.updatePitakStatus,
            enrichedParams,
          );

        case "updatePitakLuWang":
          return await this.handleWithTransaction(
            this.updatePitakLuWang,
            enrichedParams,
          );

        case "updatePitakLocation":
          return await this.handleWithTransaction(
            this.updatePitakLocation,
            enrichedParams,
          );

        case "transferPitakBukid":
          return await this.handleWithTransaction(
            this.transferPitakBukid,
            enrichedParams,
          );

        case "bulkUpdatePitaks":
          return await this.handleWithTransaction(
            this.bulkUpdatePitaks,
            enrichedParams,
          );

        // 🔄 BATCH OPERATIONS
        case "bulkCreatePitaks":
          return await this.handleWithTransaction(
            this.bulkCreatePitaks,
            enrichedParams,
          );

        case "importPitaksFromCSV":
          return await this.handleWithTransaction(
            this.importPitaksFromCSV,
            enrichedParams,
          );

        case "exportPitaksToCSV":
          return await this.exportPitaksToCSV(enrichedParams);

        case "exportPitakAssignments":
          return await this.exportPitakAssignments(enrichedParams);

        case "exportPitakPayments":
          return await this.exportPitakPayments(enrichedParams);

        // 📈 ANALYTICS OPERATIONS
        case "getPitakProductivity":
          return await this.getPitakProductivity(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getPitakUtilization":
          return await this.getPitakUtilization(
            // @ts-ignore
            enrichedParams.bukid_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getPitakForecast":
          return await this.getPitakForecast(
            // @ts-ignore
            enrichedParams.bukid_id,
            // @ts-ignore
            enrichedParams.period,
            userId,
          );

        case "getPitakTrends":
          return await this.getPitakTrends(
            // @ts-ignore
            enrichedParams.bukid_id,
            // @ts-ignore
            enrichedParams.period,
            userId,
          );

        // ⚙️ VALIDATION OPERATIONS
        case "validatePitakData":
          return await this.validatePitakData(enrichedParams);

        case "checkPitakAvailability":
          return await this.checkPitakAvailability(enrichedParams);

        case "validateLuWangCapacity":
          return await this.validateLuWangCapacity(enrichedParams);

        case "checkDuplicatePitak":
          return await this.checkDuplicatePitak(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("PitakHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("PitakHandler error:", error);
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
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log pitak activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log pitak activity:", error);
      }
    }
  }
}

// Register IPC handler
const pitakHandler = new PitakHandler();

ipcMain.handle(
  "pitak",
  withErrorHandling(
    // @ts-ignore
    pitakHandler.handleRequest.bind(pitakHandler),
    "IPC:pitak",
  ),
);

module.exports = { PitakHandler, pitakHandler };
