// src/ipc/kabisilya/get/by_id.ipc.js
//@ts-check

const Kabisilya = require("../../../../entities/Kabisilya");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get Kabisilya by ID
 * @param {number} id - Kabisilya ID
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
module.exports = async (id, userId) => {
  try {
    if (!id) {
      return {
        status: false,
        message: "Kabisilya ID is required",
        data: null
      };
    }

    const kabisilyaRepo = AppDataSource.getRepository(Kabisilya);
    
    const kabisilya = await kabisilyaRepo.findOne({
      where: { id },
      relations: ["workers", "bukids", "bukids.pitaks"]
    });

    if (!kabisilya) {
      return {
        status: false,
        message: "Kabisilya not found",
        data: null
      };
    }

    return {
      status: true,
      message: "Kabisilya retrieved successfully",
      data: {
        id: kabisilya.id,
        name: kabisilya.name,
        workers: kabisilya.workers ? kabisilya.workers.map((/** @type {{ id: any; name: any; contact: any; status: any; }} */ w) => ({
          id: w.id,
          name: w.name,
          contact: w.contact,
          status: w.status
        })) : [],
        bukids: kabisilya.bukids ? kabisilya.bukids.map((/** @type {{ id: any; name: any; location: any; pitaks: string | any[]; }} */ b) => ({
          id: b.id,
          name: b.name,
          location: b.location,
          pitakCount: b.pitaks ? b.pitaks.length : 0
        })) : [],
        createdAt: kabisilya.createdAt,
        updatedAt: kabisilya.updatedAt
      }
    };

  } catch (error) {
    console.error("Error getting kabisilya by ID:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get kabisilya: ${error.message}`,
      data: null
    };
  }
};