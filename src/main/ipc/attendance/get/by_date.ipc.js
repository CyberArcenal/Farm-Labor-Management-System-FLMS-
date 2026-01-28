// src/ipc/attendance/get/by_date.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance records by specific date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (date, filters = {}, userId = 0) => {
  try {
    // Validate date parameter
    if (!date) {
      return {
        status: false,
        message: "Date parameter is required",
        data: null,
      };
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return {
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        data: null,
      };
    }

    // Set start and end of day
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const assignmentRepo = AppDataSource.getRepository("Assignment");
    // @ts-ignore
    const workerRepo = AppDataSource.getRepository("Worker");
    // @ts-ignore
    const pitakRepo = AppDataSource.getRepository("Pitak");
    // @ts-ignore
    const bukidRepo = AppDataSource.getRepository("Bukid");

    // Build query
    let query = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("pitak.bukid", "bukid")
      .leftJoinAndSelect("bukid.kabisilya", "kabisilya")
      .where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
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

    // @ts-ignore
    if (filters.kabisilya_id) {
      query = query.andWhere("kabisilya.id = :kabisilyaId", {
        // @ts-ignore
        kabisilyaId: filters.kabisilya_id,
      });
    }

    // Order by assignment date and worker name
    query = query
      .orderBy("assignment.assignmentDate", "ASC")
      .addOrderBy("worker.name", "ASC");

    const assignments = await query.getMany();

    // Transform the data
    const attendanceRecords = assignments.map((assignment) => ({
      id: assignment.id,
      assignment_date: assignment.assignmentDate,
      status: assignment.status,
      luwang_count: parseFloat(assignment.luwangCount),
      notes: assignment.notes,
      worker: {
        id: assignment.worker?.id,
        name: assignment.worker?.name,
        contact: assignment.worker?.contact,
        status: assignment.worker?.status,
      },
      pitak: {
        id: assignment.pitak?.id,
        location: assignment.pitak?.location,
        total_luwang: parseFloat(assignment.pitak?.totalLuwang),
        status: assignment.pitak?.status,
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
    }));

    // Get summary statistics
    const totalWorkers = attendanceRecords.length;
    const activeWorkers = attendanceRecords.filter(
      (record) => record.worker.status === "active",
    ).length;
    const totalLuwang = attendanceRecords.reduce(
      (sum, record) => sum + record.luwang_count,
      0,
    );

    return {
      status: true,
      message: `Attendance records retrieved for ${date}`,
      data: {
        date: date,
        total_records: totalWorkers,
        summary: {
          total_workers: totalWorkers,
          active_workers: activeWorkers,
          total_luwang: totalLuwang,
        },
        records: attendanceRecords,
      },
    };
  } catch (error) {
    console.error("Error getting attendance by date:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance: ${error.message}`,
      data: null,
    };
  }
};