// src/ipc/assignment/validation/validate_luwang_count.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Validate luwang count
 * @param {Object} params - Validation parameters
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params) => {
  try {
    const { 
      // @ts-ignore
      luwangCount, 
      // @ts-ignore
      assignmentId, 
      // @ts-ignore
      workerId, 
      // @ts-ignore
      dateRange,
      // @ts-ignore
      _userId 
    } = params;

    if (luwangCount === undefined) {
      return {
        status: false,
        message: "LuWang count is required",
        data: null
      };
    }

    const count = parseFloat(luwangCount);
    
    // Basic validation
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {},
      recommendations: []
    };

    // Check if it's a number
    if (isNaN(count)) {
      validation.isValid = false;
      // @ts-ignore
      validation.errors.push("LuWang count must be a number");
      return {
        status: true,
        message: "Validation completed",
        data: validation
      };
    }

    // Check if non-negative
    if (count < 0) {
      validation.isValid = false;
      // @ts-ignore
      validation.errors.push("LuWang count cannot be negative");
    }

    // Check if within reasonable range (optional business rule)
    if (count > 1000) {
      // @ts-ignore
      validation.warnings.push("LuWang count seems unusually high");
      // @ts-ignore
      validation.recommendations.push("Consider verifying the count");
    }

    // Compare with historical data if assignmentId is provided
    if (assignmentId) {
      const assignmentRepo = AppDataSource.getRepository(Assignment);
      const assignment = await assignmentRepo.findOne({
        where: { id: assignmentId },
        relations: ["worker"]
      });

      if (assignment) {
        const previousCount = parseFloat(assignment.luwangCount);
        const difference = count - previousCount;
        const percentageChange = previousCount > 0 ? (difference / previousCount) * 100 : 100;

        // @ts-ignore
        validation.statistics.previousCount = previousCount;
        // @ts-ignore
        validation.statistics.difference = difference;
        // @ts-ignore
        validation.statistics.percentageChange = percentageChange.toFixed(2);

        // Check for significant changes
        if (Math.abs(percentageChange) > 50) {
          // @ts-ignore
          validation.warnings.push(`Significant change detected: ${percentageChange.toFixed(2)}% from previous count`);
        }

        // Check if worker typically has similar counts
        if (assignment.workerId) {
          const historicalAssignments = await assignmentRepo.find({
            where: { 
              workerId: assignment.workerId,
              status: 'completed'
            },
            order: { assignmentDate: 'DESC' },
            take: 10
          });

          if (historicalAssignments.length > 0) {
            const historicalCounts = historicalAssignments.map((/** @type {{ luwangCount: string; }} */ a) => parseFloat(a.luwangCount));
            const average = historicalCounts.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / historicalCounts.length;
            const standardDeviation = Math.sqrt(
              historicalCounts.reduce((/** @type {number} */ sq, /** @type {number} */ n) => sq + Math.pow(n - average, 2), 0) / historicalCounts.length
            );

            // @ts-ignore
            validation.statistics.historicalAverage = average.toFixed(2);
            // @ts-ignore
            validation.statistics.historicalStdDev = standardDeviation.toFixed(2);

            // Check if count is within 2 standard deviations of historical average
            if (Math.abs(count - average) > (2 * standardDeviation) && standardDeviation > 0) {
              // @ts-ignore
              validation.warnings.push("Count is significantly different from worker's historical performance");
              // @ts-ignore
              validation.recommendations.push("Review worker's typical performance before accepting");
            }
          }
        }
      }
    }

    // Compare with date range data if provided
    if (dateRange && workerId) {
      const assignmentRepo = AppDataSource.getRepository(Assignment);
      const { startDate, endDate } = dateRange;
      
      const dateRangeAssignments = await assignmentRepo.find({
        where: {
          workerId: workerId,
          assignmentDate: startDate && endDate 
            ? { $between: [new Date(startDate), new Date(endDate)] }
            : undefined,
          status: 'completed'
        }
      });

      if (dateRangeAssignments.length > 0) {
        const dateRangeCounts = dateRangeAssignments.map((/** @type {{ luwangCount: string; }} */ a) => parseFloat(a.luwangCount));
        const dateRangeAverage = dateRangeCounts.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / dateRangeCounts.length;
        
        // @ts-ignore
        validation.statistics.dateRangeAverage = dateRangeAverage.toFixed(2);
        // @ts-ignore
        validation.statistics.dateRangeCount = dateRangeAssignments.length;

        if (count < dateRangeAverage * 0.5) {
          // @ts-ignore
          validation.warnings.push("Count is significantly lower than worker's average for the date range");
        } else if (count > dateRangeAverage * 1.5) {
          // @ts-ignore
          validation.warnings.push("Count is significantly higher than worker's average for the date range");
        }
      }
    }

    // Provide recommendations based on validation
    if (validation.isValid) {
      if (count === 0) {
        // @ts-ignore
        validation.recommendations.push("Consider if zero LuWang count is correct for this assignment");
      } else if (count < 10) {
        // @ts-ignore
        validation.recommendations.push("Low LuWang count detected - ensure accuracy");
      }
    }

    return {
      status: true,
      message: "LuWang count validation completed",
      data: validation
    };

  } catch (error) {
    console.error("Error validating LuWang count:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Validation failed: ${error.message}`,
      data: null
    };
  }
};