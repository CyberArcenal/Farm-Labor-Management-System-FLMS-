// src/ipc/kabisilya/get/all.ipc.js
//@ts-check

const Kabisilya = require("../../../../entities/Kabisilya");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get all Kabisilyas
 * @param {Object} filters - Optional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const kabisilyaRepo = AppDataSource.getRepository(Kabisilya);
    
    // Build query
    const query = kabisilyaRepo.createQueryBuilder("kabisilya")
      .leftJoinAndSelect("kabisilya.workers", "workers")
      .leftJoinAndSelect("kabisilya.bukids", "bukids")
      .orderBy("kabisilya.name", "ASC");

    // Apply filters if any
    // @ts-ignore
    if (filters.search) {
      query.where("kabisilya.name LIKE :search", { 
        // @ts-ignore
        search: `%${filters.search}%` 
      });
    }

    // @ts-ignore
    if (filters.withInactive === false) {
      // Example: if we had an isActive field
      // query.andWhere("kabisilya.isActive = :isActive", { isActive: true });
    }

    const kabisilyas = await query.getMany();

    return {
      status: true,
      message: "Kabisilyas retrieved successfully",
      // @ts-ignore
      data: kabisilyas.map(k => ({
        id: k.id,
        name: k.name,
        workerCount: k.workers ? k.workers.length : 0,
        bukidCount: k.bukids ? k.bukids.length : 0,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt
      }))
    };

  } catch (error) {
    console.error("Error getting kabisilyas:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get kabisilyas: ${error.message}`,
      data: null
    };
  }
};