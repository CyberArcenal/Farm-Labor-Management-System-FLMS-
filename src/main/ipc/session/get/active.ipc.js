// src/ipc/session/get/active.ipc.js
//@ts-check
const Session = require("../../../../entities/Session");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get only active sessions
 * @param {Object} params - Optional parameters
 * @param {number} [params.year] - Year filter
 * @param {boolean} [params.includeBukids] - Include bukids relation
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (params = {}, userId = 0) => {
  try {
    const { year, includeBukids = false } = params;

    const sessionRepo = AppDataSource.getRepository(Session);

    // Build query for active sessions
    const queryBuilder = sessionRepo
      .createQueryBuilder("session")
      .where("session.status = :status", { status: "active" })
      .orderBy("session.year", "DESC")
      .addOrderBy("session.startDate", "DESC");

    // Include bukids if requested
    if (includeBukids) {
      queryBuilder.leftJoinAndSelect("session.bukids", "bukids");
    }

    // Filter by year if provided
    if (year && Number.isInteger(year)) {
      queryBuilder.andWhere("session.year = :year", { year });
    }

    const sessions = await queryBuilder.getMany();

    return {
      status: true,
      message: "Active sessions retrieved successfully",
      data: sessions,
      count: sessions.length,
    };
  } catch (error) {
    // @ts-ignore
    console.error("Error getting active sessions:", error.stack || error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get active sessions: ${error.message}`,
      data: null,
      count: 0,
    };
  }
};