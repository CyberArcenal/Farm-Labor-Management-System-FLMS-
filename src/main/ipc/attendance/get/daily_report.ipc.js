// src/ipc/attendance/get/daily_report.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get daily attendance report
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (date, filters = {}, userId = 0) => {
  try {
    // Validate date
    if (!date) {
      // If no date provided, use today
      const today = new Date();
      date = today.toISOString().split("T")[0];
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
    const workerRepo = AppDataSource.getRepository("Worker");

    // Get all workers to check who's absent
    const allActiveWorkers = await workerRepo.find({
      where: { status: "active" },
      order: { name: "ASC" },
    });

    // Get assignments for the day
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

    // Apply filters
    // @ts-ignore
    if (filters.kabisilya_id) {
      query = query.andWhere("kabisilya.id = :kabisilyaId", {
        // @ts-ignore
        kabisilyaId: filters.kabisilya_id,
      });
    }

    // @ts-ignore
    if (filters.bukid_id) {
      query = query.andWhere("bukid.id = :bukidId", {
        // @ts-ignore
        bukidId: filters.bukid_id,
      });
    }

    const assignments = await query.getMany();

    // Create present workers list
    const presentWorkers = assignments.map((assignment) => ({
      id: assignment.worker.id,
      name: assignment.worker.name,
      contact: assignment.worker.contact,
      assignment_id: assignment.id,
      pitak: assignment.pitak?.location,
      bukid: assignment.pitak?.bukid?.name,
      kabisilya: assignment.pitak?.bukid?.kabisilya?.name,
      luwang_count: parseFloat(assignment.luwangCount),
      status: assignment.status,
      assignment_notes: assignment.notes,
    }));

    // Create absent workers list
    const presentWorkerIds = assignments.map((a) => a.worker.id);
    const absentWorkers = allActiveWorkers
      .filter((worker) => !presentWorkerIds.includes(worker.id))
      .map((worker) => ({
        id: worker.id,
        name: worker.name,
        contact: worker.contact,
        kabisilya: worker.kabisilya?.name,
        status: worker.status,
      }));

    // Group by kabisilya
    const kabisilyaGroups = {};
    
    assignments.forEach((assignment) => {
      const kabisilyaName = assignment.pitak?.bukid?.kabisilya?.name || "Unknown";
      
      // @ts-ignore
      if (!kabisilyaGroups[kabisilyaName]) {
        // @ts-ignore
        kabisilyaGroups[kabisilyaName] = {
          kabisilya_name: kabisilyaName,
          worker_count: 0,
          total_luwang: 0,
          workers: [],
        };
      }
      
      // @ts-ignore
      kabisilyaGroups[kabisilyaName].worker_count++;
      // @ts-ignore
      kabisilyaGroups[kabisilyaName].total_luwang += parseFloat(assignment.luwangCount);
      // @ts-ignore
      kabisilyaGroups[kabisilyaName].workers.push({
        worker_name: assignment.worker.name,
        pitak: assignment.pitak?.location,
        luwang_count: parseFloat(assignment.luwangCount),
      });
    });

    // Calculate statistics
    const totalActiveWorkers = allActiveWorkers.length;
    const totalPresent = presentWorkers.length;
    const totalAbsent = absentWorkers.length;
    const attendanceRate = totalActiveWorkers > 0 
      ? ((totalPresent / totalActiveWorkers) * 100).toFixed(2) + '%'
      : '0%';
    
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );

    return {
      status: true,
      message: `Daily attendance report for ${date}`,
      data: {
        report_date: date,
        summary: {
          total_active_workers: totalActiveWorkers,
          workers_present: totalPresent,
          workers_absent: totalAbsent,
          attendance_rate: attendanceRate,
          total_luwang: totalLuwang,
        },
        attendance_by_kabisilya: Object.values(kabisilyaGroups),
        present_workers: presentWorkers,
        absent_workers: absentWorkers,
        detailed_assignments: assignments.map((assignment) => ({
          assignment_id: assignment.id,
          assignment_date: assignment.assignmentDate,
          status: assignment.status,
          luwang_count: parseFloat(assignment.luwangCount),
          notes: assignment.notes,
          worker: {
            id: assignment.worker.id,
            name: assignment.worker.name,
            contact: assignment.worker.contact,
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
      },
    };
  } catch (error) {
    console.error("Error getting daily attendance report:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get daily report: ${error.message}`,
      data: null,
    };
  }
};