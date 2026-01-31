// src/ipc/session/archive.ipc.js
//@ts-check
const Session = require("../../../entities/Session");

/**
 * Archive a Session (set status to 'archived')
 * @param {Object} params - Archive parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      id,
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
    
    // Get session
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

    // Check current status
    if (session.status === "archived") {
      return {
        status: false,
        message: "Session is already archived",
        data: null
      };
    }

    // Update status to archived
    session.status = "archived";
    session.updatedAt = new Date();

    const updatedSession = await sessionRepo.save(session);

    // Log activity (called from main handler)

    return {
      status: true,
      message: "Session archived successfully",
      data: updatedSession
    };

  } catch (error) {
    console.error("Error archiving session:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to archive session: ${error.message}`,
      data: null
    };
  }
};