// ipc/bukid/update_status.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async function updateBukidStatus(params = {}, queryRunner = null) {
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
    const { id, status, _userId } = params;

    if (!id || !status) {
      return {
        status: false,
        message: "Bukid ID and status are required",
        data: null,
      };
    }

    // ✅ Use repository
    // @ts-ignore
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    const bukid = await bukidRepo.findOne({ where: { id } });
    if (!bukid) {
      return {
        status: false,
        message: "Bukid not found",
        data: null,
      };
    }

    // Update status
    bukid.status = status;
    bukid.updatedAt = new Date();

    const updatedBukid = await bukidRepo.save(bukid);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "update_bukid_status",
      entity: "Bukid",
      entity_id: updatedBukid.id,
      description: `Updated bukid ${id} status to: ${status}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: "Bukid status updated successfully",
      data: {
        id: updatedBukid.id,
        name: updatedBukid.name,
        location: updatedBukid.location,
        status: updatedBukid.status,
        createdAt: updatedBukid.createdAt,
        updatedAt: updatedBukid.updatedAt,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in updateBukidStatus:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update bukid status: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};