// src/ipc/kabisilya/get/bukids.ipc.js
//@ts-check

const Kabisilya = require("../../../../entities/Kabisilya");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get all bukids assigned to a Kabisilya
 * @param {number} kabisilyaId - Kabisilya ID
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
module.exports = async (kabisilyaId, userId) => {
  try {
    if (!kabisilyaId) {
      return {
        status: false,
        message: "Kabisilya ID is required",
        data: null
      };
    }

    const kabisilyaRepo = AppDataSource.getRepository(Kabisilya);
    
    const kabisilya = await kabisilyaRepo.findOne({
      where: { id: kabisilyaId },
      relations: ["bukids", "bukids.pitaks", "bukids.pitaks.assignments"]
    });

    if (!kabisilya) {
      return {
        status: false,
        message: "Kabisilya not found",
        data: null
      };
    }

    // Calculate stats for each bukid
    const bukidsWithStats = kabisilya.bukids ? kabisilya.bukids.map((/** @type {{ pitaks: { reduce: (arg0: { (sum: any, pitak: any): any; (sum: any, pitak: any): any; }, arg1: number) => any; filter: (arg0: (p: any) => boolean) => { (): any; new (): any; length: any; }; length: any; }; id: any; name: any; location: any; createdAt: any; updatedAt: any; }} */ bukid) => {
      const totalLuwang = bukid.pitaks 
        ? bukid.pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: string; }} */ pitak) => sum + parseFloat(pitak.totalLuwang), 0)
        : 0;
      
      const activePitaks = bukid.pitaks 
        ? bukid.pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'active').length
        : 0;

      const totalAssignments = bukid.pitaks 
        ? bukid.pitaks.reduce((/** @type {any} */ sum, /** @type {{ assignments: string | any[]; }} */ pitak) => 
            sum + (pitak.assignments ? pitak.assignments.length : 0), 0)
        : 0;

      return {
        id: bukid.id,
        name: bukid.name,
        location: bukid.location,
        totalLuwang: parseFloat(totalLuwang.toFixed(2)),
        pitakCount: bukid.pitaks ? bukid.pitaks.length : 0,
        activePitaks,
        totalAssignments,
        createdAt: bukid.createdAt,
        updatedAt: bukid.updatedAt
      };
    }) : [];

    return {
      status: true,
      message: "Bukids retrieved successfully",
      data: {
        kabisilyaId: kabisilya.id,
        kabisilyaName: kabisilya.name,
        bukidCount: bukidsWithStats.length,
        totalLuwang: bukidsWithStats.reduce((/** @type {any} */ sum, /** @type {{ totalLuwang: any; }} */ b) => sum + b.totalLuwang, 0),
        bukids: bukidsWithStats
      }
    };

  } catch (error) {
    console.error("Error getting kabisilya bukids:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get bukids: ${error.message}`,
      data: null
    };
  }
};