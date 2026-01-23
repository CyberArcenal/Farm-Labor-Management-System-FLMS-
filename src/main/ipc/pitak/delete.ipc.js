// src/ipc/pitak/delete.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Assignment = require("../../../entities/Assignment");
const Payment = require("../../../entities/Payment");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ id: any; force?: false | undefined; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; luwangCount: unknown; assignmentDate: unknown; status: unknown; notes: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; grossPay: unknown; manualDeduction: unknown; netPay: unknown; status: unknown; paymentDate: unknown; paymentMethod: unknown; referenceNumber: unknown; periodStart: unknown; periodEnd: unknown; totalDebtDeduction: unknown; otherDeductions: unknown; deductionBreakdown: unknown; notes: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { id, force = false, _userId } = params;

    if (!id) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    const paymentRepo = queryRunner.manager.getRepository(Payment);

    // Get pitak with relations
    // @ts-ignore
    const pitak = await pitakRepo.findOne({
      where: { id },
      relations: ['bukid', 'assignments', 'payments']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Check for dependencies
    const assignmentsCount = pitak.assignments ? pitak.assignments.length : 0;
    const paymentsCount = pitak.payments ? pitak.payments.length : 0;

    if (!force && (assignmentsCount > 0 || paymentsCount > 0)) {
      return {
        status: false,
        message: `Cannot delete pitak with ${assignmentsCount} assignment(s) and ${paymentsCount} payment(s). Use force=true to override.`,
        data: {
          assignmentsCount,
          paymentsCount
        }
      };
    }

    // Store data for activity log
    const pitakData = {
      id: pitak.id,
      location: pitak.location,
      totalLuwang: pitak.totalLuwang,
      status: pitak.status,
      bukidId: pitak.bukidId,
      assignmentsCount,
      paymentsCount
    };

    // If force delete, handle dependencies
    if (force) {
      if (assignmentsCount > 0) {
        // @ts-ignore
        await assignmentRepo.delete({ pitakId: id });
      }
      if (paymentsCount > 0) {
        // @ts-ignore
        await paymentRepo.delete({ pitakId: id });
      }
    }

    // Delete pitak
    // @ts-ignore
    await pitakRepo.delete(id);

    // Log activity
    await queryRunner.manager.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'delete_pitak',
      entity: 'Pitak',
      entity_id: id,
      details: JSON.stringify({
        ...pitakData,
        forceDelete: force,
        deletedAt: new Date()
      })
    });

    return {
      status: true,
      message: `Pitak deleted successfully${force ? ' (force delete)' : ''}`,
      data: {
        id,
        assignmentsDeleted: force ? assignmentsCount : 0,
        paymentsDeleted: force ? paymentsCount : 0,
        deletedAt: new Date()
      }
    };

  } catch (error) {
    console.error("Error deleting pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete pitak: ${error.message}`,
      data: null
    };
  }
};