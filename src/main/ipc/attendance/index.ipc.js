// src/ipc/attendance/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class AttendanceHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 ATTENDANCE HANDLERS
    this.getAttendanceByDate = this.importHandler("./get/by_date.ipc");
    this.getAttendanceByDateRange = this.importHandler(
      "./get/by_date_range.ipc",
    );
    this.getAttendanceByWorker = this.importHandler("./get/by_worker.ipc");
    this.getAttendanceByPitak = this.importHandler("./get/by_pitak.ipc");
    this.getAttendanceByBukid = this.importHandler("./get/by_bukid.ipc");
    this.getAttendanceByKabisilya = this.importHandler(
      "./get/by_kabisilya.ipc",
    );
    this.getWorkerAttendanceSummary = this.importHandler(
      "./get/worker_summary.ipc",
    );
    this.getDailyAttendanceReport = this.importHandler(
      "./get/daily_report.ipc",
    );
    this.getMonthlyAttendanceSummary = this.importHandler(
      "./get/monthly_summary.ipc",
    );
    this.getAttendanceStatistics = this.importHandler("./get/statistics.ipc");
    this.searchAttendanceRecords = this.importHandler("./search/search.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[AttendanceHandler] Failed to load handler: ${path}`,
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
      const enrichedParams = { ...params };

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`AttendanceHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 ATTENDANCE OPERATIONS
        case "getAttendanceByDate":
          return await this.getAttendanceByDate(
            // @ts-ignore
            enrichedParams.date,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAttendanceByDateRange":
          return await this.getAttendanceByDateRange(
            // @ts-ignore
            enrichedParams.startDate,
            // @ts-ignore
            enrichedParams.endDate,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAttendanceByWorker":
          return await this.getAttendanceByWorker(
            // @ts-ignore
            enrichedParams.worker_id,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAttendanceByPitak":
          return await this.getAttendanceByPitak(
            // @ts-ignore
            enrichedParams.pitak_id,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAttendanceByBukid":
          return await this.getAttendanceByBukid(
            // @ts-ignore
            enrichedParams.bukid_id,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAttendanceByKabisilya":
          return await this.getAttendanceByKabisilya(
            // @ts-ignore
            enrichedParams.kabisilya_id,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getWorkerAttendanceSummary":
          return await this.getWorkerAttendanceSummary(
            // @ts-ignore
            enrichedParams.worker_id,
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "getDailyAttendanceReport":
          return await this.getDailyAttendanceReport(
            // @ts-ignore
            enrichedParams.date,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getMonthlyAttendanceSummary":
          return await this.getMonthlyAttendanceSummary(
            // @ts-ignore
            enrichedParams.year,
            // @ts-ignore
            enrichedParams.month,
            // @ts-ignore
            enrichedParams.filters,
            userId,
          );

        case "getAttendanceStatistics":
          return await this.getAttendanceStatistics(
            // @ts-ignore
            enrichedParams.date_range,
            userId,
          );

        case "searchAttendanceRecords":
          // @ts-ignore
          return await this.searchAttendanceRecords(
            // @ts-ignore
            enrichedParams.query,
            userId,
          );

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("AttendanceHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("AttendanceHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }
}

// Register IPC handler
const attendanceHandler = new AttendanceHandler();

ipcMain.handle(
  "attendance",
  withErrorHandling(
    // @ts-ignore
    attendanceHandler.handleRequest.bind(attendanceHandler),
    "IPC:attendance",
  ),
);

module.exports = { AttendanceHandler, attendanceHandler };
