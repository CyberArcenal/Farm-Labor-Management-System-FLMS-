// src/ipc/kabisilya/assign_bukid.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");

/**
 * Assign bukid to Kabisilya
 * @param {Object} params - Assignment parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      bukidId, 
      // @ts-ignore
      kabisilyaId,
      // @ts-ignore
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!bukidId || !kabisilyaId) {
      return {
        status: false,
        message: "Missing required fields: bukidId and kabisilyaId are required",
        data: null
      };
    }

    const bukidRepo = queryRunner.manager.getRepository(Bukid);
    
    // Find bukid
    const bukid = await bukidRepo.findOne({
      where: { id: bukidId },
      relations: ["kabisilya", "pitaks"]
    });

    if (!bukid) {
      return {
        status: false,
        message: "Bukid not found",
        data: null
      };
    }

    // Check if already assigned to same kabisilya
    // @ts-ignore
    if (bukid.kabisilya && bukid.kabisilya.id === kabisilyaId) {
      return {
        status: false,
        message: "Bukid is already assigned to this Kabisilya",
        data: null
      };
    }

    // Update bukid's kabisilya
    // @ts-ignore
    bukid.kabisilya = kabisilyaId;
    bukid.updatedAt = new Date();

    const updatedBukid = await bukidRepo.save(bukid);

    return {
      status: true,
      message: "Bukid assigned to Kabisilya successfully",
      data: {
        bukidId: updatedBukid.id,
        bukidName: updatedBukid.name,
        kabisilyaId: kabisilyaId,
        // @ts-ignore
        pitakCount: updatedBukid.pitaks ? updatedBukid.pitaks.length : 0
      }
    };

  } catch (error) {
    console.error("Error assigning bukid to kabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign bukid: ${error.message}`,
      data: null
    };
  }
};