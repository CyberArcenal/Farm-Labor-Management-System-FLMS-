// src/ipc/session/delete.ipc.js
//@ts-check
const Session = require("../../../entities/Session");
const Bukid = require("../../../entities/Bukid");

/**
 * Delete a Session (soft delete or permanent based on status)
 * @param {Object} params - Delete parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      id,
      // @ts-ignore
      force = false, // Force delete even if it has bukids
      // @ts-ignore
      _userId 
    } = params;

    if (!id) {
      return {
        status: false,
        message: "Session ID is required",
        data: null
      };
    }

    const sessionRepo = queryRunner.manager.getRepository(Session);
    const bukidRepo = queryRunner.manager.getRepository(Bukid);
    
    // Get session with bukids
    const session = await sessionRepo.findOne({
      where: { id: id },
      relations: ["bukids"]
    });

    if (!session) {
      return {
        status: false,
        message: "Session not found",
        data: null
      };
    }

    // Check if session has bukids
    // @ts-ignore
    if (session.bukids && session.bukids.length > 0) {
      if (!force) {
        return {
          status: false,
          // @ts-ignore
          message: `Session has ${session.bukids.length} bukid(s). Use force=true to delete anyway.`,
          data: {
            // @ts-ignore
            bukidCount: session.bukids.length,
            // @ts-ignore
            bukids: session.bukids.map(b => ({ id: b.id, name: b.name }))
          }
        };
      }
      
      // If force delete, first delete bukids (cascade will handle pitaks)
      // @ts-ignore
      for (const bukid of session.bukids) {
        await bukidRepo.delete(bukid.id);
      }
    }

    // Delete the session
    await sessionRepo.delete(id);

    // Log activity (called from main handler)

    return {
      status: true,
      message: "Session deleted successfully",
      data: {
        id: id,
        name: session.name,
        // @ts-ignore
        bukidsDeleted: session.bukids?.length || 0
      }
    };

  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete session: ${error.message}`,
      data: null
    };
  }
};