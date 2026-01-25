// src/ipc/assignment/bulk/bulk_update.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");

/**
 * Bulk update assignments
 * @param {Object} params - Bulk update parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    // @ts-ignore
    const { assignments, updateData, filters, _userId } = params;

    if (!assignments && !filters) {
      return {
        status: false,
        message: "Either assignments array or filters are required",
        data: null
      };
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return {
        status: false,
        message: "Update data is required",
        data: null
      };
    }

    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    
    // Get assignments to update
    /**
     * @type {any[]}
     */
    let assignmentsToUpdate = [];
    
    if (assignments && Array.isArray(assignments)) {
      // Update specific assignments by ID
      assignmentsToUpdate = await assignmentRepo.findByIds(assignments);
    } else if (filters) {
      // Update assignments based on filters
      const queryBuilder = assignmentRepo.createQueryBuilder("assignment");
      
      if (filters.dateFrom && filters.dateTo) {
        queryBuilder.where("assignment.assignmentDate BETWEEN :dateFrom AND :dateTo", {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        });
      }
      
      if (filters.status) {
        queryBuilder.andWhere("assignment.status = :status", { status: filters.status });
      }
      
      if (filters.workerId) {
        queryBuilder.andWhere("assignment.workerId = :workerId", { workerId: filters.workerId });
      }
      
      if (filters.pitakId) {
        queryBuilder.andWhere("assignment.pitakId = :pitakId", { pitakId: filters.pitakId });
      }
      
      assignmentsToUpdate = await queryBuilder.getMany();
    }

    if (assignmentsToUpdate.length === 0) {
      return {
        status: false,
        message: "No assignments found to update",
        data: null
      };
    }

    // Validate update data
    /**
     * @type {{ assignmentId: any; errors: string[]; }[]}
     */
    const validationErrors = [];
    /**
     * @type {any[]}
     */
    const validUpdates = [];
    
    assignmentsToUpdate.forEach(assignment => {
      const errors = [];
      
      // Validate status update
      if (updateData.status) {
        const validStatuses = ['active', 'completed', 'cancelled'];
        if (!validStatuses.includes(updateData.status)) {
          errors.push(`Invalid status: ${updateData.status}`);
        }
        
        if (updateData.status === 'cancelled' && assignment.status === 'completed') {
          errors.push("Cannot cancel a completed assignment");
        }
      }
      
      // Validate luwang count
      if (updateData.luwangCount !== undefined) {
        const count = parseFloat(updateData.luwangCount);
        if (isNaN(count) || count < 0) {
          errors.push(`Invalid luwang count: ${updateData.luwangCount}`);
        }
      }
      
      if (errors.length === 0) {
        validUpdates.push(assignment);
      } else {
        validationErrors.push({
          assignmentId: assignment.id,
          errors
        });
      }
    });

    if (validUpdates.length === 0) {
      return {
        status: false,
        message: "All updates failed validation",
        data: { validationErrors }
      };
    }

    // Apply updates
    const updatedAssignments = [];
    const skippedAssignments = [];
    
    for (const assignment of validUpdates) {
      try {
        const originalValues = {
          status: assignment.status,
          luwangCount: parseFloat(assignment.luwangCount),
          notes: assignment.notes
        };
        
        // Track changes
        const changes = [];
        
        // Update status
        if (updateData.status && updateData.status !== assignment.status) {
          changes.push(`Status: ${assignment.status} → ${updateData.status}`);
          assignment.status = updateData.status;
        }
        
        // Update luwang count
        if (updateData.luwangCount !== undefined) {
          const newCount = parseFloat(updateData.luwangCount);
          const oldCount = parseFloat(assignment.luwangCount);
          if (newCount !== oldCount) {
            changes.push(`LuWang: ${oldCount.toFixed(2)} → ${newCount.toFixed(2)}`);
            assignment.luwangCount = newCount.toFixed(2);
          }
        }
        
        // Update notes
        if (updateData.notes !== undefined && updateData.notes !== assignment.notes) {
          changes.push("Notes updated");
          assignment.notes = updateData.notes;
        }
        
        // Update timestamp
        assignment.updatedAt = new Date();
        
        // Add change log to notes
        if (changes.length > 0) {
          const changeLog = `[Bulk Update ${new Date().toISOString()}]: ${changes.join(', ')}`;
          assignment.notes = assignment.notes 
            ? `${assignment.notes}\n${changeLog}`
            : changeLog;
        }
        
        const updatedAssignment = await assignmentRepo.save(assignment);
        updatedAssignments.push({
          id: updatedAssignment.id,
          changes,
          originalValues,
          newValues: {
            status: updatedAssignment.status,
            luwangCount: parseFloat(updatedAssignment.luwangCount)
          }
        });
        
      } catch (error) {
        skippedAssignments.push({
          assignmentId: assignment.id,
          // @ts-ignore
          error: error.message
        });
      }
    }

    // Calculate summary
    const summary = {
      totalProcessed: assignmentsToUpdate.length,
      totalUpdated: updatedAssignments.length,
      totalSkipped: skippedAssignments.length,
      totalFailed: validationErrors.length,
      updatedStatuses: updatedAssignments.reduce((acc, item) => {
        const status = item.newValues.status;
        // @ts-ignore
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    };

    return {
      status: true,
      message: "Bulk update completed",
      data: {
        updatedAssignments,
        skippedAssignments,
        failedUpdates: validationErrors
      },
      meta: summary
    };

  } catch (error) {
    console.error("Error in bulk assignment update:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk update failed: ${error.message}`,
      data: null
    };
  }
};