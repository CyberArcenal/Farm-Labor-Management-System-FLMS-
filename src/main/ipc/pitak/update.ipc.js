// src/ipc/pitak/update.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ id: any; location: any; totalLuwang: any; status: any; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { id, location, totalLuwang, status, _userId } = params;

    if (!id) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    // @ts-ignore
    const pitak = await pitakRepo.findOne({ where: { id } });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Store old values for activity log
    const oldValues = {
      location: pitak.location,
      totalLuwang: pitak.totalLuwang,
      status: pitak.status
    };

    // Update fields
    if (location !== undefined) pitak.location = location;
    if (totalLuwang !== undefined) pitak.totalLuwang = parseFloat(totalLuwang);
    if (status !== undefined) pitak.status = status;
    
    pitak.updatedAt = new Date();

    const updatedPitak = await pitakRepo.save(pitak);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'update_pitak',
      entity: 'Pitak',
      entity_id: updatedPitak.id,
      details: JSON.stringify({
        changes: {
          location: location !== undefined ? { old: oldValues.location, new: location } : undefined,
          totalLuwang: totalLuwang !== undefined ? { old: oldValues.totalLuwang, new: totalLuwang } : undefined,
          status: status !== undefined ? { old: oldValues.status, new: status } : undefined
        }
      })
    });

    return {
      status: true,
      message: "Pitak updated successfully",
      data: {
        id: updatedPitak.id,
        bukidId: updatedPitak.bukidId,
        location: updatedPitak.location,
        totalLuwang: parseFloat(updatedPitak.totalLuwang),
        status: updatedPitak.status,
        updatedAt: updatedPitak.updatedAt
      }
    };

  } catch (error) {
    console.error("Error updating pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update pitak: ${error.message}`,
      data: null
    };
  }
};