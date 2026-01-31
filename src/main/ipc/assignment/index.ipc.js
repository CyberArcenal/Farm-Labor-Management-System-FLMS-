// assignment.ipc.js - Assignment Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class AssignmentHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllAssignments = this.importHandler("./get/all.ipc");
    this.getAssignmentById = this.importHandler("./get/by_id.ipc");
    this.getAssignmentsByDate = this.importHandler("./get/by_date.ipc");
    this.getAssignmentsByStatus = this.importHandler("./get/by_status.ipc");
    this.getAssignmentsByWorker = this.importHandler("./get/by_worker.ipc");
    this.getAssignmentsByPitak = this.importHandler("./get/by_pitak.ipc");
    this.getActiveAssignments = this.importHandler("./get/active.ipc");
    this.getCompletedAssignments = this.importHandler("./get/completed.ipc");
    this.getCancelledAssignments = this.importHandler("./get/cancelled.ipc");
    this.getAssignmentStats = this.importHandler("./get/stats.ipc");
    this.getAssignmentHistory = this.importHandler("./get/history.ipc");
    this.searchAssignments = this.importHandler("./search/search.ipc");

    // 📊 REPORT HANDLERS
    this.getAssignmentReport = this.importHandler("./get/report.ipc");
    this.getWorkerPerformanceReport = this.importHandler("./get/worker_performance.ipc");
    this.getPitakSummaryReport = this.importHandler("./get/pitak_summary.ipc");

    // ✏️ WRITE OPERATION HANDLERS (with transactions)
    this.createAssignment = this.importHandler("./create.ipc.js");
    this.updateAssignment = this.importHandler("./update/update.ipc.js");
    this.deleteAssignment = this.importHandler("./delete/delete.ipc.js");
    this.updateAssignmentStatus = this.importHandler("./update_status.ipc.js");
    this.bulkUpdateAssignments = this.importHandler("./bulk/bulk_update.ipc.js");
    this.reassignWorker = this.importHandler("./reassign_worker.ipc.js");
    this.updateLuWangCount = this.importHandler("./update_luwang_count.ipc.js");
    this.addAssignmentNote = this.importHandler("./add_note.ipc.js");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateAssignments = this.importHandler("./bulk_create.ipc.js");
    this.importAssignmentsFromCSV = this.importHandler("./import_csv.ipc.js");
    this.exportAssignmentsToCSV = this.importHandler("./export_csv.ipc.js");
    this.syncAssignmentsFromExternal = this.importHandler("./sync_external.ipc.js");

    // ⚙️ VALIDATION HANDLERS
    this.validateAssignmentData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkWorkerAvailability = this.importHandler("./check_worker_availability.ipc.js");
    this.validateLuWangCount = this.importHandler("./validation/validate_luwang_count.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[AssignmentHandler] Failed to load handler: ${path}`,
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
        logger.info(`AssignmentHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllAssignments":
          // @ts-ignore
          return await this.getAllAssignments(enrichedParams.filters, userId);

        case "getAssignmentById":
          // @ts-ignore
          return await this.getAssignmentById(enrichedParams.id, userId);

        case "getAssignmentsByDate":
          return await this.getAssignmentsByDate(
            // @ts-ignore
            enrichedParams.date,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAssignmentsByStatus":
          return await this.getAssignmentsByStatus(
            // @ts-ignore
            enrichedParams.status,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAssignmentsByWorker":
          return await this.getAssignmentsByWorker(
            // @ts-ignore
            enrichedParams.workerId,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAssignmentsByPitak":
          return await this.getAssignmentsByPitak(
            // @ts-ignore
            enrichedParams.pitakId,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getActiveAssignments":
          // @ts-ignore
          return await this.getActiveAssignments(enrichedParams.filters, userId);

        case "getCompletedAssignments":
          // @ts-ignore
          return await this.getCompletedAssignments(enrichedParams.filters, userId);

        case "getCancelledAssignments":
          // @ts-ignore
          return await this.getCancelledAssignments(enrichedParams.filters, userId);

        case "getAssignmentStats":
          // @ts-ignore
          return await this.getAssignmentStats(enrichedParams.date_range, userId);

        case "getAssignmentHistory":
          return await this.getAssignmentHistory(
            // @ts-ignore
            enrichedParams.assignment_id,
            userId,
          );

        case "searchAssignments":
          // @ts-ignore
          return await this.searchAssignments(enrichedParams.query, userId);

        // 📊 REPORT OPERATIONS
        case "getAssignmentReport":
          return await this.getAssignmentReport(
            // @ts-ignore
            enrichedParams.date_range,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getWorkerPerformanceReport":
          return await this.getWorkerPerformanceReport(
            // @ts-ignore
            enrichedParams.workerId,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getPitakSummaryReport":
          return await this.getPitakSummaryReport(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createAssignment":
          return await this.handleWithTransaction(
            this.createAssignment,
            enrichedParams,
          );

        case "updateAssignment":
          return await this.handleWithTransaction(
            this.updateAssignment,
            enrichedParams,
          );

        case "deleteAssignment":
          return await this.handleWithTransaction(
            this.deleteAssignment,
            enrichedParams,
          );

        case "updateAssignmentStatus":
          return await this.handleWithTransaction(
            this.updateAssignmentStatus,
            enrichedParams,
          );

        case "bulkUpdateAssignments":
          return await this.handleWithTransaction(
            this.bulkUpdateAssignments,
            enrichedParams,
          );

        case "reassignWorker":
          return await this.handleWithTransaction(
            this.reassignWorker,
            enrichedParams,
          );

        case "updateLuWangCount":
          return await this.handleWithTransaction(
            this.updateLuWangCount,
            enrichedParams,
          );

        case "addAssignmentNote":
          return await this.handleWithTransaction(
            this.addAssignmentNote,
            enrichedParams,
          );

        // 🔄 BATCH OPERATIONS
        case "bulkCreateAssignments":
          return await this.handleWithTransaction(
            this.bulkCreateAssignments,
            enrichedParams,
          );

        case "importAssignmentsFromCSV":
          return await this.handleWithTransaction(
            this.importAssignmentsFromCSV,
            enrichedParams,
          );

        case "exportAssignmentsToCSV":
          return await this.exportAssignmentsToCSV(enrichedParams);

        case "syncAssignmentsFromExternal":
          return await this.handleWithTransaction(
            this.syncAssignmentsFromExternal,
            enrichedParams,
          );

        // ⚙️ VALIDATION OPERATIONS
        case "validateAssignmentData":
          return await this.validateAssignmentData(enrichedParams);

        case "checkWorkerAvailability":
          return await this.checkWorkerAvailability(enrichedParams);

        case "validateLuWangCount":
          return await this.validateLuWangCount(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("AssignmentHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("AssignmentHandler error:", error);
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
 * Log user activity with session context
 * @param {any} user_id
 * @param {any} action
 * @param {any} description
 * @param {import("typeorm").QueryRunner} [qr] - optional query runner
 */
// @ts-ignore
async logActivity(user_id, action, description, qr = null) {
  try {
    let activityRepo;

    if (qr) {
      activityRepo = qr.manager.getRepository(UserActivity);
    } else {
      activityRepo = AppDataSource.getRepository(UserActivity);
    }

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      throw new Error("No default session configured. Please set one in Settings.");
    }

    // @ts-ignore
    const activity = activityRepo.create({
      user_id,
      action,
      description,
      session: { id: sessionId }, // 🔑 tie to default session
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });

    await activityRepo.save(activity);
  } catch (error) {
    console.warn("Failed to log activity:", error);
    if (logger) {
      // @ts-ignore
      logger.warn("Failed to log activity:", error);
    }
  }
}
}

// Register IPC handler
const assignmentHandler = new AssignmentHandler();

ipcMain.handle(
  "assignment",
  withErrorHandling(
    // @ts-ignore
    assignmentHandler.handleRequest.bind(assignmentHandler),
    "IPC:assignment",
  ),
);

module.exports = { AssignmentHandler, assignmentHandler };