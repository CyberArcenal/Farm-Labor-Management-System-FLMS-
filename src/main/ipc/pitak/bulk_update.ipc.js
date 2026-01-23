// src/ipc/pitak/bulk_update.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const { In } = require("typeorm");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ pitakIds: any; updates: any; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { pitakIds, updates, _userId } = params;

    if (!Array.isArray(pitakIds) || pitakIds.length === 0) {
      return {
        status: false,
        message: "pitakIds array is required and must not be empty",
        data: null
      };
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return {
        status: false,
        message: "updates object is required and must not be empty",
        data: null
      };
    }

    const allowedUpdates = ['location', 'totalLuwang', 'status'];
    const updateKeys = Object.keys(updates);
    
    // Validate update fields
    const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));
    if (invalidKeys.length > 0) {
      return {
        status: false,
        message: `Invalid update fields: ${invalidKeys.join(', ')}. Allowed fields: ${allowedUpdates.join(', ')}`,
        data: null
      };
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['active', 'inactive', 'harvested'];
      if (!validStatuses.includes(updates.status)) {
        return {
          status: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          data: null
        };
      }
    }

    // Validate totalLuwang if provided
    if (updates.totalLuwang !== undefined) {
      const totalLuwangNum = parseFloat(updates.totalLuwang);
      if (isNaN(totalLuwangNum) || totalLuwangNum < 0) {
        return {
          status: false,
          message: "totalLuwang must be a non-negative number",
          data: null
        };
      }
      updates.totalLuwang = totalLuwangNum.toFixed(2);
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    
    // Get current pitaks
    // @ts-ignore
    const pitaks = await pitakRepo.find({
      where: { id: In(pitakIds) }
    });

    if (pitaks.length === 0) {
      return {
        status: false,
        message: "No pitaks found with the provided IDs",
        data: null
      };
    }

    const updatedPitaks = [];
    const failedUpdates = [];

    // Update each pitak
    for (const pitak of pitaks) {
      try {
        // Store old values
        const oldValues = {};
        updateKeys.forEach(key => {
          // @ts-ignore
          oldValues[key] = pitak[key];
        });

        // Apply updates
        updateKeys.forEach(key => {
          pitak[key] = updates[key];
        });

        pitak.updatedAt = new Date();

        const updatedPitak = await pitakRepo.save(pitak);
        updatedPitaks.push({
          id: updatedPitak.id,
          oldValues,
          newValues: updateKeys.reduce((obj, key) => {
            // @ts-ignore
            obj[key] = updatedPitak[key];
            return obj;
          }, {})
        });

        // Log activity for each pitak
        await queryRunner.manager.getRepository(UserActivity).save({
          user_id: _userId,
          action: 'bulk_update_pitak',
          entity: 'Pitak',
          entity_id: updatedPitak.id,
          details: JSON.stringify({
            updates: updateKeys.map(key => ({
              field: key,
              // @ts-ignore
              old: oldValues[key],
              new: updates[key]
            }))
          })
        });

      } catch (error) {
        failedUpdates.push({
          pitakId: pitak.id,
          // @ts-ignore
          error: error.message
        });
      }
    }

    return {
      status: true,
      message: `Bulk update completed. ${updatedPitaks.length} updated, ${failedUpdates.length} failed`,
      data: {
        updated: updatedPitaks,
        failed: failedUpdates
      },
      meta: {
        totalRequested: pitakIds.length,
        totalFound: pitaks.length,
        totalUpdated: updatedPitaks.length,
        totalFailed: failedUpdates.length
      }
    };

  } catch (error) {
    console.error("Error in bulk pitak update:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk update failed: ${error.message}`,
      data: null
    };
  }
};