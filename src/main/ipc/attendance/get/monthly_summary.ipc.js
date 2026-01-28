// src/ipc/attendance/get/monthly_summary.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get monthly attendance summary
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (year, month, filters = {}, userId = 0) => {
  try {
    // Validate year and month
    if (!year || !month) {
      const today = new Date();
      year = year || today.getFullYear();
      month = month || today.getMonth() + 1;
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const assignmentRepo = AppDataSource.getRepository("Assignment");
    const workerRepo = AppDataSource.getRepository("Worker");

    // Get total active workers
    const activeWorkers = await workerRepo.find({
      where: { status: "active" },
    });

    // Build query for assignments
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

    // @ts-ignore
    if (filters.pitak_id) {
      query = query.andWhere("assignment.pitakId = :pitakId", {
        // @ts-ignore
        pitakId: filters.pitak_id,
      });
    }

    // @ts-ignore
    if (filters.status) {
      query = query.andWhere("assignment.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    const assignments = await query.getMany();

    // Group by day
    const daysInMonth = endDate.getDate();
    const dailySummary = {};

    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      // @ts-ignore
      dailySummary[dateStr] = {
        date: dateStr,
        day_of_week: new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' }),
        total_workers: 0,
        total_luwang: 0,
        workers: [],
        absent_workers: [],
      };
    }

    // Fill with actual data
    assignments.forEach((assignment) => {
      const dateStr = assignment.assignmentDate.toISOString().split("T")[0];
      
      // @ts-ignore
      if (dailySummary[dateStr]) {
        // @ts-ignore
        dailySummary[dateStr].total_workers++;
        // @ts-ignore
        dailySummary[dateStr].total_luwang += parseFloat(assignment.luwangCount);
        // @ts-ignore
        dailySummary[dateStr].workers.push({
          worker_id: assignment.worker?.id,
          worker_name: assignment.worker?.name,
          pitak: assignment.pitak?.location,
          luwang_count: parseFloat(assignment.luwangCount),
          status: assignment.status,
        });
      }
    });

    // Calculate absent workers for each day
    const assignedWorkerIdsByDay = {};
    
    assignments.forEach((assignment) => {
      const dateStr = assignment.assignmentDate.toISOString().split("T")[0];
      // @ts-ignore
      if (!assignedWorkerIdsByDay[dateStr]) {
        // @ts-ignore
        assignedWorkerIdsByDay[dateStr] = new Set();
      }
      // @ts-ignore
      assignedWorkerIdsByDay[dateStr].add(assignment.worker?.id);
    });

    // Fill absent workers
    Object.keys(dailySummary).forEach((dateStr) => {
      // @ts-ignore
      const assignedIds = assignedWorkerIdsByDay[dateStr] || new Set();
      const absent = activeWorkers.filter(
        (worker) => !assignedIds.has(worker.id),
      ).map((worker) => ({
        worker_id: worker.id,
        worker_name: worker.name,
        contact: worker.contact,
      }));
      
      // @ts-ignore
      dailySummary[dateStr].absent_workers = absent;
      // @ts-ignore
      dailySummary[dateStr].absent_count = absent.length;
    });

    // Calculate monthly statistics
    const dailySummaries = Object.values(dailySummary);
    const totalAssignments = assignments.length;
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );
    
    const workDays = dailySummaries.filter((day) => day.total_workers > 0).length;
    const totalWorkerDays = dailySummaries.reduce((sum, day) => sum + day.total_workers, 0);
    
    const avgWorkersPerDay = workDays > 0 ? totalWorkerDays / workDays : 0;
    const avgLuwangPerDay = workDays > 0 ? totalLuwang / workDays : 0;
    const avgLuwangPerWorker = totalWorkerDays > 0 ? totalLuwang / totalWorkerDays : 0;

    // Group by kabisilya
    const kabisilyaSummary = assignments.reduce((acc, assignment) => {
      const kabisilyaName = assignment.pitak?.bukid?.kabisilya?.name || "Unknown";
      
      if (!acc[kabisilyaName]) {
        acc[kabisilyaName] = {
          kabisilya_name: kabisilyaName,
          total_assignments: 0,
          total_luwang: 0,
          workers: new Set(),
        };
      }
      
      acc[kabisilyaName].total_assignments++;
      acc[kabisilyaName].total_luwang += parseFloat(assignment.luwangCount);
      acc[kabisilyaName].workers.add(assignment.worker?.id);
      
      return acc;
    }, {});

    // Convert sets to counts
    Object.keys(kabisilyaSummary).forEach((key) => {
      kabisilyaSummary[key].unique_workers = kabisilyaSummary[key].workers.size;
      delete kabisilyaSummary[key].workers;
    });

    // Top workers by luwang
    const workerPerformance = assignments.reduce((acc, assignment) => {
      const workerId = assignment.worker?.id;
      if (!workerId) return acc;

      if (!acc[workerId]) {
        acc[workerId] = {
          worker_id: workerId,
          worker_name: assignment.worker?.name,
          total_assignments: 0,
          total_luwang: 0,
        };
      }

      acc[workerId].total_assignments++;
      acc[workerId].total_luwang += parseFloat(assignment.luwangCount);

      return acc;
    }, {});

    const topWorkers = Object.values(workerPerformance)
      .sort((a, b) => b.total_luwang - a.total_luwang)
      .slice(0, 10);

    return {
      status: true,
      message: `Monthly attendance summary for ${year}-${month}`,
      data: {
        month: {
          year,
          month,
          month_name: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          days_in_month: daysInMonth,
          work_days: workDays,
        },
        statistics: {
          total_active_workers: activeWorkers.length,
          total_assignments: totalAssignments,
          total_worker_days: totalWorkerDays,
          total_luwang: totalLuwang,
          average_workers_per_day: avgWorkersPerDay.toFixed(2),
          average_luwang_per_day: avgLuwangPerDay.toFixed(2),
          average_luwang_per_worker: avgLuwangPerWorker.toFixed(2),
          overall_attendance_rate: activeWorkers.length > 0 
            ? ((totalWorkerDays / (activeWorkers.length * workDays)) * 100).toFixed(2) + '%'
            : '0%',
        },
        daily_summary: dailySummaries,
        kabisilya_summary: Object.values(kabisilyaSummary),
        top_performers: topWorkers,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("Error getting monthly attendance summary:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get monthly summary: ${error.message}`,
      data: null,
    };
  }
};