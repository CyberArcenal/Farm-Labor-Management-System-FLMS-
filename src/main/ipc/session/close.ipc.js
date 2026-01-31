// src/ipc/session/close.ipc.js
//@ts-check
const Session = require("../../../entities/Session");

/**
 * Close a Session (set status to 'closed')
 * @param {Object} params - Close parameters
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
    if (session.status === "closed") {
      return {
        status: false,
        message: "Session is already closed",
        data: null
      };
    }

    if (session.status === "archived") {
      return {
        status: false,
        message: "Cannot close an archived session",
        data: null
      };
    }

    // Update status to closed
    session.status = "closed";
    session.endDate = session.endDate || new Date(); // Set end date if not set
    session.updatedAt = new Date();

    const updatedSession = await sessionRepo.save(session);

    // Log activity (called from main handler)

    return {
      status: true,
      message: "Session closed successfully",
      data: updatedSession
    };

  } catch (error) {
    console.error("Error closing session:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to close session: ${error.message}`,
      data: null
    };
  }
};