// src/ipc/session/get/all.ipc.js
//@ts-check

const Session = require("../../../../entities/Session");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get all sessions with optional filters
 * @param {Object} filters - Filter parameters
 * @param {string} [filters.status] - Session status filter
 * @param {number} [filters.year] - Year filter
 * @param {string} [filters.search] - Search keyword
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (filters = {}, userId = 0) => {
  try {
    const sessionRepo = AppDataSource.getRepository(Session);

    // Build query
    const queryBuilder = sessionRepo
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.bukids", "bukids")
      .orderBy("session.year", "DESC")
      .addOrderBy("session.startDate", "DESC");

    // Apply filters safely
    if (filters.status && filters.status.trim() !== "") {
      queryBuilder.andWhere("session.status = :status", {
        status: filters.status,
      });
    }

    if (filters.year && Number.isInteger(filters.year)) {
      queryBuilder.andWhere("session.year = :year", { year: filters.year });
    }

    if (filters.search && filters.search.trim() !== "") {
      queryBuilder.andWhere(
        "(session.name ILIKE :search OR session.seasonType ILIKE :search)",
        {
          search: `%${filters.search}%`,
        }
      );
    }

    const sessions = await queryBuilder.getMany();

    return {
      status: true,
      message: "Sessions retrieved successfully",
      data: sessions,
    };
  } catch (error) {
    // @ts-ignore
    console.error("Error getting sessions:", error.stack || error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get sessions: ${error.message}`,
      data: null,
    };
  }
};