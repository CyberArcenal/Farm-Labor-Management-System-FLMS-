// ipc/bukid/index.ipc.js - Bukid Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");

class BukidHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllBukid = this.importHandler("./get/all.ipc");
    this.getBukidById = this.importHandler("./get/by_id.ipc");
    this.getBukidByKabisilya = this.importHandler("./get/by_kabisilya.ipc");
    this.getBukidByName = this.importHandler("./get/by_name.ipc");
    this.getBukidByLocation = this.importHandler("./get/by_location.ipc");
    this.getBukidWithPitaks = this.importHandler("./get/with_pitaks.ipc");
    this.getBukidSummary = this.importHandler("./get/summary.ipc");
    this.getActiveBukid = this.importHandler("./get/active.ipc");
    this.getBukidStats = this.importHandler("./get/stats.ipc");
    this.searchBukid = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createBukid = this.importHandler("./create.ipc");
    this.updateBukid = this.importHandler("./update.ipc");
    this.deleteBukid = this.importHandler("./delete.ipc");
    this.updateBukidStatus = this.importHandler("./update_status.ipc");
    this.addBukidNote = this.importHandler("./add_note.ipc");

    // 🔗 RELATIONSHIP HANDLERS
    this.assignToKabisilya = this.importHandler("./assign_to_kabisilya.ipc");
    this.removeFromKabisilya = this.importHandler("./remove_from_kabisilya.ipc");
    this.getKabisilyaInfo = this.importHandler("./get_kabisilya_info.ipc");

    // 📊 STATISTICS HANDLERS
    this.getPitakCounts = this.importHandler("./get_pitak_counts.ipc");
    this.getWorkerCounts = this.importHandler("./get_worker_counts.ipc");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateBukid = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateBukid = this.importHandler("./bulk_update.ipc");
    this.importBukidFromCSV = this.importHandler("./import_csv.ipc");
    this.exportBukidToCSV = this.importHandler("./export_csv.ipc");
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
        `[BukidHandler] Failed to load handler: ${path}`,
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
        logger.info(`BukidHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllBukid":
          return await this.getAllBukid(enrichedParams);
        
        case "getBukidById":
          return await this.getBukidById(enrichedParams);
        
        case "getBukidByKabisilya":
          return await this.getBukidByKabisilya(enrichedParams);
        
        case "getBukidByName":
          return await this.getBukidByName(enrichedParams);
        
        case "getBukidByLocation":
          return await this.getBukidByLocation(enrichedParams);
        
        case "getBukidWithPitaks":
          return await this.getBukidWithPitaks(enrichedParams);
        
        case "getBukidSummary":
          return await this.getBukidSummary(enrichedParams);
        
        case "getActiveBukid":
          return await this.getActiveBukid(enrichedParams);
        
        case "getBukidStats":
          return await this.getBukidStats(enrichedParams);
        
        case "searchBukid":
          return await this.searchBukid(enrichedParams);

        // ✏️ WRITE OPERATIONS
        case "createBukid":
          return await this.handleWithTransaction(this.createBukid, enrichedParams);
        
        case "updateBukid":
          return await this.handleWithTransaction(this.updateBukid, enrichedParams);
        
        case "deleteBukid":
          return await this.handleWithTransaction(this.deleteBukid, enrichedParams);
        
        case "updateBukidStatus":
          return await this.handleWithTransaction(this.updateBukidStatus, enrichedParams);
        
        case "addBukidNote":
          return await this.handleWithTransaction(this.addBukidNote, enrichedParams);

        // 🔗 RELATIONSHIP OPERATIONS
        case "assignToKabisilya":
          return await this.handleWithTransaction(this.assignToKabisilya, enrichedParams);
        
        case "removeFromKabisilya":
          return await this.handleWithTransaction(this.removeFromKabisilya, enrichedParams);
        
        case "getKabisilyaInfo":
          return await this.getKabisilyaInfo(enrichedParams);

        // 📊 STATISTICS OPERATIONS
        case "getPitakCounts":
          return await this.getPitakCounts(enrichedParams);
        
        case "getWorkerCounts":
          return await this.getWorkerCounts(enrichedParams);

        // 🔄 BATCH OPERATIONS
        case "bulkCreateBukid":
          return await this.handleWithTransaction(this.bulkCreateBukid, enrichedParams);
        
        case "bulkUpdateBukid":
          return await this.handleWithTransaction(this.bulkUpdateBukid, enrichedParams);
        
        case "importBukidFromCSV":
          return await this.handleWithTransaction(this.importBukidFromCSV, enrichedParams);
        
        case "exportBukidToCSV":
          return await this.exportBukidToCSV(enrichedParams);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("BukidHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("BukidHandler error:", error);
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

      const activity = activityRepo.create({
        user_id: user_id,
        action,
        description,
        ip_address: "127.0.0.1",
        user_agent: "Kabisilya-Management-System",
        created_at: new Date()
      });

      await activityRepo.save(activity);
    } catch (error) {
      console.warn("Failed to log bukid activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log bukid activity:", error);
      }
    }
  }
}

// Register IPC handler
const bukidHandler = new BukidHandler();

ipcMain.handle(
  "bukid",
  withErrorHandling(
    // @ts-ignore
    bukidHandler.handleRequest.bind(bukidHandler),
    "IPC:bukid",
  ),
);

module.exports = { BukidHandler, bukidHandler };