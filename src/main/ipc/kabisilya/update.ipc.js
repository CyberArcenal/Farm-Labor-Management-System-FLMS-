// src/ipc/kabisilya/update.ipc.js
//@ts-check

const { Not } = require("typeorm");
const Kabisilya = require("../../../entities/Kabisilya");

/**
 * Update Kabisilya
 * @param {Object} params - Update parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      id,
      // @ts-ignore
      name,
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

    if (!name || name.trim() === "") {
      return {
        status: false,
        message: "Kabisilya name is required",
        data: null
      };
    }

    const kabisilyaRepo = queryRunner.manager.getRepository(Kabisilya);
    
    // Find kabisilya
    const kabisilya = await kabisilyaRepo.findOne({
      where: { id }
    });

    if (!kabisilya) {
      return {
        status: false,
        message: "Kabisilya not found",
        data: null
      };
    }

    // Check if name is already taken by another kabisilya
    const existingKabisilya = await kabisilyaRepo.findOne({
      where: { 
        name: name.trim(),
        id: Not(id) // Exclude current kabisilya
      }
    });

    if (existingKabisilya) {
      return {
        status: false,
        message: "Another Kabisilya with this name already exists",
        data: null
      };
    }

    // Update kabisilya
    kabisilya.name = name.trim();
    kabisilya.updatedAt = new Date();

    const updatedKabisilya = await kabisilyaRepo.save(kabisilya);

    return {
      status: true,
      message: "Kabisilya updated successfully",
      data: {
        id: updatedKabisilya.id,
        name: updatedKabisilya.name,
        updatedAt: updatedKabisilya.updatedAt
      }
    };

  } catch (error) {
    console.error("Error updating kabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update kabisilya: ${error.message}`,
      data: null
    };
  }
};