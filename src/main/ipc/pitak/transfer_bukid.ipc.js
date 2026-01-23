// src/ipc/pitak/transfer_bukid.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ id: any; newBukidId: any; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; name: unknown; location: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { id, newBukidId, _userId } = params;

    if (!id || !newBukidId) {
      return { 
        status: false, 
        message: "Pitak ID and new Bukid ID are required", 
        data: null 
      };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    // Get pitak
    // @ts-ignore
    const pitak = await pitakRepo.findOne({ 
      where: { id },
      relations: ['bukid']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Check if moving to same bukid
    if (pitak.bukidId === newBukidId) {
      return {
        status: false,
        message: "Pitak is already in the specified bukid",
        data: null
      };
    }

    // Get new bukid
    // @ts-ignore
    const newBukid = await bukidRepo.findOne({ where: { id: newBukidId } });
    if (!newBukid) {
      return { status: false, message: "New bukid not found", data: null };
    }

    const oldBukidId = pitak.bukidId;
    const oldBukidName = pitak.bukid ? pitak.bukid.name : 'Unknown';

    // Update pitak
    pitak.bukidId = newBukidId;
    pitak.updatedAt = new Date();

    const updatedPitak = await pitakRepo.save(pitak);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'transfer_pitak_bukid',
      entity: 'Pitak',
      entity_id: updatedPitak.id,
      details: JSON.stringify({
        oldBukidId,
        oldBukidName,
        newBukidId,
        newBukidName: newBukid.name,
        pitakLocation: pitak.location
      })
    });

    return {
      status: true,
      message: `Pitak transferred from "${oldBukidName}" to "${newBukid.name}"`,
      data: {
        id: updatedPitak.id,
        oldBukid: {
          id: oldBukidId,
          name: oldBukidName
        },
        newBukid: {
          id: newBukidId,
          name: newBukid.name
        },
        updatedAt: updatedPitak.updatedAt
      }
    };

  } catch (error) {
    console.error("Error transferring pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to transfer pitak: ${error.message}`,
      data: null
    };
  }
};