// src/ipc/assignment/get/all.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
// @ts-ignore
const Worker = require("../../../../entities/Worker");
// @ts-ignore
const Pitak = require("../../../../entities/Pitak");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get all assignments with optional filters
 * @param {Object} filters - Filter criteria
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Build query with joins
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .orderBy("assignment.assignmentDate", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere(
        "assignment.assignmentDate BETWEEN :dateFrom AND :dateTo",
        {
          // @ts-ignore
          dateFrom: filters.dateFrom,
          // @ts-ignore
          dateTo: filters.dateTo,
        },
      );
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("assignment.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.workerId) {
      queryBuilder.andWhere("assignment.workerId = :workerId", {
        // @ts-ignore
        workerId: filters.workerId,
      });
    }

    // @ts-ignore
    if (filters.pitakId) {
      queryBuilder.andWhere("assignment.pitakId = :pitakId", {
        // @ts-ignore
        pitakId: filters.pitakId,
      });
    }

    const assignments = await queryBuilder.getMany();

    // Format response
    const formattedAssignments = assignments.map(
      (
        /** @type {{ id: any; luwangCount: string; assignmentDate: any; status: any; notes: any; createdAt: any; updatedAt: any; worker: { id: any; name: any; code: any; }; pitak: { id: any; name: any; code: any; }; }} */ assignment,
      ) => ({
        id: assignment.id,
        luwangCount: parseFloat(assignment.luwangCount),
        assignmentDate: assignment.assignmentDate,
        status: assignment.status,
        notes: assignment.notes,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        worker: assignment.worker
          ? {
              id: assignment.worker.id,
              name: assignment.worker.name,
              code: assignment.worker.code,
            }
          : null,
        pitak: assignment.pitak
          ? {
              id: assignment.pitak.id,
              name: assignment.pitak.name,
              code: assignment.pitak.code,
            }
          : null,
      }),
    );

    return {
      status: true,
      message: "Assignments retrieved successfully",
      data: formattedAssignments,
      meta: {
        total: formattedAssignments.length,
        active: formattedAssignments.filter(
          (/** @type {{ status: string; }} */ a) => a.status === "active",
        ).length,
        completed: formattedAssignments.filter(
          (/** @type {{ status: string; }} */ a) => a.status === "completed",
        ).length,
        cancelled: formattedAssignments.filter(
          (/** @type {{ status: string; }} */ a) => a.status === "cancelled",
        ).length,
      },
    };
  } catch (error) {
    console.error("Error getting all assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve assignments: ${error.message}`,
      data: null,
    };
  }
};
