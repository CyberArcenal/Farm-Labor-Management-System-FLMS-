// src/ipc/pitak/bulk_create.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Bukid = require("../../../entities/Bukid");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

/**
 * Bulk create pitaks
 * @param {Object} params - Bulk creation parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    // @ts-ignore
    const { pitaks, _userId } = params;

    if (!Array.isArray(pitaks) || pitaks.length === 0) {
      return {
        status: false,
        message: "Pitaks array is required and must not be empty",
        data: null,
      };
    }

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return {
        status: false,
        message: "No default session configured. Please set one in Settings.",
        data: null,
      };
    }

    // Validate each pitak
    const validationErrors = [];
    const validPitaks = [];
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    for (let i = 0; i < pitaks.length; i++) {
      const pitak = pitaks[i];
      const errors = [];

      if (!pitak.bukidId) errors.push("bukidId is required");

      if (pitak.bukidId) {
        const bukid = await bukidRepo.findOne({ where: { id: pitak.bukidId } });
        if (!bukid) errors.push(`Bukid with ID ${pitak.bukidId} not found`);
      }

      if (errors.length > 0) {
        validationErrors.push({ index: i, pitak, errors });
      } else {
        validPitaks.push(pitak);
      }
    }

    if (validationErrors.length > 0 && validPitaks.length === 0) {
      return {
        status: false,
        message: "All pitaks failed validation",
        data: { validationErrors },
        meta: { totalFailed: validationErrors.length },
      };
    }

    // Process valid pitaks
    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const createdPitaks = [];
    const skippedPitaks = [];

    for (const pitakData of validPitaks) {
      try {
        const existing = await pitakRepo.findOne({
          where: {
            // @ts-ignore
            bukidId: pitakData.bukidId,
            location: pitakData.location || null,
          },
        });

        if (existing) {
          skippedPitaks.push({
            pitak: pitakData,
            reason: "Pitak already exists in this location",
            existingPitakId: existing.id,
          });
          continue;
        }

        // ✅ Create pitak tied to session
        const newPitak = pitakRepo.create({
          // @ts-ignore
          bukidId: pitakData.bukidId,
          location: pitakData.location || null,
          totalLuwang: pitakData.totalLuwang || 0.0,
          status: pitakData.status || "active",
          session: { id: sessionId }, // 🔑 tie to default session
        });

        const savedPitak = await pitakRepo.save(newPitak);
        createdPitaks.push(savedPitak);
      } catch (error) {
        skippedPitaks.push({
          pitak: pitakData,
          // @ts-ignore
          reason: `Error: ${error.message}`,
        });
      }
    }

    const totalLuWang = createdPitaks.reduce(
      // @ts-ignore
      (sum, pitak) => sum + parseFloat(pitak.totalLuwang || 0),
      0,
    );

    return {
      status: true,
      message: "Bulk pitak creation completed",
      data: {
        created: createdPitaks.map((p) => ({
          // @ts-ignore
          id: p.id,
          // @ts-ignore
          bukidId: p.bukidId,
          // @ts-ignore
          location: p.location,
          // @ts-ignore
          totalLuwang: parseFloat(p.totalLuwang),
          // @ts-ignore
          status: p.status,
          sessionId,
        })),
        skipped: skippedPitaks,
        failed: validationErrors,
      },
      meta: {
        totalProcessed: pitaks.length,
        totalCreated: createdPitaks.length,
        totalSkipped: skippedPitaks.length,
        totalFailed: validationErrors.length,
        totalLuWangCreated: totalLuWang.toFixed(2),
        sessionId,
      },
    };
  } catch (error) {
    console.error("Error in bulk pitak creation:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk creation failed: ${error.message}`,
      data: null,
    };
  }
};
