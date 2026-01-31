// src/ipc/session/update.ipc.js
//@ts-check
const Session = require("../../../entities/Session");

/**
 * Update an existing Session
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

    if (!id) {
      return {
        status: false,
        message: "Session ID is required",
        data: null
      };
    }

    const sessionRepo = queryRunner.manager.getRepository(Session);
    
    // Get existing session
    const session = await sessionRepo.findOne({
      where: { id: id }
    });

    if (!session) {
      return {
        status: false,
        message: "Session not found",
        data: null
      };
    }

    // Check if session can be modified (not archived)
    if (session.status === "archived") {
      return {
        status: false,
        message: "Cannot modify an archived session",
        data: null
      };
    }

    // Check for name/year uniqueness if changed
    if (name && name !== session.name) {
      const yearToCheck = year || session.year;
      const existingSession = await sessionRepo.findOne({
        where: { 
          name: name.trim(),
          year: yearToCheck
        }
      });

      if (existingSession && existingSession.id !== id) {
        return {
          status: false,
          message: "Another session with this name and year already exists",
          data: null
        };
      }
    }

    // Update fields
    if (name !== undefined) session.name = name.trim();
    if (seasonType !== undefined) session.seasonType = seasonType;
    if (year !== undefined) session.year = year;
    if (startDate !== undefined) session.startDate = new Date(startDate);
    if (endDate !== undefined) session.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) session.status = status;
    
    session.updatedAt = new Date();

    const updatedSession = await sessionRepo.save(session);

    // Log activity (called from main handler)

    return {
      status: true,
      message: "Session updated successfully",
      data: updatedSession
    };

  } catch (error) {
    console.error("Error updating session:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update session: ${error.message}`,
      data: null
    };
  }
};