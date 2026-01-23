// src/ipc/pitak/analytics/utilization.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ bukidId, dateRange = {}, /** @type {any} */ userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange;
    
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Get all pitaks in the bukid
    const pitaks = await pitakRepo.find({
      where: { bukidId },
      relations: ['bukid']
    });

    if (pitaks.length === 0) {
      return {
        status: true,
        message: "No pitaks found for the specified bukid",
        data: {
          bukidId,
          period: dateRange,
          utilization: []
        }
      };
    }

    // For each pitak, calculate utilization
    const utilizationData = await Promise.all(pitaks.map(async (/** @type {{ id: any; totalLuwang: string; location: any; }} */ pitak) => {
      // Get assignments within the date range
      const assignments = await assignmentRepo.find({
        where: {
          pitakId: pitak.id,
          assignmentDate: startDate && endDate ? {
            between: [new Date(startDate), new Date(endDate)]
          } : undefined
        }
      });

      const totalLuWangAssigned = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ assignment) => {
        return sum + parseFloat(assignment.luwangCount);
      }, 0);

      const totalLuWangCapacity = parseFloat(pitak.totalLuwang);
      const utilizationRate = totalLuWangCapacity > 0 
        ? (totalLuWangAssigned / totalLuWangCapacity) * 100 
        : 0;

      return {
        pitakId: pitak.id,
        location: pitak.location,
        totalLuWangCapacity,
        totalLuWangAssigned,
        utilizationRate,
        assignmentCount: assignments.length
      };
    }));

    // Overall utilization for the bukid
    const totalCapacity = utilizationData.reduce((/** @type {any} */ sum, /** @type {{ totalLuWangCapacity: any; }} */ data) => sum + data.totalLuWangCapacity, 0);
    const totalAssigned = utilizationData.reduce((/** @type {any} */ sum, /** @type {{ totalLuWangAssigned: any; }} */ data) => sum + data.totalLuWangAssigned, 0);
    const overallUtilization = totalCapacity > 0 ? (totalAssigned / totalCapacity) * 100 : 0;

    return {
      status: true,
      message: "Utilization analytics retrieved successfully",
      data: {
        bukidId,
        period: dateRange,
        overallUtilization,
        totalCapacity,
        totalAssigned,
        pitakUtilization: utilizationData
      }
    };

  } catch (error) {
    console.error("Error retrieving utilization analytics:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve utilization analytics: ${error.message}`,
      data: null
    };
  }
};