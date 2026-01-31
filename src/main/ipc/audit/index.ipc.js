// ipc/auditTrail/index.ipc.js - Audit Trail Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

class AuditTrailHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllAuditTrails = this.importHandler("./get/all.ipc");
    this.getAuditTrailById = this.importHandler("./get/by_id.ipc");
    this.getAuditTrailsByAction = this.importHandler("./get/by_action.ipc");
    this.getAuditTrailsByActor = this.importHandler("./get/by_actor.ipc");
    this.getAuditTrailsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getRecentAuditTrails = this.importHandler("./get/recent.ipc");
    this.getAuditTrailStats = this.importHandler("./get/stats.ipc");
    this.searchAuditTrails = this.importHandler("./search.ipc");
    
    // 📊 FILTERING HANDLERS
    this.filterAuditTrails = this.importHandler("./filter.ipc");
    this.getAuditTrailSummary = this.importHandler("./get/summary.ipc");
    this.getActionsList = this.importHandler("./get/actions_list.ipc");
    this.getActorsList = this.importHandler("./get/actors_list.ipc");
    
    // 📈 REPORTING HANDLERS
    this.generateAuditReport = this.importHandler("./generate_report.ipc");
    this.exportAuditTrailsToCSV = this.importHandler("./export_csv.ipc");
    this.exportAuditTrailsToJSON = this.importHandler("./export_json.ipc");
    
    // 🔧 MAINTENANCE HANDLERS (Admin only)
    this.cleanupOldAuditTrails = this.importHandler("./cleanup_old.ipc");
    this.archiveAuditTrails = this.importHandler("./archive.ipc");
    this.compactAuditTrails = this.importHandler("./compact.ipc");
    
    // 👁️ MONITORING HANDLERS
    this.getAuditTrailActivity = this.importHandler("./get/activity.ipc");
    this.getSystemActivity = this.importHandler("./get/system_activity.ipc");
    this.getUserActivity = this.importHandler("./get/user_activity.ipc");
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
        `[AuditTrailHandler] Failed to load handler: ${path}`,
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
        logger.info(`AuditTrailHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllAuditTrails":
          return await this.getAllAuditTrails(enrichedParams);
        
        case "getAuditTrailById":
          return await this.getAuditTrailById(enrichedParams);
        
        case "getAuditTrailsByAction":
          return await this.getAuditTrailsByAction(enrichedParams);
        
        case "getAuditTrailsByActor":
          return await this.getAuditTrailsByActor(enrichedParams);
        
        case "getAuditTrailsByDateRange":
          return await this.getAuditTrailsByDateRange(enrichedParams);
        
        case "getRecentAuditTrails":
          return await this.getRecentAuditTrails(enrichedParams);
        
        case "getAuditTrailStats":
          return await this.getAuditTrailStats(enrichedParams);
        
        case "searchAuditTrails":
          return await this.searchAuditTrails(enrichedParams);

        // 📊 FILTERING OPERATIONS
        case "filterAuditTrails":
          return await this.filterAuditTrails(enrichedParams);
        
        case "getAuditTrailSummary":
          return await this.getAuditTrailSummary(enrichedParams);
        
        case "getActionsList":
          return await this.getActionsList(enrichedParams);
        
        case "getActorsList":
          return await this.getActorsList(enrichedParams);

        // 📈 REPORTING OPERATIONS
        case "generateAuditReport":
          return await this.generateAuditReport(enrichedParams);
        
        case "exportAuditTrailsToCSV":
          return await this.exportAuditTrailsToCSV(enrichedParams);
        
        case "exportAuditTrailsToJSON":
          return await this.exportAuditTrailsToJSON(enrichedParams);

        // 🔧 MAINTENANCE OPERATIONS (Admin only)
        case "cleanupOldAuditTrails":
          return await this.handleWithTransaction(this.cleanupOldAuditTrails, enrichedParams);
        
        case "archiveAuditTrails":
          return await this.handleWithTransaction(this.archiveAuditTrails, enrichedParams);
        
        case "compactAuditTrails":
          return await this.handleWithTransaction(this.compactAuditTrails, enrichedParams);

        // 👁️ MONITORING OPERATIONS
        case "getAuditTrailActivity":
          return await this.getAuditTrailActivity(enrichedParams);
        
        case "getSystemActivity":
          return await this.getSystemActivity(enrichedParams);
        
        case "getUserActivity":
          return await this.getUserActivity(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("AuditTrailHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("AuditTrailHandler error:", error);
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
   * Log audit trail activity (meta-audit)
   * @param {any} user_id
   * @param {any} action
   * @param {any} description
   * @param {any} qr
   */
  async logAuditAccess(user_id, action, description, qr = null) {
    try {
      let auditRepo;
      
      if (qr) {
        // @ts-ignore
        auditRepo = qr.manager.getRepository("AuditTrail");
      } else {
        auditRepo = AppDataSource.getRepository("AuditTrail");
      }
    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      throw new Error("No default session configured. Please set one in Settings.");
    }
      const auditEntry = auditRepo.create({
        action,
        actor: `User ${user_id}`,
        details: { description, access_type: "audit_trail_query" },
        timestamp: new Date()
      });

      await auditRepo.save(auditEntry);
    } catch (error) {
      console.warn("Failed to log audit trail access:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log audit trail access:", error);
      }
    }
  }
}

// Register IPC handler
const auditTrailHandler = new AuditTrailHandler();

ipcMain.handle(
  "auditTrail",
  withErrorHandling(
    // @ts-ignore
    auditTrailHandler.handleRequest.bind(auditTrailHandler),
    "IPC:auditTrail",
  ),
);

module.exports = { AuditTrailHandler, auditTrailHandler };