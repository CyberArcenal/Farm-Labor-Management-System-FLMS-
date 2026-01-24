// ipc/worker/get_assignment_summary.ipc.js
//@ts-check

// @ts-ignore
const Worker = require("../../../entities/Worker");
// @ts-ignore
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
// @ts-ignore
const Payment = require("../../../entities/Payment");
// @ts-ignore
const Debt = require("../../../entities/Debt");
const Assignment = require("../../../entities/Assignment");

module.exports = async function getWorkerAssignmentSummary(params = {}) {
  try {
    // @ts-ignore
    const { workerId, startDate, endDate, groupBy = 'month', _userId } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const assignmentRepository = AppDataSource.getRepository(Assignment);

    // Build query
    const qb = assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.pitak', 'pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .where('assignment.workerId = :workerId', { workerId: parseInt(workerId) });

    // Apply date filter if provided
    if (startDate && endDate) {
      qb.andWhere('assignment.assignmentDate BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate)
      });
    }

    const assignments = await qb
      .orderBy('assignment.assignmentDate', 'DESC')
      .getMany();

    // Calculate summary
    const summary = {
      totalAssignments: assignments.length,
      totalLuwang: assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ assignment) => 
        sum + parseFloat(assignment.luwangCount || 0), 0
      ),
      byStatus: {
        active: assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'active').length,
        completed: assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length,
        cancelled: assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'cancelled').length
      },
      byBukid: {},
      byPitak: {},
      averageLuwang: assignments.length > 0 
        ? assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0) / assignments.length 
        : 0,
      recentActivity: assignments.slice(0, 5).map((/** @type {{ assignmentDate: any; luwangCount: any; status: any; pitak: { bukid: { name: any; }; location: any; }; }} */ a) => ({
        date: a.assignmentDate,
        luwang: a.luwangCount,
        status: a.status,
        bukid: a.pitak?.bukid?.name,
        pitak: a.pitak?.location
      }))
    };

    // Group by bukid and pitak
    assignments.forEach((/** @type {{ pitak: { bukid: { name: string; }; location: string; }; luwangCount: any; }} */ assignment) => {
      const bukidName = assignment.pitak?.bukid?.name || 'Unknown';
      const pitakLocation = assignment.pitak?.location || 'Unknown';

      // Group by bukid
      // @ts-ignore
      if (!summary.byBukid[bukidName]) {
        // @ts-ignore
        summary.byBukid[bukidName] = {
          count: 0,
          totalLuwang: 0,
          pitaks: new Set()
        };
      }
      // @ts-ignore
      summary.byBukid[bukidName].count++;
      // @ts-ignore
      summary.byBukid[bukidName].totalLuwang += parseFloat(assignment.luwangCount || 0);
      if (pitakLocation !== 'Unknown') {
        // @ts-ignore
        summary.byBukid[bukidName].pitaks.add(pitakLocation);
      }

      // Group by pitak
      // @ts-ignore
      if (!summary.byPitak[pitakLocation]) {
        // @ts-ignore
        summary.byPitak[pitakLocation] = {
          count: 0,
          totalLuwang: 0,
          bukid: bukidName
        };
      }
      // @ts-ignore
      summary.byPitak[pitakLocation].count++;
      // @ts-ignore
      summary.byPitak[pitakLocation].totalLuwang += parseFloat(assignment.luwangCount || 0);
    });

    // Convert sets to arrays for JSON serialization
    Object.keys(summary.byBukid).forEach(key => {
      // @ts-ignore
      summary.byBukid[key].pitaks = Array.from(summary.byBukid[key].pitaks);
    });

    // Group by time period if requested
    let groupedAssignments = {};
    if (groupBy && assignments.length > 0) {
      assignments.forEach((/** @type {{ assignmentDate: any; createdAt: any; luwangCount: any; status: string; }} */ assignment) => {
        let key;
        const date = assignment.assignmentDate || assignment.createdAt;
        
        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekNum = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          key = `${date.getFullYear()}-W${weekNum}`;
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (groupBy === 'year') {
          key = date.getFullYear().toString();
        }

        // @ts-ignore
        if (!groupedAssignments[key]) {
          // @ts-ignore
          groupedAssignments[key] = {
            period: key,
            count: 0,
            totalLuwang: 0,
            completed: 0,
            active: 0
          };
        }
        // @ts-ignore
        groupedAssignments[key].count++;
        // @ts-ignore
        groupedAssignments[key].totalLuwang += parseFloat(assignment.luwangCount || 0);
        // @ts-ignore
        if (assignment.status === 'completed') groupedAssignments[key].completed++;
        // @ts-ignore
        if (assignment.status === 'active') groupedAssignments[key].active++;
      });

      // Convert to array and sort
      groupedAssignments = Object.values(groupedAssignments).sort((a, b) => 
        a.period.localeCompare(b.period)
      );
    }

    return {
      status: true,
      message: 'Worker assignment summary retrieved successfully',
      data: {
        assignments,
        summary,
        groupedAssignments,
        productivity: {
          totalDaysWorked: new Set(assignments.map((/** @type {{ assignmentDate: any; createdAt: any; }} */ a) => 
            (a.assignmentDate || a.createdAt).toISOString().split('T')[0]
          )).size,
          averageLuwangPerDay: summary.totalAssignments > 0 ? 
            summary.totalLuwang / summary.totalAssignments : 0
        }
      }
    };
  } catch (error) {
    console.error('Error in getWorkerAssignmentSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker assignment summary: ${error.message}`,
      data: null
    };
  }
};