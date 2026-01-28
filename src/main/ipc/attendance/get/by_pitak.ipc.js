// src/ipc/attendance/get/by_pitak.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance records for a specific pitak
 * @param {number} pitakId - Pitak ID
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (pitakId, filters = {}, userId = 0) => {
  try {
    if (!pitakId) {
      return {
        status: false,
        message: "Pitak ID is required",
        data: null,
      };
    }

    const pitakRepo = AppDataSource.getRepository("Pitak");
    const assignmentRepo = AppDataSource.getRepository("Assignment");

    // Get pitak details
    const pitak = await pitakRepo.findOne({
      where: { id: pitakId },
      relations: ["bukid"],
    });

    if (!pitak) {
      return {
        status: false,
        message: "Pitak not found",
        data: null,
      };
    }

    // Build query
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("worker.kabisilya", "kabisilya")
      .where("assignment.pitakId = :pitakId", { pitakId });

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

    // Apply worker filter
    // @ts-ignore
    if (filters.worker_id) {
      query = query.andWhere("assignment.workerId = :workerId", {
        // @ts-ignore
        workerId: filters.worker_id,
      });
    }

    // Order by date
    query = query.orderBy("assignment.assignmentDate", "DESC");

    const assignments = await query.getMany();

    // Group by date
    const groupedByDate = assignments.reduce((acc, assignment) => {
      const dateStr = assignment.assignmentDate.toISOString().split("T")[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          workers: [],
          total_luwang: 0,
        };
      }
      
      acc[dateStr].workers.push({
        worker_id: assignment.worker?.id,
        worker_name: assignment.worker?.name,
        luwang_count: parseFloat(assignment.luwangCount),
        status: assignment.status,
        kabisilya: assignment.worker?.kabisilya?.name,
      });
      
      acc[dateStr].total_luwang += parseFloat(assignment.luwangCount);
      
      return acc;
    }, {});

    // Calculate statistics
    const totalAssignments = assignments.length;
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );
    const uniqueWorkers = [...new Set(assignments.map((a) => a.worker?.id))].length;
    const uniqueDates = Object.keys(groupedByDate).length;

    return {
      status: true,
      message: `Attendance records for pitak ${pitak.location}`,
      data: {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          total_luwang: parseFloat(pitak.totalLuwang),
          status: pitak.status,
          bukid: pitak.bukid?.name,
        },
        statistics: {
          total_assignments: totalAssignments,
          total_luwang: totalLuwang,
          unique_workers: uniqueWorkers,
          work_days: uniqueDates,
          average_luwang_per_assignment: totalAssignments > 0 ? totalLuwang / totalAssignments : 0,
        },
        attendance_by_date: Object.values(groupedByDate),
        all_assignments: assignments.map((assignment) => ({
          id: assignment.id,
          assignment_date: assignment.assignmentDate,
          status: assignment.status,
          luwang_count: parseFloat(assignment.luwangCount),
          notes: assignment.notes,
          worker: {
            id: assignment.worker?.id,
            name: assignment.worker?.name,
            contact: assignment.worker?.contact,
            kabisilya: assignment.worker?.kabisilya?.name,
          },
        })),
      },
    };
  } catch (error) {
    console.error("Error getting attendance by pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance: ${error.message}`,
      data: null,
    };
  }
};