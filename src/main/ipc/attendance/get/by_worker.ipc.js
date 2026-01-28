// src/ipc/attendance/get/by_worker.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance records for a specific worker
 * @param {number} workerId - Worker ID
 * @param {Object} filters - Additional filters (date range, status, etc.)
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (workerId, filters = {}, userId = 0) => {
  try {
    // Validate worker ID
    if (!workerId) {
      return {
        status: false,
        message: "Worker ID is required",
        data: null,
      };
    }

    const workerRepo = AppDataSource.getRepository("Worker");
    const assignmentRepo = AppDataSource.getRepository("Assignment");

    // Check if worker exists
    const worker = await workerRepo.findOne({
      where: { id: workerId },
      relations: ["kabisilya"],
    });

    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null,
      };
    }

    // Build query for assignments
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("pitak.bukid", "bukid")
      .leftJoinAndSelect("bukid.kabisilya", "kabisilya")
      .where("assignment.workerId = :workerId", { workerId });

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
    // @ts-ignore
    } else if (filters.startDate) {
      // @ts-ignore
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      query = query.andWhere("assignment.assignmentDate >= :start", { start });
    // @ts-ignore
    } else if (filters.endDate) {
      // @ts-ignore
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query = query.andWhere("assignment.assignmentDate <= :end", { end });
    }

    // Apply status filter
    // @ts-ignore
    if (filters.status) {
      query = query.andWhere("assignment.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // Apply pitak filter
    // @ts-ignore
    if (filters.pitak_id) {
      query = query.andWhere("assignment.pitakId = :pitakId", {
        // @ts-ignore
        pitakId: filters.pitak_id,
      });
    }

    // Apply bukid filter
    // @ts-ignore
    if (filters.bukid_id) {
      query = query.andWhere("pitak.bukidId = :bukidId", {
        // @ts-ignore
        bukidId: filters.bukid_id,
      });
    }

    // Order by date (most recent first)
    query = query.orderBy("assignment.assignmentDate", "DESC");

    // Apply pagination
    // @ts-ignore
    const page = parseInt(filters.page) || 1;
    // @ts-ignore
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    query = query.skip(skip).take(limit);

    const [assignments, total] = await query.getManyAndCount();

    // Calculate worker statistics
    const totalAssignments = total;
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );

    // Get active assignments count
    const activeAssignments = assignments.filter(
      (assignment) => assignment.status === "active",
    ).length;

    // Get completed assignments count
    const completedAssignments = assignments.filter(
      (assignment) => assignment.status === "completed",
    ).length;

    // Group by month for monthly summary
    const monthlySummary = assignments.reduce((acc, assignment) => {
      const monthYear = assignment.assignmentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: monthYear,
          assignments_count: 0,
          total_luwang: 0,
          assignments: [],
        };
      }

      acc[monthYear].assignments_count++;
      acc[monthYear].total_luwang += parseFloat(assignment.luwangCount);
      acc[monthYear].assignments.push({
        id: assignment.id,
        date: assignment.assignmentDate,
        pitak: assignment.pitak?.location,
        luwang_count: parseFloat(assignment.luwangCount),
        status: assignment.status,
      });

      return acc;
    }, {});

    return {
      status: true,
      message: `Attendance records retrieved for worker ${worker.name}`,
      data: {
        worker: {
          id: worker.id,
          name: worker.name,
          contact: worker.contact,
          email: worker.email,
          status: worker.status,
          hire_date: worker.hireDate,
          kabisilya: worker.kabisilya?.name,
        },
        statistics: {
          total_assignments: totalAssignments,
          total_luwang: totalLuwang,
          active_assignments: activeAssignments,
          completed_assignments: completedAssignments,
          cancelled_assignments: totalAssignments - activeAssignments - completedAssignments,
        },
        assignments: assignments.map((assignment) => ({
          id: assignment.id,
          assignment_date: assignment.assignmentDate,
          status: assignment.status,
          luwang_count: parseFloat(assignment.luwangCount),
          notes: assignment.notes,
          pitak: {
            id: assignment.pitak?.id,
            location: assignment.pitak?.location,
            total_luwang: parseFloat(assignment.pitak?.totalLuwang),
          },
          bukid: {
            id: assignment.pitak?.bukid?.id,
            name: assignment.pitak?.bukid?.name,
            location: assignment.pitak?.bukid?.location,
          },
          kabisilya: {
            id: assignment.pitak?.bukid?.kabisilya?.id,
            name: assignment.pitak?.bukid?.kabisilya?.name,
          },
          created_at: assignment.createdAt,
          updated_at: assignment.updatedAt,
        })),
        monthly_summary: Object.values(monthlySummary),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error getting attendance by worker:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance: ${error.message}`,
      data: null,
    };
  }
};