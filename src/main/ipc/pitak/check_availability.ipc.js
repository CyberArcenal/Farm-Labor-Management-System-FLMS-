// src/ipc/pitak/check_availability.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Assignment = require("../../../entities/Assignment");
const { AppDataSource } = require("../../db/dataSource");
const { In } = require("typeorm");

module.exports = async (/** @type {{ pitakId: any; date: any; workerId: any; _userId: any; }} */ params) => {
  try {
    // @ts-ignore
    // @ts-ignore
    const { pitakId, date, workerId, _userId } = params;

    if (!pitakId) {
      return { status: false, message: "Pitak ID is required", data: null };
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

    // Check pitak status
    const availability = {
      pitakId,
      location: pitak.location,
      status: pitak.status,
      // @ts-ignore
      totalLuwang: parseFloat(pitak.totalLuwang),
      isAvailable: pitak.status === 'active',
      reasons: []
    };

    if (pitak.status !== 'active') {
      // @ts-ignore
      availability.reasons.push(`Pitak status is "${pitak.status}"`);
    }

    // Check if date is provided for assignment checks
    if (date) {
      const checkDate = new Date(date);
      
      // Check for existing assignments on this date
      const existingAssignments = await assignmentRepo.find({
        where: {
          // @ts-ignore
          pitakId,
          assignmentDate: checkDate,
          status: In(['active', 'completed'])
        },
        relations: ['worker']
      });

      if (existingAssignments.length > 0) {
        // @ts-ignore
        const assignedWorkers = existingAssignments.map((/** @type {{ workerId: any; worker: { name: any; }; luwangCount: string; }} */ a) => ({
          workerId: a.workerId,
          workerName: a.worker ? a.worker.name : 'Unknown',
          luwangCount: parseFloat(a.luwangCount)
        }));

        // @ts-ignore
        availability.existingAssignments = existingAssignments.length;
        // @ts-ignore
        availability.assignedWorkers = assignedWorkers;
        // @ts-ignore
        availability.totalAssignedLuWang = assignedWorkers.reduce((/** @type {any} */ sum, /** @type {{ luwangCount: any; }} */ w) => 
          sum + w.luwangCount, 0);
        // @ts-ignore
        availability.remainingLuWang = parseFloat(pitak.totalLuwang) - availability.totalAssignedLuWang;

        // Check if worker is already assigned
        if (workerId) {
          // @ts-ignore
          const isWorkerAssigned = existingAssignments.some((/** @type {{ workerId: any; }} */ a) => a.workerId === workerId);
          if (isWorkerAssigned) {
            availability.isAvailable = false;
            // @ts-ignore
            availability.reasons.push(`Worker is already assigned to this pitak on ${checkDate.toISOString().split('T')[0]}`);
          }
        }

        // Check if pitak is fully utilized
        // @ts-ignore
        if (availability.remainingLuWang <= 0) {
          availability.isAvailable = false;
          // @ts-ignore
          availability.reasons.push("Pitak is fully utilized (no remaining LuWang capacity)");
        }
      } else {
        // @ts-ignore
        availability.existingAssignments = 0;
        // @ts-ignore
        availability.remainingLuWang = parseFloat(pitak.totalLuwang);
      }
    }

    // Check if pitak has any active assignments overall
    const activeAssignmentsCount = await assignmentRepo.count({
      where: {
        // @ts-ignore
        pitakId,
        status: 'active'
      }
    });

    // @ts-ignore
    availability.activeAssignments = activeAssignmentsCount;

    // Calculate utilization rate
    if (availability.totalLuwang > 0) {
      // @ts-ignore
      availability.utilizationRate = availability.totalAssignedLuWang 
        // @ts-ignore
        ? (availability.totalAssignedLuWang / availability.totalLuwang) * 100 
        : 0;
    }

    // Recommendation
    if (availability.isAvailable) {
      // @ts-ignore
      if (availability.remainingLuWang > 0) {
        // @ts-ignore
        availability.recommendation = {
          canAssign: true,
          // @ts-ignore
          maxLuWang: availability.remainingLuWang.toFixed(2),
          // @ts-ignore
          message: `Pitak is available with ${availability.remainingLuWang.toFixed(2)} LuWang capacity remaining`
        };
      }
    } else {
      // @ts-ignore
      availability.recommendation = {
        canAssign: false,
        reasons: availability.reasons,
        // @ts-ignore
        suggestedAction: availability.reasons.includes('Pitak status is "inactive"') 
          ? 'Activate the pitak first' 
          // @ts-ignore
          : availability.reasons.includes('Pitak is fully utilized') 
            ? 'Consider assigning to a different pitak or increasing capacity' 
            : 'Resolve the issues mentioned above'
      };
    }

    return {
      status: true,
      message: "Availability check completed",
      data: availability
    };

  } catch (error) {
    console.error("Error checking pitak availability:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to check availability: ${error.message}`,
      data: null
    };
  }
};