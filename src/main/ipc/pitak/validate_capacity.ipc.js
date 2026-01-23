// src/ipc/pitak/validate_capacity.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Assignment = require("../../../entities/Assignment");
const { AppDataSource } = require("../../db/dataSource");
const { In } = require("typeorm");

module.exports = async (/** @type {{ pitakId: any; requestedLuWang: any; date: any; _userId: any; }} */ params) => {
  try {
    // @ts-ignore
    const { pitakId, requestedLuWang, date, _userId } = params;

    if (!pitakId || requestedLuWang === undefined) {
      return { 
        status: false, 
        message: "Pitak ID and requestedLuWang are required", 
        data: null 
      };
    }

    const requestedLuWangNum = parseFloat(requestedLuWang);
    if (isNaN(requestedLuWangNum) || requestedLuWangNum <= 0) {
      return { 
        status: false, 
        message: "requestedLuWang must be a positive number", 
        data: null 
      };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Get pitak
    const pitak = await pitakRepo.findOne({ 
      where: { id: pitakId },
      relations: ['bukid']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    const totalLuWang = parseFloat(pitak.totalLuwang);

    // Get existing assignments for capacity calculation
    const query = assignmentRepo.createQueryBuilder('assignment')
      .select('SUM(assignment.luwangCount)', 'totalAssignedLuWang')
      .where('assignment.pitakId = :pitakId', { pitakId })
      .andWhere('assignment.status IN (:...statuses)', { 
        statuses: ['active', 'completed'] 
      });

    if (date) {
      query.andWhere('assignment.assignmentDate = :date', { 
        date: new Date(date) 
      });
    }

    const result = await query.getRawOne();
    const totalAssignedLuWang = parseFloat(result.totalAssignedLuWang) || 0;

    // Calculate remaining capacity
    const remainingLuWang = totalLuWang - totalAssignedLuWang;
    const canAccommodate = remainingLuWang >= requestedLuWangNum;

    // Get breakdown of assignments
    const assignments = await assignmentRepo.find({
      where: {
        pitakId,
        ...(date && { assignmentDate: new Date(date) }),
        status: In(['active', 'completed'])
      },
      relations: ['worker'],
      order: { luwangCount: 'DESC' }
    });

    const validation = {
      pitakId,
      location: pitak.location,
      totalCapacity: totalLuWang,
      currentlyAssigned: totalAssignedLuWang,
      remainingCapacity: remainingLuWang,
      requested: requestedLuWangNum,
      canAccommodate,
      utilizationRate: (totalAssignedLuWang / totalLuWang) * 100,
      assignments: assignments.map((/** @type {{ id: any; assignmentDate: any; luwangCount: string; status: any; worker: { id: any; name: any; }; }} */ a) => ({
        id: a.id,
        assignmentDate: a.assignmentDate,
        luwangCount: parseFloat(a.luwangCount),
        status: a.status,
        worker: a.worker ? {
          id: a.worker.id,
          name: a.worker.name
        } : null
      })),
      recommendations: []
    };

    if (!canAccommodate) {
      // @ts-ignore
      validation.recommendations.push({
        type: 'insufficient_capacity',
        message: `Insufficient capacity. Need ${requestedLuWangNum.toFixed(2)} LuWang, but only ${remainingLuWang.toFixed(2)} available`,
        options: [
          `Increase pitak capacity from ${totalLuWang.toFixed(2)} to ${(totalLuWang + (requestedLuWangNum - remainingLuWang)).toFixed(2)}`,
          'Reduce requested LuWang amount',
          date ? `Assign on a different date (current date: ${new Date(date).toISOString().split('T')[0]})` : 'Assign to a different pitak'
        ]
      });
    } else {
      // Check utilization thresholds
      const newUtilization = ((totalAssignedLuWang + requestedLuWangNum) / totalLuWang) * 100;
      
      if (newUtilization > 90) {
        // @ts-ignore
        validation.recommendations.push({
          type: 'high_utilization_warning',
          message: `Assignment will bring pitak utilization to ${newUtilization.toFixed(1)}%`,
          severity: 'warning'
        });
      }

      if (newUtilization > 100) {
        // @ts-ignore
        validation.recommendations.push({
          type: 'overcapacity_warning',
          message: `Assignment will exceed pitak capacity by ${(newUtilization - 100).toFixed(1)}%`,
          severity: 'error'
        });
      }

      // Check if this is a large allocation
      if (requestedLuWangNum > (totalLuWang * 0.5)) {
        // @ts-ignore
        validation.recommendations.push({
          type: 'large_allocation_warning',
          message: `Requested amount (${requestedLuWangNum.toFixed(2)}) is more than 50% of total capacity`,
          severity: 'warning'
        });
      }
    }

    // Check for scheduling conflicts if date provided
    if (date) {
      const dateAssignments = assignments.filter((/** @type {{ assignmentDate: { toISOString: () => string; }; }} */ a) => 
        a.assignmentDate.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
      );

      if (dateAssignments.length > 0) {
        // @ts-ignore
        validation.dateAnalysis = {
          date: new Date(date).toISOString().split('T')[0],
          assignmentsCount: dateAssignments.length,
          totalLuWangOnDate: dateAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0),
          workersAssigned: dateAssignments.map((/** @type {{ worker: { name: any; }; }} */ a) => a.worker ? a.worker.name : 'Unknown')
        };
      }
    }

    return {
      status: true,
      message: canAccommodate 
        ? "Capacity validation passed" 
        : "Capacity validation failed",
      data: validation
    };

  } catch (error) {
    console.error("Error validating pitak capacity:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to validate capacity: ${error.message}`,
      data: null
    };
  }
};