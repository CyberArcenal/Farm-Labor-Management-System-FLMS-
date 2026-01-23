// src/ipc/kabisilya/delete.ipc.js
//@ts-check

const Kabisilya = require("../../../entities/Kabisilya");
const Worker = require("../../../entities/Worker");
const Bukid = require("../../../entities/Bukid");

/**
 * Delete Kabisilya
 * @param {Object} params - Delete parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      id,
      // @ts-ignore
      force = false, // Option to force delete even if there are dependencies
      // @ts-ignore
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!id) {
      return {
        status: false,
        message: "Kabisilya ID is required",
        data: null
      };
    }

    const kabisilyaRepo = queryRunner.manager.getRepository(Kabisilya);
    const workerRepo = queryRunner.manager.getRepository(Worker);
    const bukidRepo = queryRunner.manager.getRepository(Bukid);
    
    // Find kabisilya with relations
    const kabisilya = await kabisilyaRepo.findOne({
      where: { id },
      relations: ["workers", "bukids"]
    });

    if (!kabisilya) {
      return {
        status: false,
        message: "Kabisilya not found",
        data: null
      };
    }

    // Check dependencies if not force delete
    if (!force) {
      // @ts-ignore
      const workerCount = kabisilya.workers ? kabisilya.workers.length : 0;
      // @ts-ignore
      const bukidCount = kabisilya.bukids ? kabisilya.bukids.length : 0;

      if (workerCount > 0 || bukidCount > 0) {
        return {
          status: false,
          message: `Cannot delete Kabisilya. It has ${workerCount} worker(s) and ${bukidCount} bukid(s) assigned. Use force=true to delete anyway.`,
          data: {
            workerCount,
            bukidCount
          }
        };
      }
    }

    // If force delete, unassign all workers and bukids first
    if (force) {
      // Unassign workers
      // @ts-ignore
      if (kabisilya.workers && kabisilya.workers.length > 0) {
        // @ts-ignore
        await Promise.all(kabisilya.workers.map(async (/** @type {{ kabisilya: null; }} */ worker) => {
          worker.kabisilya = null;
          // @ts-ignore
          await workerRepo.save(worker);
        }));
      }

      // Unassign bukids
      // @ts-ignore
      if (kabisilya.bukids && kabisilya.bukids.length > 0) {
        // @ts-ignore
        await Promise.all(kabisilya.bukids.map(async (/** @type {{ kabisilya: null; }} */ bukid) => {
          bukid.kabisilya = null;
          // @ts-ignore
          await bukidRepo.save(bukid);
        }));
      }
    }

    // Delete kabisilya
    await kabisilyaRepo.delete(id);

    return {
      status: true,
      message: force 
        ? "Kabisilya force deleted successfully (workers and bukids unassigned)" 
        : "Kabisilya deleted successfully",
      data: {
        id,
        name: kabisilya.name,
        // @ts-ignore
        deletedWorkers: force ? (kabisilya.workers ? kabisilya.workers.length : 0) : 0,
        // @ts-ignore
        deletedBukids: force ? (kabisilya.bukids ? kabisilya.bukids.length : 0) : 0,
        deletedAt: new Date()
      }
    };

  } catch (error) {
    console.error("Error deleting kabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete kabisilya: ${error.message}`,
      data: null
    };
  }
};