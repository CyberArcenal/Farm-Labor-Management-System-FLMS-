// src/ipc/attendance/search/search.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Search attendance records
 * @param {Object} searchQuery - Search parameters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (searchQuery, userId = 0) => {
  try {
    if (!searchQuery || Object.keys(searchQuery).length === 0) {
      return {
        status: false,
        message: "Search query is required",
        data: null,
      };
    }

    const assignmentRepo = AppDataSource.getRepository("Assignment");

    // Build search query
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("pitak.bukid", "bukid")
      .leftJoinAndSelect("bukid.kabisilya", "kabisilya");

    // Apply search filters
    // @ts-ignore
    if (searchQuery.keyword) {
      // @ts-ignore
      const keyword = `%${searchQuery.keyword}%`;
      query = query.where(
        "(worker.name LIKE :keyword OR pitak.location LIKE :keyword OR bukid.name LIKE :keyword OR kabisilya.name LIKE :keyword OR assignment.notes LIKE :keyword)",
        { keyword },
      );
    }

    // @ts-ignore
    if (searchQuery.worker_name) {
      query = query.andWhere("worker.name LIKE :workerName", {
        // @ts-ignore
        workerName: `%${searchQuery.worker_name}%`,
      });
    }

    // @ts-ignore
    if (searchQuery.pitak_location) {
      query = query.andWhere("pitak.location LIKE :pitakLocation", {
        // @ts-ignore
        pitakLocation: `%${searchQuery.pitak_location}%`,
      });
    }

    // @ts-ignore
    if (searchQuery.bukid_name) {
      query = query.andWhere("bukid.name LIKE :bukidName", {
        // @ts-ignore
        bukidName: `%${searchQuery.bukid_name}%`,
      });
    }

    // @ts-ignore
    if (searchQuery.kabisilya_name) {
      query = query.andWhere("kabisilya.name LIKE :kabisilyaName", {
        // @ts-ignore
        kabisilyaName: `%${searchQuery.kabisilya_name}%`,
      });
    }

    // @ts-ignore
    if (searchQuery.status) {
      query = query.andWhere("assignment.status = :status", {
        // @ts-ignore
        status: searchQuery.status,
      });
    }

    // @ts-ignore
    if (searchQuery.startDate && searchQuery.endDate) {
      // @ts-ignore
      const start = new Date(searchQuery.startDate);
      // @ts-ignore
      const end = new Date(searchQuery.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      query = query.andWhere("assignment.assignmentDate BETWEEN :start AND :end", {
        start,
        end,
      });
    }

    // Apply pagination
    // @ts-ignore
    const page = parseInt(searchQuery.page) || 1;
    // @ts-ignore
    const limit = parseInt(searchQuery.limit) || 50;
    const skip = (page - 1) * limit;

    query = query
      .orderBy("assignment.assignmentDate", "DESC")
      .skip(skip)
      .take(limit);

    const [assignments, total] = await query.getManyAndCount();

    return {
      status: true,
      message: `Found ${total} attendance records`,
      data: {
        search_query: searchQuery,
        total_results: total,
        assignments: assignments.map((assignment) => ({
          id: assignment.id,
          assignment_date: assignment.assignmentDate,
          status: assignment.status,
          luwang_count: parseFloat(assignment.luwangCount),
          notes: assignment.notes,
          worker: {
            id: assignment.worker?.id,
            name: assignment.worker?.name,
            contact: assignment.worker?.contact,
          },
          pitak: {
            id: assignment.pitak?.id,
            location: assignment.pitak?.location,
          },
          bukid: {
            id: assignment.pitak?.bukid?.id,
            name: assignment.pitak?.bukid?.name,
          },
          kabisilya: {
            id: assignment.pitak?.bukid?.kabisilya?.id,
            name: assignment.pitak?.bukid?.kabisilya?.name,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error searching attendance records:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search attendance: ${error.message}`,
      data: null,
    };
  }
};