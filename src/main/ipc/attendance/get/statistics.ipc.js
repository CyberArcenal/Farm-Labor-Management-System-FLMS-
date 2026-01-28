// src/ipc/attendance/get/statistics.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance statistics
 * @param {Object} dateRange - Date range
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (dateRange = {}, userId = 0) => {
  try {
    const assignmentRepo = AppDataSource.getRepository("Assignment");
    const workerRepo = AppDataSource.getRepository("Worker");
    // @ts-ignore
    const pitakRepo = AppDataSource.getRepository("Pitak");
    // @ts-ignore
    const bukidRepo = AppDataSource.getRepository("Bukid");
    // @ts-ignore
    const kabisilyaRepo = AppDataSource.getRepository("Kabisilya");

    // Set default date range if not provided
    let startDate, endDate;
    
    // @ts-ignore
    if (dateRange.startDate && dateRange.endDate) {
      // @ts-ignore
      startDate = new Date(dateRange.startDate);
      // @ts-ignore
      endDate = new Date(dateRange.endDate);
    } else {
      // Default to current month
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all active workers
    const activeWorkers = await workerRepo.find({
      where: { status: "active" },
      relations: ["kabisilya"],
    });

    // Get assignments for the date range
    const assignments = await assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("pitak.bukid", "bukid")
      .leftJoinAndSelect("bukid.kabisilya", "kabisilya")
      .where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .getMany();

    // Calculate date range statistics
    // @ts-ignore
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const workDays = [...new Set(assignments.map((a) => 
      a.assignmentDate.toISOString().split("T")[0]
    ))].length;

    // Calculate basic statistics
    const totalAssignments = assignments.length;
    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );

    // Status breakdown
    const statusBreakdown = assignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {});

    // Worker attendance statistics
    const workerStats = activeWorkers.map((worker) => {
      const workerAssignments = assignments.filter((a) => a.worker?.id === worker.id);
      const workerLuwang = workerAssignments.reduce(
        (sum, assignment) => sum + parseFloat(assignment.luwangCount),
        0,
      );
      
      return {
        worker_id: worker.id,
        worker_name: worker.name,
        total_assignments: workerAssignments.length,
        total_luwang: workerLuwang,
        attendance_rate: workDays > 0 ? (workerAssignments.length / workDays) * 100 : 0,
        kabisilya: worker.kabisilya?.name,
      };
    });

    // Top performers (by luwang)
    const topPerformers = [...workerStats]
      .sort((a, b) => b.total_luwang - a.total_luwang)
      .slice(0, 10);

    // Most active days
    const dailyActivity = assignments.reduce((acc, assignment) => {
      const dateStr = assignment.assignmentDate.toISOString().split("T")[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          assignments_count: 0,
          total_luwang: 0,
          workers: new Set(),
        };
      }
      
      acc[dateStr].assignments_count++;
      acc[dateStr].total_luwang += parseFloat(assignment.luwangCount);
      acc[dateStr].workers.add(assignment.worker?.id);
      
      return acc;
    }, {});

    Object.keys(dailyActivity).forEach((date) => {
      dailyActivity[date].unique_workers = dailyActivity[date].workers.size;
      delete dailyActivity[date].workers;
    });

    const mostActiveDays = Object.values(dailyActivity)
      .sort((a, b) => b.assignments_count - a.assignments_count)
      .slice(0, 10);

    // Kabisilya statistics
    const kabisilyaStats = assignments.reduce((acc, assignment) => {
      const kabisilyaId = assignment.pitak?.bukid?.kabisilya?.id;
      if (!kabisilyaId) return acc;

      if (!acc[kabisilyaId]) {
        acc[kabisilyaId] = {
          kabisilya_id: kabisilyaId,
          kabisilya_name: assignment.pitak?.bukid?.kabisilya?.name,
          total_assignments: 0,
          total_luwang: 0,
          workers: new Set(),
        };
      }

      acc[kabisilyaId].total_assignments++;
      acc[kabisilyaId].total_luwang += parseFloat(assignment.luwangCount);
      acc[kabisilyaId].workers.add(assignment.worker?.id);

      return acc;
    }, {});

    Object.keys(kabisilyaStats).forEach((id) => {
      kabisilyaStats[id].unique_workers = kabisilyaStats[id].workers.size;
      delete kabisilyaStats[id].workers;
    });

    // Pitak statistics
    const pitakStats = assignments.reduce((acc, assignment) => {
      const pitakId = assignment.pitak?.id;
      if (!pitakId) return acc;

      if (!acc[pitakId]) {
        acc[pitakId] = {
          pitak_id: pitakId,
          pitak_location: assignment.pitak?.location,
          total_assignments: 0,
          total_luwang: 0,
          workers: new Set(),
        };
      }

      acc[pitakId].total_assignments++;
      acc[pitakId].total_luwang += parseFloat(assignment.luwangCount);
      acc[pitakId].workers.add(assignment.worker?.id);

      return acc;
    }, {});

    Object.keys(pitakStats).forEach((id) => {
      pitakStats[id].unique_workers = pitakStats[id].workers.size;
      delete pitakStats[id].workers;
    });

    // Calculate trends (compare with previous period)
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    // @ts-ignore
    const periodLength = endDate - startDate;
    
    previousStartDate.setTime(previousStartDate.getTime() - periodLength);
    previousEndDate.setTime(previousEndDate.getTime() - periodLength);

    const previousAssignments = await assignmentRepo
      .createQueryBuilder("assignment")
      .where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate: previousStartDate,
        endDate: previousEndDate,
      })
      .getMany();

    const previousTotalAssignments = previousAssignments.length;
    const previousTotalLuwang = previousAssignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );

    // Calculate percentage changes
    const assignmentChange = previousTotalAssignments > 0 
      ? ((totalAssignments - previousTotalAssignments) / previousTotalAssignments) * 100
      : totalAssignments > 0 ? 100 : 0;
    
    const luwangChange = previousTotalLuwang > 0
      ? ((totalLuwang - previousTotalLuwang) / previousTotalLuwang) * 100
      : totalLuwang > 0 ? 100 : 0;

    return {
      status: true,
      message: `Attendance statistics for the period`,
      data: {
        date_range: {
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          total_days: totalDays,
          work_days: workDays,
        },
        overview: {
          total_active_workers: activeWorkers.length,
          total_assignments: totalAssignments,
          total_luwang: totalLuwang.toFixed(2),
          average_assignments_per_day: workDays > 0 ? (totalAssignments / workDays).toFixed(2) : 0,
          average_luwang_per_day: workDays > 0 ? (totalLuwang / workDays).toFixed(2) : 0,
          average_luwang_per_assignment: totalAssignments > 0 ? (totalLuwang / totalAssignments).toFixed(2) : 0,
        },
        trends: {
          assignment_change: assignmentChange.toFixed(2) + '%',
          luwang_change: luwangChange.toFixed(2) + '%',
          previous_period: {
            start_date: previousStartDate.toISOString().split("T")[0],
            end_date: previousEndDate.toISOString().split("T")[0],
            total_assignments: previousTotalAssignments,
            total_luwang: previousTotalLuwang.toFixed(2),
          },
        },
        status_breakdown: statusBreakdown,
        worker_statistics: {
          total_workers: activeWorkers.length,
          average_assignments_per_worker: activeWorkers.length > 0 ? (totalAssignments / activeWorkers.length).toFixed(2) : 0,
          average_luwang_per_worker: activeWorkers.length > 0 ? (totalLuwang / activeWorkers.length).toFixed(2) : 0,
          top_performers: topPerformers,
        },
        daily_activity: {
          most_active_days: mostActiveDays,
          busiest_day: mostActiveDays[0] || null,
        },
        kabisilya_statistics: Object.values(kabisilyaStats),
        pitak_statistics: Object.values(pitakStats),
      },
    };
  } catch (error) {
    console.error("Error getting attendance statistics:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get statistics: ${error.message}`,
      data: null,
    };
  }
};