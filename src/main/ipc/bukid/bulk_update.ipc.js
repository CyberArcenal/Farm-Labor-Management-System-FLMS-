// ipc/bukid/bulk_update.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkUpdateBukid(params = {}, queryRunner = null) {
  let shouldRelease = false;

  if (!queryRunner) {
    // @ts-ignore
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { updates = [], _userId } = params;

    if (!Array.isArray(updates) || updates.length === 0) {
      return {
        status: false,
        message: "No updates provided",
        data: null,
      };
    }

    const results = {
      successful: [],
      failed: [],
      total: updates.length,
    };

    // @ts-ignore
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    // Process each update
    for (const [index, updateData] of updates.entries()) {
      try {
        const { id, ...updateFields } = updateData;

        if (!id) {
          // @ts-ignore
          results.failed.push({
            index,
            id: "unknown",
            error: "ID is required",
          });
          continue;
        }

        // Check if bukid exists
        const bukid = await bukidRepo.findOne({ where: { id } });
        if (!bukid) {
          // @ts-ignore
          results.failed.push({
            index,
            id,
            error: "Bukid not found",
          });
          continue;
        }

        // Apply updates
        Object.assign(bukid, updateFields);
        bukid.updatedAt = new Date();

        const updatedBukid = await bukidRepo.save(bukid);

        // @ts-ignore
        results.successful.push({
          id,
          bukid: updatedBukid,
        });
      } catch (error) {
        // @ts-ignore
        results.failed.push({
          index,
          id: updateData.id || "unknown",
          // @ts-ignore
          error: error.message,
        });
      }
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "bulk_update_bukid",
      entity: "Bukid",
      description: `Bulk updated ${results.successful.length} bukids`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease && results.successful.length > 0) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    } else if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }

    return {
      status: results.successful.length > 0,
      message:
        results.successful.length > 0
          ? `Updated ${results.successful.length} of ${results.total} bukids successfully`
          : "No bukids were updated",
      data: { results },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in bulkUpdateBukid:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk update bukid: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};