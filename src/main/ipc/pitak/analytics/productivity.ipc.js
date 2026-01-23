// src/ipc/pitak/analytics/productivity.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ pitakId, dateRange = {}, /** @type {any} */ userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange;
    
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Get pitak details
    const pitak = await pitakRepo.findOne({ 
      where: { id: pitakId },
      relations: ['bukid']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Get assignments with optional date filter
    const query = assignmentRepo.createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.worker', 'worker')
      .where('assignment.pitakId = :pitakId', { pitakId })
      .andWhere('assignment.status = :status', { status: 'completed' });

    if (startDate && endDate) {
      query.andWhere('assignment.assignmentDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
    }

    const assignments = await query.getMany();

    if (assignments.length === 0) {
      return {
        status: true,
        message: "No productivity data found for the specified period",
        data: {
          pitak: {
            id: pitak.id,
            location: pitak.location,
            totalLuwang: parseFloat(pitak.totalLuwang)
          },
          period: dateRange,
          metrics: {
            totalAssignments: 0,
            totalLuWang: 0,
            averageLuWangPerAssignment: 0,
            topWorkers: [],
            dailyProductivity: []
          }
        }
      };
    }

    // Calculate daily productivity
    const dailyProductivity = {};
    assignments.forEach((/** @type {{ assignmentDate: { toISOString: () => string; }; luwangCount: string; worker: { id: any; }; }} */ assignment) => {
      const date = assignment.assignmentDate.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyProductivity[date]) {
        // @ts-ignore
        dailyProductivity[date] = {
          date,
          assignments: 0,
          totalLuWang: 0,
          workers: new Set()
        };
      }
      // @ts-ignore
      dailyProductivity[date].assignments++;
      // @ts-ignore
      dailyProductivity[date].totalLuWang += parseFloat(assignment.luwangCount);
      // @ts-ignore
      dailyProductivity[date].workers.add(assignment.worker.id);
    });

    // Convert to array and calculate workers count
    const dailyProductivityArray = Object.values(dailyProductivity).map(day => ({
      date: day.date,
      assignments: day.assignments,
      totalLuWang: day.totalLuWang,
      uniqueWorkers: day.workers.size,
      averageLuWangPerAssignment: day.totalLuWang / day.assignments
    }));

    // Calculate worker productivity
    const workerProductivity = {};
    assignments.forEach((/** @type {{ worker: { id: any; name: any; }; luwangCount: string; }} */ assignment) => {
      const workerId = assignment.worker.id;
      const workerName = assignment.worker.name;
      
      // @ts-ignore
      if (!workerProductivity[workerId]) {
        // @ts-ignore
        workerProductivity[workerId] = {
          workerId,
          workerName,
          assignments: 0,
          totalLuWang: 0,
          averageLuWang: 0
        };
      }
      // @ts-ignore
      workerProductivity[workerId].assignments++;
      // @ts-ignore
      workerProductivity[workerId].totalLuWang += parseFloat(assignment.luwangCount);
    });

    // Calculate averages and sort
    Object.values(workerProductivity).forEach(worker => {
      worker.averageLuWang = worker.totalLuWang / worker.assignments;
    });

    const topWorkers = Object.values(workerProductivity)
      .sort((a, b) => b.totalLuWang - a.totalLuWang)
      .slice(0, 10);

    // Calculate overall metrics
    const totalLuWang = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    const totalAssignments = assignments.length;
    const uniqueWorkers = new Set(assignments.map((/** @type {{ worker: { id: any; }; }} */ a) => a.worker.id)).size;

    return {
      status: true,
      message: "Productivity analytics retrieved successfully",
      data: {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          totalLuwang: parseFloat(pitak.totalLuwang),
          bukid: pitak.bukid ? {
            id: pitak.bukid.id,
            name: pitak.bukid.name
          } : null
        },
        period: dateRange,
        metrics: {
          totalAssignments,
          totalLuWang,
          averageLuWangPerAssignment: totalLuWang / totalAssignments,
          uniqueWorkers,
          utilizationRate: (totalLuWang / parseFloat(pitak.totalLuwang)) * 100,
          topWorkers,
          dailyProductivity: dailyProductivityArray.sort((a, b) => 
            // @ts-ignore
            new Date(a.date) - new Date(b.date)
          )
        }
      }
    };

  } catch (error) {
    console.error("Error retrieving productivity analytics:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve productivity analytics: ${error.message}`,
      data: null
    };
  }
};