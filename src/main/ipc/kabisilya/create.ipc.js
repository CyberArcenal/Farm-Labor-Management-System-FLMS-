// src/ipc/kabisilya/create.ipc.js
//@ts-check

const Kabisilya = require("../../../entities/Kabisilya");

/**
 * Create a new Kabisilya
 * @param {Object} params - Create parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      name,
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!name || name.trim() === "") {
      return {
        status: false,
        message: "Kabisilya name is required",
        data: null
      };
    }

    const kabisilyaRepo = queryRunner.manager.getRepository(Kabisilya);
    
    // Check if kabisilya with same name already exists
    const existingKabisilya = await kabisilyaRepo.findOne({
      where: { name: name.trim() }
    });

    if (existingKabisilya) {
      return {
        status: false,
        message: "Kabisilya with this name already exists",
        data: null
      };
    }

    // Create new kabisilya
    const newKabisilya = kabisilyaRepo.create({
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedKabisilya = await kabisilyaRepo.save(newKabisilya);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: "Kabisilya created successfully",
      data: {
        id: savedKabisilya.id,
        name: savedKabisilya.name,
        createdAt: savedKabisilya.createdAt
      }
    };

  } catch (error) {
    console.error("Error creating kabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create kabisilya: ${error.message}`,
      data: null
    };
  }
};