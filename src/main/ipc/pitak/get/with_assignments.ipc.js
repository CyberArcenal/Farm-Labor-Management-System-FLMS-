// src/ipc/pitak/get/with_assignments.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ pitakId, dateRange = {}, /** @type {any} */ userId) => {
  try {
    if (!pitakId) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Get pitak with bukid and kabisilya
    const pitak = await pitakRepo.findOne({
      where: { id: pitakId },
      relations: ['bukid']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Build assignment query
    const assignmentQuery = assignmentRepo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.worker', 'worker')
      .where('assignment.pitakId = :pitakId', { pitakId });

    // Apply date range if provided
    // @ts-ignore
    if (dateRange.startDate && dateRange.endDate) {
      assignmentQuery.andWhere('assignment.assignmentDate BETWEEN :startDate AND :endDate', {
        // @ts-ignore
        startDate: new Date(dateRange.startDate),
        // @ts-ignore
        endDate: new Date(dateRange.endDate)
      });
    }

    // Get assignments with ordering
    const assignments = await assignmentQuery
      .orderBy('assignment.assignmentDate', 'DESC')
      .getMany();

    // Calculate assignment statistics
    const assignmentStats = await assignmentRepo
      .createQueryBuilder('assignment')
      .select([
        'COUNT(*) as totalAssignments',
        'SUM(assignment.luwangCount) as totalLuWangAssigned',
        'AVG(assignment.luwangCount) as averageLuWangPerAssignment',
        'SUM(CASE WHEN assignment.status = "completed" THEN 1 ELSE 0 END) as completedAssignments',
        'SUM(CASE WHEN assignment.status = "active" THEN 1 ELSE 0 END) as activeAssignments',
        'SUM(CASE WHEN assignment.status = "cancelled" THEN 1 ELSE 0 END) as cancelledAssignments'
      ])
      .where('assignment.pitakId = :pitakId', { pitakId })
      .getRawOne();

    // Get worker statistics
    const workerStats = await assignmentRepo
      .createQueryBuilder('assignment')
      .leftJoin('assignment.worker', 'worker')
      .select([
        'COUNT(DISTINCT assignment.workerId) as uniqueWorkers',
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(assignment.id) as assignmentCount',
        'SUM(assignment.luwangCount) as totalLuWang'
      ])
      .where('assignment.pitakId = :pitakId', { pitakId })
      .groupBy('assignment.workerId, worker.id, worker.name')
      .orderBy('totalLuWang', 'DESC')
      .getRawMany();

    // Calculate daily assignment breakdown
    const dailyBreakdown = await assignmentRepo
      .createQueryBuilder('assignment')
      .select([
        'DATE(assignment.assignmentDate) as assignmentDate',
        'COUNT(*) as assignmentsCount',
        'SUM(assignment.luwangCount) as totalLuWang'
      ])
      .where('assignment.pitakId = :pitakId', { pitakId })
      .groupBy('DATE(assignment.assignmentDate)')
      .orderBy('assignmentDate', 'DESC')
      .limit(30) // Last 30 days
      .getRawMany();

    // Calculate utilization
    // @ts-ignore
    const totalLuWangCapacity = parseFloat(pitak.totalLuwang);
    const totalLuWangAssigned = parseFloat(assignmentStats.totalLuWangAssigned) || 0;
    const utilizationRate = totalLuWangCapacity > 0 
      ? (totalLuWangAssigned / totalLuWangCapacity) * 100 
      : 0;

    return {
      status: true,
      message: "Pitak with assignments retrieved successfully",
      data: {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          // @ts-ignore
          totalLuwang: parseFloat(pitak.totalLuwang),
          status: pitak.status,
          // @ts-ignore
          bukid: pitak.bukid ? {
            // @ts-ignore
            id: pitak.bukid.id,
            // @ts-ignore
            name: pitak.bukid.name,
          } : null
        },
        assignments: assignments.map(a => ({
          id: a.id,
          assignmentDate: a.assignmentDate,
          // @ts-ignore
          luwangCount: parseFloat(a.luwangCount),
          status: a.status,
          notes: a.notes,
          // @ts-ignore
          worker: a.worker ? {
            // @ts-ignore
            id: a.worker.id,
            // @ts-ignore
            name: a.worker.name,
            // @ts-ignore
            contact: a.worker.contact
          } : null
        })),
        statistics: {
          assignments: {
            total: parseInt(assignmentStats.totalAssignments) || 0,
            totalLuWangAssigned,
            averageLuWangPerAssignment: parseFloat(assignmentStats.averageLuWangPerAssignment) || 0,
            completed: parseInt(assignmentStats.completedAssignments) || 0,
            active: parseInt(assignmentStats.activeAssignments) || 0,
            cancelled: parseInt(assignmentStats.cancelledAssignments) || 0
          },
          workers: {
            uniqueCount: workerStats.length,
            topPerformers: workerStats.slice(0, 5).map(w => ({
              workerId: w.workerId,
              workerName: w.workerName,
              assignmentCount: parseInt(w.assignmentCount) || 0,
              totalLuWang: parseFloat(w.totalLuWang) || 0
            }))
          },
          utilization: {
            rate: utilizationRate,
            capacityUsed: totalLuWangAssigned,
            capacityRemaining: totalLuWangCapacity - totalLuWangAssigned
          }
        },
        dailyBreakdown: dailyBreakdown.map(d => ({
          date: d.assignmentDate,
          assignments: parseInt(d.assignmentsCount) || 0,
          totalLuWang: parseFloat(d.totalLuWang) || 0
        })),
        period: dateRange
      }
    };

  } catch (error) {
    console.error("Error retrieving pitak with assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pitak with assignments: ${error.message}`,
      data: null
    };
  }
};