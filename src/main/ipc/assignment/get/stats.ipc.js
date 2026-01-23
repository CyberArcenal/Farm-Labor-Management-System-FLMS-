// src/ipc/assignment/get/stats.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get assignment statistics
 * @param {Object} dateRange - Date range for statistics
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (dateRange, userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange || {};
    
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    // Build base query
    let query = assignmentRepo.createQueryBuilder("assignment");
    
    if (startDate && endDate) {
      query.where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate
      });
    }

    const assignments = await query.getMany();

    // Calculate statistics
    const stats = {
      totalAssignments: assignments.length,
      totalLuWang: 0,
      byStatus: {
        active: { count: 0, totalLuWang: 0 },
        completed: { count: 0, totalLuWang: 0 },
        cancelled: { count: 0, totalLuWang: 0 }
      },
      byDate: {},
      averages: {
        luwangPerAssignment: 0,
        assignmentsPerDay: 0
      }
    };

    // Process assignments
    assignments.forEach((/** @type {{ luwangCount: string; assignmentDate: { toISOString: () => string; }; status: string | number; }} */ assignment) => {
      const luwang = parseFloat(assignment.luwangCount) || 0;
      const date = assignment.assignmentDate.toISOString().split('T')[0];
      
      // Update totals
      stats.totalLuWang += luwang;
      
      // Update by status
      // @ts-ignore
      const statusStats = stats.byStatus[assignment.status];
      if (statusStats) {
        statusStats.count++;
        statusStats.totalLuWang += luwang;
      }
      
      // Update by date
      // @ts-ignore
      if (!stats.byDate[date]) {
        // @ts-ignore
        stats.byDate[date] = {
          date,
          count: 0,
          totalLuWang: 0
        };
      }
      // @ts-ignore
      stats.byDate[date].count++;
      // @ts-ignore
      stats.byDate[date].totalLuWang += luwang;
    });

    // Calculate averages
    if (stats.totalAssignments > 0) {
      // @ts-ignore
      stats.averages.luwangPerAssignment = 
        (stats.totalLuWang / stats.totalAssignments).toFixed(2);
    }

    // Calculate assignments per day if date range is provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // @ts-ignore
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      // @ts-ignore
      stats.averages.assignmentsPerDay = (stats.totalAssignments / days).toFixed(1);
    }

    // Convert byDate to array and sort
    stats.byDate = Object.values(stats.byDate)
      // @ts-ignore
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // @ts-ignore
    stats.totalLuWang = stats.totalLuWang.toFixed(2);

    return {
      status: true,
      message: "Assignment statistics retrieved successfully",
      data: stats,
      meta: {
        dateRange: startDate && endDate ? { startDate, endDate } : 'All time'
      }
    };

  } catch (error) {
    console.error("Error getting assignment statistics:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve statistics: ${error.message}`,
      data: null
    };
  }
};