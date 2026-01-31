// // src/ipc/kabisilya/index.ipc.js
// //@ts-check
// const { ipcMain } = require("electron");
// const { withErrorHandling } = require("../../../utils/errorHandler");
// const { logger } = require("../../../utils/logger");
// const { AppDataSource } = require("../../db/dataSource");
// const UserActivity = require("../../../entities/UserActivity");

// class KabisilyaHandler {
//   constructor() {
//     this.initializeHandlers();
//   }

//   initializeHandlers() {
//     // 📋 READ-ONLY HANDLERS
//     this.getAllKabisilyas = this.importHandler("./get/all.ipc");
//     this.getKabisilyaById = this.importHandler("./get/by_id.ipc");
//     this.getKabisilyaWorkers = this.importHandler("./get/workers.ipc");
//     this.getKabisilyaBukids = this.importHandler("./get/bukids.ipc");
//     this.searchKabisilyas = this.importHandler("./search.ipc");

//     // ✏️ WRITE OPERATION HANDLERS
//     this.createKabisilya = this.importHandler("./create.ipc.js");
//     this.updateKabisilya = this.importHandler("./update.ipc.js");
//     this.deleteKabisilya = this.importHandler("./delete.ipc.js");
    
//     // 🔄 ASSIGNMENT HANDLERS
//     this.assignWorkerToKabisilya = this.importHandler("./assign_worker.ipc.js");
//     this.assignBukidToKabisilya = this.importHandler("./assign_bukid.ipc.js");
//   }

//   /**
//    * @param {string} path
//    */
//   importHandler(path) {
//     try {
//       return require(path);
//     } catch (error) {
//       console.warn(
//         `[KabisilyaHandler] Failed to load handler: ${path}`,
//         // @ts-ignore
//         error.message,
//       );
//       return async () => ({
//         status: false,
//         message: `Handler not found: ${path}`,
//         data: null,
//       });
//     }
//   }

//   /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
//   async handleRequest(event, payload) {
//     try {
//       const method = payload.method;
//       const params = payload.params || {};

//       // @ts-ignore
//       const userId = params.userId || event.sender.id || 0;
//       const enrichedParams = { ...params, _userId: userId };

//       // Log the request
//       if (logger) {
//         // @ts-ignore
//         logger.info(`KabisilyaHandler: ${method}`, { params, userId });
//       }

//       // ROUTE REQUESTS
//       switch (method) {
//         // 📋 READ-ONLY OPERATIONS
//         case "getAllKabisilyas":
//           // @ts-ignore
//           return await this.getAllKabisilyas(enrichedParams.filters, userId);

//         case "getKabisilyaById":
//           // @ts-ignore
//           return await this.getKabisilyaById(enrichedParams.id, userId);

//         case "getKabisilyaWorkers":
//           // @ts-ignore
//           return await this.getKabisilyaWorkers(enrichedParams.kabisilya_id, userId);

//         case "getKabisilyaBukids":
//           // @ts-ignore
//           return await this.getKabisilyaBukids(enrichedParams.kabisilya_id, userId);

//         case "searchKabisilyas":
//           // @ts-ignore
//           return await this.searchKabisilyas(enrichedParams.query, userId);

//         // ✏️ WRITE OPERATIONS
//         case "createKabisilya":
//           return await this.handleWithTransaction(
//             this.createKabisilya,
//             enrichedParams,
//           );

//         case "updateKabisilya":
//           return await this.handleWithTransaction(
//             this.updateKabisilya,
//             enrichedParams,
//           );

//         case "deleteKabisilya":
//           return await this.handleWithTransaction(
//             this.deleteKabisilya,
//             enrichedParams,
//           );

//         // 🔄 ASSIGNMENT OPERATIONS
//         case "assignWorkerToKabisilya":
//           return await this.handleWithTransaction(
//             this.assignWorkerToKabisilya,
//             enrichedParams,
//           );

//         case "assignBukidToKabisilya":
//           return await this.handleWithTransaction(
//             this.assignBukidToKabisilya,
//             enrichedParams,
//           );

//         default:
//           return {
//             status: false,
//             message: `Unknown method: ${method}`,
//             data: null,
//           };
//       }
//     } catch (error) {
//       console.error("KabisilyaHandler error:", error);
//       if (logger) {
//         // @ts-ignore
//         logger.error("KabisilyaHandler error:", error);
//       }
//       return {
//         status: false,
//         // @ts-ignore
//         message: error.message || "Internal server error",
//         data: null,
//       };
//     }
//   }

//   /**
//    * Wrap critical operations in a database transaction
//    * @param {(arg0: any, arg1: import("typeorm").QueryRunner) => any} handler
//    * @param {{ _userId: any; }} params
//    */
//   async handleWithTransaction(handler, params) {
//     const queryRunner = AppDataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       const result = await handler(params, queryRunner);

//       if (result.status) {
//         await queryRunner.commitTransaction();
//       } else {
//         await queryRunner.rollbackTransaction();
//       }

//       return result;
//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       throw error;
//     } finally {
//       await queryRunner.release();
//     }
//   }

//   /**
//    * @param {any} user_id
//    * @param {any} action
//    * @param {any} description
//    */
//   async logActivity(user_id, action, description, qr = null) {
//     try {
//       let activityRepo;

//       if (qr) {
//         // @ts-ignore
//         activityRepo = qr.manager.getRepository(UserActivity);
//       } else {
//         activityRepo = AppDataSource.getRepository(UserActivity);
//       }

//       const activity = activityRepo.create({
//         user_id: user_id,
//         action,
//         description,
//         ip_address: "127.0.0.1",
//         user_agent: "Kabisilya-Management-System",
//       });

//       await activityRepo.save(activity);
//     } catch (error) {
//       console.warn("Failed to log kabisilya activity:", error);
//       if (logger) {
//         // @ts-ignore
//         logger.warn("Failed to log kabisilya activity:", error);
//       }
//     }
//   }
// }

// // Register IPC handler
// const kabisilyaHandler = new KabisilyaHandler();

// ipcMain.handle(
//   "kabisilya",
//   withErrorHandling(
//     // @ts-ignore
//     kabisilyaHandler.handleRequest.bind(kabisilyaHandler),
//     "IPC:kabisilya",
//   ),
// );

// module.exports = { KabisilyaHandler, kabisilyaHandler };