// src/ipc/kabisilya/search.ipc.js
//@ts-check

const Kabisilya = require("../../../entities/Kabisilya");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Search Kabisilyas
 * @param {string} query - Search query
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
module.exports = async (query, userId) => {
  try {
    if (!query || query.trim() === "") {
      return {
        status: false,
        message: "Search query is required",
        data: null
      };
    }

    const kabisilyaRepo = AppDataSource.getRepository(Kabisilya);
    
    const kabisilyas = await kabisilyaRepo
      .createQueryBuilder("kabisilya")
      .leftJoinAndSelect("kabisilya.workers", "workers")
      .leftJoinAndSelect("kabisilya.bukids", "bukids")
      .where("kabisilya.name LIKE :query", { query: `%${query}%` })
      .orWhere("workers.name LIKE :query", { query: `%${query}%` })
      .orWhere("bukids.name LIKE :query", { query: `%${query}%` })
      .orderBy("kabisilya.name", "ASC")
      .getMany();

    return {
      status: true,
      message: "Search completed successfully",
      data: kabisilyas.map((/** @type {{ id: any; name: string; workers: any[]; bukids: string | any[]; createdAt: any; }} */ k) => ({
        id: k.id,
        name: k.name,
        matchType: k.name.toLowerCase().includes(query.toLowerCase()) 
          ? "name" 
          : k.workers?.some((/** @type {{ name: string; }} */ w) => w.name.toLowerCase().includes(query.toLowerCase()))
          ? "worker"
          : "bukid",
        workerCount: k.workers ? k.workers.length : 0,
        bukidCount: k.bukids ? k.bukids.length : 0,
        createdAt: k.createdAt
      }))
    };

  } catch (error) {
    console.error("Error searching kabisilyas:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search kabisilyas: ${error.message}`,
      data: null
    };
  }
};