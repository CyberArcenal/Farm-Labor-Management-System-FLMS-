// src/ipc/session/create.ipc.js
//@ts-check
const Session = require("../../../entities/Session");

/**
 * Create a new Session
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
      seasonType,
      // @ts-ignore
      year,
      // @ts-ignore
      startDate,
      // @ts-ignore
      endDate,
      // @ts-ignore
      status,
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!name || name.trim() === "") {
      return {
        status: false,
        message: "Session name is required",
        data: null
      };
    }

    if (!year) {
      return {
        status: false,
        message: "Year is required",
        data: null
      };
    }

    if (!startDate) {
      return {
        status: false,
        message: "Start date is required",
        data: null
      };
    }

    const sessionRepo = queryRunner.manager.getRepository(Session);
    
    // Check if session with same name and year already exists
    const existingSession = await sessionRepo.findOne({
      where: { 
        name: name.trim(),
        year: year 
      }
    });

    if (existingSession) {
      return {
        status: false,
        message: "Session with this name and year already exists",
        data: null
      };
    }

    // Create new session
    const newSession = sessionRepo.create({
      name: name.trim(),
      seasonType: seasonType || null,
      year: year,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: status || "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedSession = await sessionRepo.save(newSession);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: "Session created successfully",
      data: savedSession
    };

  } catch (error) {
    console.error("Error creating session:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create session: ${error.message}`,
      data: null
    };
  }
};