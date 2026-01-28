// src/ipc/attendance/get/by_bukid.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance records for a specific bukid
 * @param {number} bukidId - Bukid ID
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (bukidId, filters = {}, userId = 0) => {
  try {
    if (!bukidId) {
      return {
        status: false,
        message: "Bukid ID is required",
        data: null,
      };
    }

    const bukidRepo = AppDataSource.getRepository("Bukid");
    const pitakRepo = AppDataSource.getRepository("Pitak");
    const assignmentRepo = AppDataSource.getRepository("Assignment");

    // Get bukid details
    const bukid = await bukidRepo.findOne({
      where: { id: bukidId },
      relations: ["kabisilya"],
    });

    if (!bukid) {
      return {
        status: false,
        message: "Bukid not found",
        data: null,
      };
    }

    // Get all pitaks for this bukid
    const pitaks = await pitakRepo.find({
      where: { bukidId },
    });

    const pitakIds = pitaks.map((pitak) => pitak.id);

    if (pitakIds.length === 0) {
      return {
        status: true,
        message: `No pitaks found for bukid ${bukid.name}`,
        data: {
          bukid: {
            id: bukid.id,
            name: bukid.name,
            location: bukid.location,
            status: bukid.status,
            kabisilya: bukid.kabisilya?.name,
          },
          statistics: {
            total_assignments: 0,
            total_luwang: 0,
            total_pitaks: 0,
            average_luwang_per_assignment: 0,
          },
          pitaks: [],
          assignments: [],
        },
      };
    }

    // Build query for assignments
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("worker.kabisilya", "workerKabisilya")
      .where("assignment.pitakId IN (:...pitakIds)", { pitakIds });

    // Apply date range filter
    // @ts-ignore
    if (filters.startDate && filters.endDate) {
      // @ts-ignore
      const start = new Date(filters.startDate);
      // @ts-ignore
      const end = new Date(filters.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      query = query.andWhere("assignment.assignmentDate BETWEEN :start AND :end", {
        start,
        end,
      });
    }

    // Apply status filter
    // @ts-ignore
    if (filters.status) {
      query = query.andWhere("assignment.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // Order by date
    query = query.orderBy("assignment.assignmentDate", "DESC");

    const assignments = await query.getMany();

    // Group by pitak
    const groupedByPitak = assignments.reduce((acc, assignment) => {
      const pitakId = assignment.pitak?.id;
      if (!pitakId) return acc;

      if (!acc[pitakId]) {
        acc[pitakId] = {
          pitak_id: pitakId,
          pitak_location: assignment.pitak?.location,
          total_assignments: 0,
          total_luwang: 0,
          assignments: [],
        };
      }

      acc[pitakId].total_assignments++;
      acc[pitakId].total_luwang += parseFloat(assignment.luwangCount);
      acc[pitakId].assignments.push({
        assignment_id: assignment.id,
        assignment_date: assignment.assignmentDate,
        worker_name: assignment.worker?.name,
        luwang_count: parseFloat(assignment.luwangCount),
        status: assignment.status,
      });

      return acc;
    }, {});

    // Calculate statistics
    const totalAssignments = assignments.length;
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );
    const uniqueWorkers = [...new Set(assignments.map((a) => a.worker?.id))].length;

    return {
      status: true,
      message: `Attendance records for bukid ${bukid.name}`,
      data: {
        bukid: {
          id: bukid.id,
          name: bukid.name,
          location: bukid.location,
          status: bukid.status,
          kabisilya: bukid.kabisilya?.name,
        },
        pitaks: pitaks.map((pitak) => ({
          id: pitak.id,
          location: pitak.location,
          total_luwang: parseFloat(pitak.totalLuwang),
          status: pitak.status,
        })),
        statistics: {
          total_pitaks: pitaks.length,
          total_assignments: totalAssignments,
          total_luwang: totalLuwang,
          unique_workers: uniqueWorkers,
          average_luwang_per_assignment: totalAssignments > 0 ? totalLuwang / totalAssignments : 0,
        },
        assignments_by_pitak: Object.values(groupedByPitak),
        all_assignments: assignments.map((assignment) => ({
          id: assignment.id,
          assignment_date: assignment.assignmentDate,
          status: assignment.status,
          luwang_count: parseFloat(assignment.luwangCount),
          notes: assignment.notes,
          worker: {
            id: assignment.worker?.id,
            name: assignment.worker?.name,
            kabisilya: assignment.worker?.kabisilya?.name,
          },
          pitak: {
            id: assignment.pitak?.id,
            location: assignment.pitak?.location,
          },
        })),
      },
    };
  } catch (error) {
    console.error("Error getting attendance by bukid:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance: ${error.message}`,
      data: null,
    };
  }
};