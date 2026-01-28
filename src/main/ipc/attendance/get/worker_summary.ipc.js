// src/ipc/attendance/get/worker_summary.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get attendance summary for a worker
 * @param {number} workerId - Worker ID
 * @param {Object} dateRange - Date range (optional)
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (workerId, dateRange = {}, userId = 0) => {
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

    // Get worker details
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
      .where("assignment.workerId = :workerId", { workerId });

    // Apply date range if provided
    // @ts-ignore
    if (dateRange.startDate && dateRange.endDate) {
      // @ts-ignore
      const start = new Date(dateRange.startDate);
      // @ts-ignore
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      query = query.andWhere("assignment.assignmentDate BETWEEN :start AND :end", {
        start,
        end,
      });
    }

    // Get all assignments for summary
    const assignments = await query.getMany();

    // Calculate statistics
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(
      (a) => a.status === "active",
    ).length;
    const completedAssignments = assignments.filter(
      (a) => a.status === "completed",
    ).length;
    const cancelledAssignments = assignments.filter(
      (a) => a.status === "cancelled",
    ).length;

    const totalLuwang = assignments.reduce(
      (sum, assignment) => sum + parseFloat(assignment.luwangCount),
      0,
    );
    const avgLuwangPerAssignment =
      totalAssignments > 0 ? totalLuwang / totalAssignments : 0;

    // Get recent assignments (last 10)
    const recentAssignments = await query
      .orderBy("assignment.assignmentDate", "DESC")
      .take(10)
      .getMany();

    // Get most frequent pitak
    const pitakFrequency = assignments.reduce((acc, assignment) => {
      const pitakId = assignment.pitak?.id;
      if (pitakId) {
        acc[pitakId] = (acc[pitakId] || 0) + 1;
      }
      return acc;
    }, {});

    let mostFrequentPitak = null;
    if (Object.keys(pitakFrequency).length > 0) {
      const maxPitakId = Object.keys(pitakFrequency).reduce((a, b) =>
        pitakFrequency[a] > pitakFrequency[b] ? a : b,
      );

      if (assignments[0]?.pitak) {
        mostFrequentPitak = {
          id: parseInt(maxPitakId),
          location: assignments.find((a) => a.pitak?.id === parseInt(maxPitakId))
            ?.pitak?.location,
          assignment_count: pitakFrequency[maxPitakId],
        };
      }
    }

    // Calculate attendance streak (consecutive days with assignments)
    const sortedDates = assignments
      .map((a) => new Date(a.assignmentDate).toDateString())
      .sort()
      .filter((value, index, self) => self.indexOf(value) === index); // Unique dates

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);
      // @ts-ignore
      const diffTime = Math.abs(nextDate - currentDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak + 1);
      } else {
        tempStreak = 0;
      }
    }

    currentStreak = tempStreak + 1;

    return {
      status: true,
      message: `Attendance summary retrieved for ${worker.name}`,
      data: {
        worker: {
          id: worker.id,
          name: worker.name,
          status: worker.status,
          hire_date: worker.hireDate,
          kabisilya: worker.kabisilya?.name,
        },
        summary: {
          total_assignments: totalAssignments,
          total_luwang: totalLuwang.toFixed(2),
          average_luwang_per_assignment: avgLuwangPerAssignment.toFixed(2),
          attendance_rate: totalAssignments > 0 ? ((totalAssignments - cancelledAssignments) / totalAssignments * 100).toFixed(2) + '%' : '0%',
        },
        status_breakdown: {
          active: activeAssignments,
          completed: completedAssignments,
          cancelled: cancelledAssignments,
        },
        performance: {
          current_streak: currentStreak,
          longest_streak: longestStreak,
          most_frequent_pitak: mostFrequentPitak,
          unique_pitaks_count: Object.keys(pitakFrequency).length,
        },
        recent_assignments: recentAssignments.map((assignment) => ({
          date: assignment.assignmentDate,
          pitak: assignment.pitak?.location,
          luwang_count: parseFloat(assignment.luwangCount),
          status: assignment.status,
        })),
        date_range: dateRange,
      },
    };
  } catch (error) {
    console.error("Error getting worker attendance summary:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get attendance summary: ${error.message}`,
      data: null,
    };
  }
};