// src/ipc/pitak/create.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ bukidId: any; location: any; totalLuwang?: 0 | undefined; status?: "active" | undefined; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; name: unknown; location: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { bukidId, location, totalLuwang = 0.00, status = 'active', _userId } = params;

    if (!bukidId) {
      return { status: false, message: "Bukid ID is required", data: null };
    }

    const bukidRepo = queryRunner.manager.getRepository(Bukid);
    // @ts-ignore
    const bukid = await bukidRepo.findOne({ where: { id: bukidId } });
    
    if (!bukid) {
      return { status: false, message: "Bukid not found", data: null };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    
    // Check for duplicate location in same bukid
    if (location) {
      // @ts-ignore
      const existing = await pitakRepo.findOne({
        where: { bukidId, location }
      });
      
      if (existing) {
        return { 
          status: false, 
          message: "A pitak already exists at this location in the same bukid", 
          data: null 
        };
      }
    }

    // @ts-ignore
    const newPitak = pitakRepo.create({
      bukidId,
      location,
      // @ts-ignore
      totalLuwang: parseFloat(totalLuwang),
      status
    });

    const savedPitak = await pitakRepo.save(newPitak);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'create_pitak',
      entity: 'Pitak',
      entity_id: savedPitak.id,
      details: JSON.stringify({
        bukidId,
        location,
        totalLuwang,
        status
      })
    });

    return {
      status: true,
      message: "Pitak created successfully",
      data: {
        id: savedPitak.id,
        bukidId: savedPitak.bukidId,
        location: savedPitak.location,
        totalLuwang: parseFloat(savedPitak.totalLuwang),
        status: savedPitak.status,
        createdAt: savedPitak.createdAt
      }
    };

  } catch (error) {
    console.error("Error creating pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create pitak: ${error.message}`,
      data: null
    };
  }
};