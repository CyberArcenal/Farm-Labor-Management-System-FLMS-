// src/ipc/assignment/create/create.ipc.js
//@ts-check
const { AppDataSource } = require("../../db/dataSource");
const Assignment = require("../../../entities/Assignment");
const Worker = require("../../../entities/Worker");
const Pitak = require("../../../entities/Pitak");
const {
  validatePitak,
  validateWorkers,
  findAlreadyAssigned,
} = require("./utils/assignmentUtils");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

/**
 * Create new assignments for multiple workers
 * - If luwangCount is 0 or not provided, compute from pitak.totalLuwang / workerCount
 * - Robust date validation (normalizes to YYYY-MM-DD to avoid timezone issues)
 * - TypeORM v0.3+ patterns (relation objects)
 *
 * @param {Object} params - { workerIds: number[], pitakId: number, luwangCount?: number, assignmentDate: string, notes?: string, userId?: number }
 * @param {import("typeorm").QueryRunner} [externalQueryRunner] - Optional transaction query runner
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (params = {}, externalQueryRunner = null) => {
  let queryRunner = externalQueryRunner;
  let shouldRelease = false;

  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { workerIds, pitakId, luwangCount, assignmentDate, notes, userId } =
      params;

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return {
        status: false,
        message: "No default session configured. Please set one in Settings.",
        data: null,
      };
    }

    // Basic validation
    if (
      !workerIds ||
      !Array.isArray(workerIds) ||
      workerIds.length === 0 ||
      !pitakId ||
      !assignmentDate
    ) {
      return {
        status: false,
        message:
          "Missing required fields: workerIds (array with at least one worker), pitakId, and assignmentDate are required",
        data: null,
      };
    }

    // Dedupe and normalize worker IDs
    const uniqueWorkerIds = [
      ...new Set(workerIds.map((id) => Number(id))),
    ].filter(Boolean);
    if (uniqueWorkerIds.length === 0) {
      return {
        status: false,
        message: "No valid worker IDs provided",
        data: null,
      };
    }

    // Normalize assignment date
    const normalizeToDateString = (/** @type {string | number | Date} */ d) => {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.toISOString().split("T")[0];
    };

    const assignmentDateStr = normalizeToDateString(assignmentDate);
    if (!assignmentDateStr) {
      return { status: false, message: "Invalid assignmentDate", data: null };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (assignmentDateStr > todayStr) {
      return {
        status: false,
        message: "Assignment date cannot be in the future",
        data: null,
      };
    }

    const assignmentDateObj = new Date(`${assignmentDateStr}T00:00:00`);

    // Repositories
    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const workerRepo = queryRunner.manager.getRepository(Worker);
    const assignmentRepo = queryRunner.manager.getRepository(Assignment);

    // ✅ Validate pitak
    const pitakCheck = await validatePitak(pitakRepo, pitakId);
    if (!pitakCheck.valid) {
      return { status: false, message: pitakCheck.message, data: null };
    }
    const pitak = pitakCheck.pitak;

    // ✅ Validate workers
    const workerCheck = await validateWorkers(workerRepo, uniqueWorkerIds);
    if (!workerCheck.valid) {
      return { status: false, message: workerCheck.message, data: null };
    }
    // @ts-ignore
    const workers = workerCheck.workers;

    // ✅ Skip already assigned
    const skippedWorkers = await findAlreadyAssigned(
      assignmentRepo,
      uniqueWorkerIds,
      pitakId,
    );
    const workersToAssign = uniqueWorkerIds.filter(
      (id) => !skippedWorkers.includes(id),
    );

    if (workersToAssign.length === 0) {
      return {
        status: true,
        message: `All selected workers are already assigned to pitak ${pitakId}`,
        data: {
          assignments: [],
          summary: {
            totalWorkers: 0,
            totalLuWangCount: 0,
            assignmentDate: assignmentDateStr,
            pitakId,
            sessionId,
            skippedWorkers,
          },
        },
      };
    }

    // Compute luwangCount per worker
    const workerCount = workersToAssign.length;
    let luwangCountPerWorker = 0.0;

    if (typeof luwangCount === "number" && luwangCount > 0) {
      luwangCountPerWorker = parseFloat((luwangCount / workerCount).toFixed(2));
    } else {
      const pitakTotalRaw = pitak.totalLuwang ?? 0;
      const pitakTotal = parseFloat(pitakTotalRaw) || 0;
      if (pitakTotal > 0) {
        luwangCountPerWorker = parseFloat(
          (pitakTotal / workerCount).toFixed(2),
        );
      } else {
        luwangCountPerWorker = 0.0;
      }
    }

    // ✅ Create assignment entities with sessionId
    const assignmentsToSave = workersToAssign.map((workerId) =>
      assignmentRepo.create({
        // @ts-ignore
        worker: { id: workerId },
        pitak: { id: pitakId },
        session: { id: sessionId }, // 🔑 always tie to default session
        luwangCount: luwangCountPerWorker,
        assignmentDate: assignmentDateObj,
        status: "active",
        notes: notes || null,
      }),
    );

    const savedAssignments = await assignmentRepo.save(assignmentsToSave);

    // Format response
    const formattedAssignments = savedAssignments.map((a) => ({
      id: a.id,
      // @ts-ignore
      workerId: a.worker?.id ?? null,
      // @ts-ignore
      pitakId: a.pitak?.id ?? null,
      // @ts-ignore
      sessionId: a.session?.id ?? sessionId,
      luwangCount:
        typeof a.luwangCount === "string"
          ? parseFloat(a.luwangCount)
          : (a.luwangCount ?? 0),
      assignmentDate: a.assignmentDate
        // @ts-ignore
        ? a.assignmentDate.toISOString().split("T")[0]
        : assignmentDateStr,
      status: a.status,
      notes: a.notes,
      // @ts-ignore
      createdAt: a.createdAt ? a.createdAt.toISOString() : undefined,
      // @ts-ignore
      updatedAt: a.updatedAt ? a.updatedAt.toISOString() : undefined,
    }));

    if (shouldRelease) {
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: `${formattedAssignments.length} assignment(s) created successfully. ${skippedWorkers.length > 0 ? `Skipped ${skippedWorkers.length} already-assigned worker(s).` : ""}`,
      data: {
        assignments: formattedAssignments,
        summary: {
          totalWorkers: formattedAssignments.length,
          totalLuWangCount: formattedAssignments.reduce(
            // @ts-ignore
            (sum, x) => sum + (x.luwangCount || 0),
            0,
          ),
          assignmentDate: assignmentDateStr,
          pitakId,
          sessionId,
          skippedWorkers,
        },
      },
    };
  } catch (error) {
    if (shouldRelease) {
      await queryRunner.rollbackTransaction();
    }
    console.error("Error creating assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create assignments: ${error?.message || error}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      await queryRunner.release();
    }
  }
};
