// src/ipc/session/get/by_id.ipc.js
//@ts-check
const Session = require("../../../../entities/Session");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get a session by ID with relations
 * @param {number} id - Session ID
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (id, userId = 0) => {
  try {
    if (!id || !Number.isInteger(id)) {
      return {
        status: false,
        message: "Valid Session ID is required",
        data: null,
      };
    }

    const sessionRepo = AppDataSource.getRepository(Session);

    // Always include debts relation
    const session = await sessionRepo.findOne({
      where: { id },
      relations: [
        "bukids",
        "bukids.pitaks",
        "assignments",
        "assignments.worker",
        "assignments.pitak",
        "payments",
        "payments.worker",
        "debts",
        "debts.worker",
        "userActivities",
      ],
    });

    if (!session) {
      return {
        status: false,
        message: "Session not found",
        data: null,
      };
    }

    return {
      status: true,
      message: "Session retrieved successfully",
      data: session,
    };
  } catch (error) {
    // @ts-ignore
    console.error("Error getting session by ID:", error.stack || error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get session: ${error.message}`,
      data: null,
    };
  }
};