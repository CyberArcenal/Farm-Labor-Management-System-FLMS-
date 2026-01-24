// ipc/worker/get/with_assignments.ipc.js (Optimized)
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerWithAssignments(params = {}) {
  try {
    // @ts-ignore
    const { id, startDate, endDate, groupBy = 'none', _userId } = params;

    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    const worker = await workerRepository.findOne({
      where: { id: parseInt(id) },
      relations: [
        'kabisilya', 
        'assignments', 
        'assignments.pitak',
        'assignments.pitak.bukid'
      ]
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Filter assignments by date if specified
    let filteredAssignments = worker.assignments || [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredAssignments = filteredAssignments.filter((/** @type {{ assignmentDate: any; createdAt: any; }} */ assignment) => {
        const assignmentDate = new Date(assignment.assignmentDate || assignment.createdAt);
        return assignmentDate >= start && assignmentDate <= end;
      });
    }

    // Calculate summary
    const totalAssignments = filteredAssignments.length;
    const activeAssignments = filteredAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'active').length;
    const completedAssignments = filteredAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length;
    const cancelledAssignments = filteredAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'cancelled').length;
    
    const totalLuwang = filteredAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ assignment) => 
      sum + parseFloat(assignment.luwangCount || 0), 0
    );

    // Group by different criteria
    const groupedData = {
      byPitak: {},
      byBukid: {},
      byStatus: {},
      byDate: {}
    };

    filteredAssignments.forEach((/** @type {{ pitak: { id: string; location: string; bukid: { name: string; }; }; status: string; assignmentDate: { toISOString: () => string; }; luwangCount: any; id: any; }} */ assignment) => {
      const pitakId = assignment.pitak?.id || 'unknown';
      const pitakLocation = assignment.pitak?.location || 'Unknown';
      const bukidName = assignment.pitak?.bukid?.name || 'Unknown';
      const status = assignment.status || 'unknown';
      const dateKey = assignment.assignmentDate ? 
        assignment.assignmentDate.toISOString().split('T')[0] : 
        'unknown';

      // Group by pitak
      // @ts-ignore
      if (!groupedData.byPitak[pitakId]) {
        // @ts-ignore
        groupedData.byPitak[pitakId] = {
          id: pitakId,
          location: pitakLocation,
          bukid: bukidName,
          count: 0,
          totalLuwang: 0,
          assignments: []
        };
      }
      // @ts-ignore
      groupedData.byPitak[pitakId].count++;
      // @ts-ignore
      groupedData.byPitak[pitakId].totalLuwang += parseFloat(assignment.luwangCount || 0);
      // @ts-ignore
      groupedData.byPitak[pitakId].assignments.push({
        id: assignment.id,
        luwangCount: assignment.luwangCount,
        date: assignment.assignmentDate,
        status: assignment.status
      });

      // Group by bukid
      // @ts-ignore
      if (!groupedData.byBukid[bukidName]) {
        // @ts-ignore
        groupedData.byBukid[bukidName] = {
          name: bukidName,
          count: 0,
          totalLuwang: 0,
          pitaks: new Set()
        };
      }
      // @ts-ignore
      groupedData.byBukid[bukidName].count++;
      // @ts-ignore
      groupedData.byBukid[bukidName].totalLuwang += parseFloat(assignment.luwangCount || 0);
      if (pitakLocation !== 'Unknown') {
        // @ts-ignore
        groupedData.byBukid[bukidName].pitaks.add(pitakLocation);
      }

      // Group by status
      // @ts-ignore
      if (!groupedData.byStatus[status]) {
        // @ts-ignore
        groupedData.byStatus[status] = {
          count: 0,
          totalLuwang: 0
        };
      }
      // @ts-ignore
      groupedData.byStatus[status].count++;
      // @ts-ignore
      groupedData.byStatus[status].totalLuwang += parseFloat(assignment.luwangCount || 0);

      // Group by date
      // @ts-ignore
      if (!groupedData.byDate[dateKey]) {
        // @ts-ignore
        groupedData.byDate[dateKey] = {
          date: dateKey,
          count: 0,
          totalLuwang: 0
        };
      }
      // @ts-ignore
      groupedData.byDate[dateKey].count++;
      // @ts-ignore
      groupedData.byDate[dateKey].totalLuwang += parseFloat(assignment.luwangCount || 0);
    });

    // Convert sets to arrays for JSON serialization
    Object.keys(groupedData.byBukid).forEach(key => {
      // @ts-ignore
      groupedData.byBukid[key].pitaks = Array.from(groupedData.byBukid[key].pitaks);
    });

    // Sort grouped data
    const sortedByPitak = Object.values(groupedData.byPitak).sort((a, b) => b.totalLuwang - a.totalLuwang);
    const sortedByBukid = Object.values(groupedData.byBukid).sort((a, b) => b.totalLuwang - a.totalLuwang);
    const sortedByDate = Object.values(groupedData.byDate).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate productivity metrics
    const uniqueDates = new Set(filteredAssignments.map((/** @type {{ assignmentDate: any; createdAt: any; }} */ a) => 
      (a.assignmentDate || a.createdAt).toISOString().split('T')[0]
    ));
    const totalDaysWorked = uniqueDates.size;
    
    const productivity = {
      totalDaysWorked,
      averageLuwangPerDay: totalDaysWorked > 0 ? totalLuwang / totalDaysWorked : 0,
      averageLuwangPerAssignment: totalAssignments > 0 ? totalLuwang / totalAssignments : 0,
      completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
      activeRate: totalAssignments > 0 ? (activeAssignments / totalAssignments) * 100 : 0
    };

    // Get recent assignments
    const recentAssignments = filteredAssignments
      // @ts-ignore
      .sort((/** @type {{ assignmentDate: any; createdAt: any; }} */ a, /** @type {{ assignmentDate: any; createdAt: any; }} */ b) => new Date(b.assignmentDate || b.createdAt) - new Date(a.assignmentDate || a.createdAt))
      .slice(0, 10)
      .map((/** @type {{ id: any; assignmentDate: any; luwangCount: any; status: any; pitak: { location: any; bukid: { name: any; }; }; }} */ assignment) => ({
        id: assignment.id,
        date: assignment.assignmentDate,
        luwangCount: assignment.luwangCount,
        status: assignment.status,
        pitak: assignment.pitak?.location,
        bukid: assignment.pitak?.bukid?.name
      }));

    return {
      status: true,
      message: 'Worker with assignments retrieved successfully',
      data: { 
        worker: {
          id: worker.id,
          name: worker.name,
          kabisilya: worker.kabisilya
        },
        assignmentSummary: {
          totalAssignments,
          activeAssignments,
          completedAssignments,
          cancelledAssignments,
          totalLuwang,
          productivity,
          groupedData: groupBy === 'pitak' ? sortedByPitak :
                     groupBy === 'bukid' ? sortedByBukid :
                     groupBy === 'date' ? sortedByDate :
                     groupBy === 'status' ? Object.entries(groupedData.byStatus).map(([status, data]) => ({ status, ...data })) :
                     null,
          recentAssignments
        },
        period: startDate && endDate ? {
          start: startDate,
          end: endDate,
          // @ts-ignore
          days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
        } : null
      }
    };
  } catch (error) {
    console.error('Error in getWorkerWithAssignments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker assignments: ${error.message}`,
      data: null
    };
  }
};