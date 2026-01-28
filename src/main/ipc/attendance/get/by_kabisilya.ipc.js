// src/ipc/attendance/get/by_kabisilya.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance records for a specific kabisilya
 * @param {number} kabisilyaId - Kabisilya ID
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (kabisilyaId, filters = {}, userId = 0) => {
  try {
    if (!kabisilyaId) {
      return {
        status: false,
        message: "Kabisilya ID is required",
        data: null,
      };
    }

    const kabisilyaRepo = AppDataSource.getRepository("Kabisilya");
    const workerRepo = AppDataSource.getRepository("Worker");
    const assignmentRepo = AppDataSource.getRepository("Assignment");

    // Get kabisilya details
    const kabisilya = await kabisilyaRepo.findOne({
      where: { id: kabisilyaId },
    });

    if (!kabisilya) {
      return {
        status: false,
        message: "Kabisilya not found",
        data: null,
      };
    }

    // Get all workers for this kabisilya
    const workers = await workerRepo.find({
      where: { kabisilyaId },
    });

    const workerIds = workers.map((worker) => worker.id);

    if (workerIds.length === 0) {
      return {
        status: true,
        message: `No workers found for kabisilya ${kabisilya.name}`,
        data: {
          kabisilya: {
            id: kabisilya.id,
            name: kabisilya.name,
          },
          statistics: {
            total_workers: 0,
            total_assignments: 0,
            total_luwang: 0,
          },
          workers: [],
          assignments: [],
        },
      };
    }

    // Build query for assignments
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("pitak.bukid", "bukid")
      .where("assignment.workerId IN (:...workerIds)", { workerIds });

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

    // Order by date
    query = query.orderBy("assignment.assignmentDate", "DESC");

    const assignments = await query.getMany();

    // Group by worker
    const groupedByWorker = assignments.reduce((acc, assignment) => {
      const workerId = assignment.worker?.id;
      if (!workerId) return acc;

      if (!acc[workerId]) {
        acc[workerId] = {
          worker_id: workerId,
          worker_name: assignment.worker?.name,
          total_assignments: 0,
          total_luwang: 0,
          assignments: [],
        };
      }

      acc[workerId].total_assignments++;
      acc[workerId].total_luwang += parseFloat(assignment.luwangCount);
      acc[workerId].assignments.push({
        assignment_id: assignment.id,
        assignment_date: assignment.assignmentDate,
        pitak_location: assignment.pitak?.location,
        bukid_name: assignment.pitak?.bukid?.name,
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
    const activeWorkers = workers.filter((w) => w.status === "active").length;
    const workersWithAssignments = Object.keys(groupedByWorker).length;

    // Calculate average attendance per worker
    const avgAssignmentsPerWorker = workers.length > 0 ? totalAssignments / workers.length : 0;
    const avgLuwangPerWorker = workers.length > 0 ? totalLuwang / workers.length : 0;

    return {
      status: true,
      message: `Attendance records for kabisilya ${kabisilya.name}`,
      data: {
        kabisilya: {
          id: kabisilya.id,
          name: kabisilya.name,
        },
        workers: workers.map((worker) => ({
          id: worker.id,
          name: worker.name,
          status: worker.status,
          contact: worker.contact,
          total_assignments: groupedByWorker[worker.id]?.total_assignments || 0,
          total_luwang: groupedByWorker[worker.id]?.total_luwang || 0,
        })),
        statistics: {
          total_workers: workers.length,
          active_workers: activeWorkers,
          workers_with_assignments: workersWithAssignments,
          total_assignments: totalAssignments,
          total_luwang: totalLuwang,
          average_assignments_per_worker: avgAssignmentsPerWorker,
          average_luwang_per_worker: avgLuwangPerWorker,
        },
        attendance_by_worker: Object.values(groupedByWorker),
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
    console.error("Error getting attendance by kabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance: ${error.message}`,
      data: null,
    };
  }
};