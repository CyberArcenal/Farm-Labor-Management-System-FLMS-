// src/ipc/pitak/update_luwang.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ id: any; totalLuwang: any; adjustmentType?: "set" | undefined; notes: any; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { id, totalLuwang, adjustmentType = 'set', notes, _userId } = params;

    if (!id || totalLuwang === undefined) {
      return { 
        status: false, 
        message: "Pitak ID and totalLuwang are required", 
        data: null 
      };
    }

    const totalLuwangNum = parseFloat(totalLuwang);
    if (isNaN(totalLuwangNum)) {
      return { 
        status: false, 
        message: "totalLuwang must be a valid number", 
        data: null 
      };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    // @ts-ignore
    const pitak = await pitakRepo.findOne({ where: { id } });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    const oldLuWang = parseFloat(pitak.totalLuwang);
    let newLuWang;

    switch (adjustmentType) {
      // @ts-ignore
      case 'add':
        newLuWang = oldLuWang + totalLuwangNum;
        break;
      // @ts-ignore
      case 'subtract':
        newLuWang = oldLuWang - totalLuwangNum;
        if (newLuWang < 0) {
          return {
            status: false,
            message: "Cannot subtract more than current total LuWang",
            data: null
          };
        }
        break;
      case 'set':
      default:
        newLuWang = totalLuwangNum;
        break;
    }

    // Validate new value
    if (newLuWang < 0) {
      return {
        status: false,
        message: "Total LuWang cannot be negative",
        data: null
      };
    }

    // Update pitak
    pitak.totalLuwang = newLuWang.toFixed(2);
    if (notes) {
      pitak.notes = (pitak.notes ? pitak.notes + '\n' : '') + 
        // @ts-ignore
        `[${new Date().toISOString()}] LuWang ${adjustmentType === 'add' ? 'increased' : adjustmentType === 'subtract' ? 'decreased' : 'set'} from ${oldLuWang.toFixed(2)} to ${newLuWang.toFixed(2)}: ${notes}`;
    }
    pitak.updatedAt = new Date();

    const updatedPitak = await pitakRepo.save(pitak);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'update_pitak_luwang',
      entity: 'Pitak',
      entity_id: updatedPitak.id,
      details: JSON.stringify({
        oldLuWang,
        newLuWang,
        adjustmentType,
        difference: newLuWang - oldLuWang,
        notes
      })
    });

    return {
      status: true,
      // @ts-ignore
      message: `Pitak LuWang ${adjustmentType === 'add' ? 'increased' : adjustmentType === 'subtract' ? 'decreased' : 'updated'} from ${oldLuWang.toFixed(2)} to ${newLuWang.toFixed(2)}`,
      data: {
        id: updatedPitak.id,
        oldLuWang,
        newLuWang,
        difference: (newLuWang - oldLuWang).toFixed(2),
        updatedAt: updatedPitak.updatedAt
      }
    };

  } catch (error) {
    console.error("Error updating pitak LuWang:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update pitak LuWang: ${error.message}`,
      data: null
    };
  }
};