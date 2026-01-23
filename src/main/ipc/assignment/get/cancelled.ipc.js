// src/ipc/assignment/get/cancelled.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get cancelled assignments
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .where("assignment.status = :status", { status: 'cancelled' })
      .orderBy("assignment.assignmentDate", "DESC");

    // Apply date filters
    // @ts-ignore
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere("assignment.assignmentDate BETWEEN :dateFrom AND :dateTo", {
        // @ts-ignore
        dateFrom: filters.dateFrom,
        // @ts-ignore
        dateTo: filters.dateTo
      });
    }

    // Apply worker filter
    // @ts-ignore
    if (filters.workerId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.workerId = :workerId", { workerId: filters.workerId });
    }

    // Apply pitak filter
    // @ts-ignore
    if (filters.pitakId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.pitakId = :pitakId", { pitakId: filters.pitakId });
    }

    const assignments = await queryBuilder.getMany();
    
    // Calculate statistics
    const stats = {
      totalAssignments: assignments.length,
      totalLuWang: 0,
      averageLuWang: 0,
      byMonth: {},
      cancellationReasons: {}
    };

    // @ts-ignore
    const formattedAssignments = assignments.map(assignment => {
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // Update stats
      stats.totalLuWang += luwang;
      
      // Group by month
      const month = assignment.assignmentDate.toISOString().substring(0, 7);
      // @ts-ignore
      if (!stats.byMonth[month]) {
        // @ts-ignore
        stats.byMonth[month] = { count: 0, totalLuWang: 0 };
      }
      // @ts-ignore
      stats.byMonth[month].count++;
      // @ts-ignore
      stats.byMonth[month].totalLuWang += luwang;
      
      // Extract cancellation reasons from notes
      const notes = assignment.notes || '';
      if (notes.includes('[Status Change to CANCELLED]')) {
        const match = notes.match(/\[Status Change to CANCELLED\]:\s*(.+)/);
        if (match) {
          const reason = match[1].trim();
          // @ts-ignore
          if (!stats.cancellationReasons[reason]) {
            // @ts-ignore
            stats.cancellationReasons[reason] = 0;
          }
          // @ts-ignore
          stats.cancellationReasons[reason]++;
        }
      }

      return {
        id: assignment.id,
        luwangCount: luwang.toFixed(2),
        assignmentDate: assignment.assignmentDate,
        worker: assignment.worker ? {
          id: assignment.worker.id,
          name: assignment.worker.name,
          code: assignment.worker.code
        } : null,
        pitak: assignment.pitak ? {
          id: assignment.pitak.id,
          name: assignment.pitak.name,
          code: assignment.pitak.code
        } : null,
        notes: assignment.notes,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        cancelledAt: assignment.updatedAt // Assuming cancelled when status updated
      };
    });

    // Calculate averages
    if (stats.totalAssignments > 0) {
      // @ts-ignore
      stats.averageLuWang = (stats.totalLuWang / stats.totalAssignments).toFixed(2);
    }
    // @ts-ignore
    stats.totalLuWang = stats.totalLuWang.toFixed(2);
    
    // Convert byMonth to array
    stats.byMonth = Object.entries(stats.byMonth)
      .map(([month, data]) => ({
        month,
        ...data,
        averageLuWang: (data.totalLuWang / data.count).toFixed(2)
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
    
    // Convert cancellationReasons to array
    stats.cancellationReasons = Object.entries(stats.cancellationReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      status: true,
      message: "Cancelled assignments retrieved successfully",
      data: formattedAssignments,
      meta: {
        summary: stats,
        // @ts-ignore
        dateRange: filters.dateFrom && filters.dateTo ? {
          // @ts-ignore
          from: filters.dateFrom,
          // @ts-ignore
          to: filters.dateTo
        } : 'All time'
      }
    };

  } catch (error) {
    console.error("Error getting cancelled assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve cancelled assignments: ${error.message}`,
      data: null
    };
  }
};