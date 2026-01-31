// src/ipc/session/duplicate.ipc.js
//@ts-check
const Session = require("../../../entities/Session");
const Bukid = require("../../../entities/Bukid");
const Pitak = require("../../../entities/Pitak");

/**
 * Duplicate a Session along with its Bukids and Pitaks
 * @param {Object} params - Duplicate parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      sessionId,
      // @ts-ignore
      newName,
      // @ts-ignore
      newYear,
      // @ts-ignore
      _userId 
    } = params;

    if (!sessionId) {
      return {
        status: false,
        message: "Session ID is required",
        data: null
      };
    }

    if (!newName || newName.trim() === "") {
      return {
        status: false,
        message: "New session name is required",
        data: null
      };
    }

    const sessionRepo = queryRunner.manager.getRepository(Session);
    const bukidRepo = queryRunner.manager.getRepository(Bukid);
    const pitakRepo = queryRunner.manager.getRepository(Pitak);

    // Get source session with relations
    const sourceSession = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ["bukids", "bukids.pitaks"]
    });

    if (!sourceSession) {
      return {
        status: false,
        message: "Source session not found",
        data: null
      };
    }

    // Check if new session name already exists for the year
    const yearToUse = newYear || sourceSession.year;
    const existingSession = await sessionRepo.findOne({
      where: { 
        name: newName.trim(),
        year: yearToUse
      }
    });

    if (existingSession) {
      return {
        status: false,
        message: "Session with this name and year already exists",
        data: null
      };
    }

    // Create new session (duplicate without ID)
    const newSessionData = {
      name: newName.trim(),
      seasonType: sourceSession.seasonType,
      year: yearToUse,
      startDate: sourceSession.startDate,
      endDate: sourceSession.endDate,
      status: "active", // Always start as active
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newSession = sessionRepo.create(newSessionData);
    const savedSession = await sessionRepo.save(newSession);

    // Duplicate bukids and pitaks
    // @ts-ignore
    if (sourceSession.bukids && sourceSession.bukids.length > 0) {
      // @ts-ignore
      for (const sourceBukid of sourceSession.bukids) {
        // Create new bukid
        // @ts-ignore
        const newBukid = bukidRepo.create({
          name: sourceBukid.name,
          status: "active",
          location: sourceBukid.location,
          session: savedSession,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        const savedBukid = await bukidRepo.save(newBukid);

        // Duplicate pitaks if they exist
        if (sourceBukid.pitaks && sourceBukid.pitaks.length > 0) {
          for (const sourcePitak of sourceBukid.pitaks) {
            // @ts-ignore
            const newPitak = pitakRepo.create({
              location: sourcePitak.location,
              totalLuwang: sourcePitak.totalLuwang,
              status: "active",
              bukid: savedBukid,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            await pitakRepo.save(newPitak);
          }
        }
      }
    }

    // Get the complete duplicated session with relations
    const completeSession = await sessionRepo.findOne({
      // @ts-ignore
      where: { id: savedSession.id },
      relations: ["bukids", "bukids.pitaks"]
    });

    return {
      status: true,
      message: "Session duplicated successfully with bukids and pitaks",
      data: completeSession
    };

  } catch (error) {
    console.error("Error duplicating session:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to duplicate session: ${error.message}`,
      data: null
    };
  }
};