// src/ipc/attendance/get/by_date_range.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance records by date range
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (startDate, endDate, filters = {}, userId = 0) => {
  try {
    // Validate date parameters
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Both startDate and endDate parameters are required",
        data: null,
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        data: null,
      };
    }

    // Set time boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const assignmentRepo = AppDataSource.getRepository("Assignment");

    // Build query
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("pitak.bukid", "bukid")
      .leftJoinAndSelect("bukid.kabisilya", "kabisilya")
      .where("assignment.assignmentDate BETWEEN :start AND :end", {
        start,
        end,
      });

    // Apply additional filters
    // @ts-ignore
    if (filters.status) {
      query = query.andWhere("assignment.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.worker_id) {
      query = query.andWhere("assignment.workerId = :workerId", {
        // @ts-ignore
        workerId: filters.worker_id,
      });
    }

    // @ts-ignore
    if (filters.pitak_id) {
      query = query.andWhere("assignment.pitakId = :pitakId", {
        // @ts-ignore
        pitakId: filters.pitak_id,
      });
    }

    // @ts-ignore
    if (filters.bukid_id) {
      query = query.andWhere("pitak.bukidId = :bukidId", {
        // @ts-ignore
        bukidId: filters.bukid_id,
      });
    }

    // Group by date for summary
    query = query
      .orderBy("assignment.assignmentDate", "DESC")
      .addOrderBy("worker.name", "ASC");

    const assignments = await query.getMany();

    // Group assignments by date
    const groupedByDate = assignments.reduce((acc, assignment) => {
      const dateStr = assignment.assignmentDate.toISOString().split("T")[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          total_workers: 0,
          total_luwang: 0,
          assignments: [],
        };
      }
      
      acc[dateStr].total_workers++;
      acc[dateStr].total_luwang += parseFloat(assignment.luwangCount);
      acc[dateStr].assignments.push({
        id: assignment.id,
        worker_id: assignment.worker?.id,
        worker_name: assignment.worker?.name,
        pitak_id: assignment.pitak?.id,
        pitak_location: assignment.pitak?.location,
        luwang_count: parseFloat(assignment.luwangCount),
        status: assignment.status,
        notes: assignment.notes,
      });
      
      return acc;
    }, {});

    // Convert to array and sort by date
    const dailySummaries = Object.values(groupedByDate).sort(
      // @ts-ignore
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    // Calculate overall summary
    const totalDays = dailySummaries.length;
    const totalWorkers = assignments.length;
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );
    const avgWorkersPerDay = totalDays > 0 ? totalWorkers / totalDays : 0;
    const avgLuwangPerDay = totalDays > 0 ? totalLuwang / totalDays : 0;

    return {
      status: true,
      message: `Attendance records retrieved for ${startDate} to ${endDate}`,
      data: {
        date_range: {
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
        },
        summary: {
          total_assignments: totalWorkers,
          total_luwang: totalLuwang,
          average_workers_per_day: avgWorkersPerDay,
          average_luwang_per_day: avgLuwangPerDay,
        },
        daily_summaries: dailySummaries,
        raw_assignments: assignments.map((assignment) => ({
          id: assignment.id,
          assignment_date: assignment.assignmentDate,
          status: assignment.status,
          luwang_count: parseFloat(assignment.luwangCount),
          notes: assignment.notes,
          worker: {
            id: assignment.worker?.id,
            name: assignment.worker?.name,
          },
          pitak: {
            id: assignment.pitak?.id,
            location: assignment.pitak?.location,
          },
          bukid: {
            id: assignment.pitak?.bukid?.id,
            name: assignment.pitak?.bukid?.name,
          },
        })),
      },
    };
  } catch (error) {
    console.error("Error getting attendance by date range:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance: ${error.message}`,
      data: null,
    };
  }
};