// src/ipc/pitak/update_location.ipc.js
//@ts-check

const { Not } = require("typeorm");
const Pitak = require("../../../entities/Pitak");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ id: any; location: any; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { id, location, _userId } = params;

    if (!id) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    if (location === undefined) {
      return { status: false, message: "Location is required", data: null };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    // @ts-ignore
    const pitak = await pitakRepo.findOne({ where: { id } });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Check for duplicate location in same bukid
    if (location) {
      // @ts-ignore
      const existing = await pitakRepo.findOne({
        where: {
          bukidId: pitak.bukidId,
          location,
          id: Not(id)
        }
      });
      
      if (existing) {
        return { 
          status: false, 
          message: "Another pitak already exists at this location in the same bukid", 
          data: null 
        };
      }
    }

    const oldLocation = pitak.location;
    
    // Update location
    pitak.location = location;
    pitak.updatedAt = new Date();

    const updatedPitak = await pitakRepo.save(pitak);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'update_pitak_location',
      entity: 'Pitak',
      entity_id: updatedPitak.id,
      details: JSON.stringify({
        oldLocation,
        newLocation: location,
        bukidId: pitak.bukidId
      })
    });

    return {
      status: true,
      message: `Pitak location updated${oldLocation ? ` from "${oldLocation}"` : ''} to "${location}"`,
      data: {
        id: updatedPitak.id,
        oldLocation,
        newLocation: updatedPitak.location,
        updatedAt: updatedPitak.updatedAt
      }
    };

  } catch (error) {
    console.error("Error updating pitak location:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update pitak location: ${error.message}`,
      data: null
    };
  }
};