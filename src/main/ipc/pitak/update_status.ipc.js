// src/ipc/pitak/update_status.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Assignment = require("../../../entities/Assignment");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ id: any; status: any; notes: any; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; luwangCount: unknown; assignmentDate: unknown; status: unknown; notes: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { id, status, notes, _userId } = params;

    if (!id || !status) {
      return { 
        status: false, 
        message: "Pitak ID and status are required", 
        data: null 
      };
    }

    const validStatuses = ['active', 'inactive', 'harvested'];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    // @ts-ignore
    const pitak = await pitakRepo.findOne({ where: { id } });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    const oldStatus = pitak.status;
    
    // If marking as harvested, check if there are active assignments
    if (status === 'harvested') {
      const assignmentRepo = queryRunner.manager.getRepository(Assignment);
      // @ts-ignore
      const activeAssignments = await assignmentRepo.count({
        where: {
          pitakId: id,
          status: 'active'
        }
      });

      if (activeAssignments > 0) {
        return {
          status: false,
          message: `Cannot mark pitak as harvested while there are ${activeAssignments} active assignments`,
          data: null
        };
      }
    }

    // Update pitak status
    pitak.status = status;
    if (notes) pitak.notes = (pitak.notes ? pitak.notes + '\n' : '') + `[${new Date().toISOString()}] Status changed to ${status}: ${notes}`;
    pitak.updatedAt = new Date();

    const updatedPitak = await pitakRepo.save(pitak);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'update_pitak_status',
      entity: 'Pitak',
      entity_id: updatedPitak.id,
      details: JSON.stringify({
        oldStatus,
        newStatus: status,
        notes
      })
    });

    return {
      status: true,
      message: `Pitak status updated from ${oldStatus} to ${status}`,
      data: {
        id: updatedPitak.id,
        oldStatus,
        newStatus: updatedPitak.status,
        updatedAt: updatedPitak.updatedAt
      }
    };

  } catch (error) {
    console.error("Error updating pitak status:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update pitak status: ${error.message}`,
      data: null
    };
  }
};