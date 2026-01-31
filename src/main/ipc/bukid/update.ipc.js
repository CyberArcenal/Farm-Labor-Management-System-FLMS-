// ipc/bukid/update.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateBukid(params = {}, queryRunner = null) {
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
    const { id, name, location, _userId } = params;

    if (!id) {
      return {
        status: false,
        message: "Bukid ID is required",
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

    // Update fields
    if (name) bukid.name = name;
    if (location !== undefined) bukid.location = location;
    bukid.updatedAt = new Date();

    // ✅ Save updated bukid
    const updatedBukid = await bukidRepo.save(bukid);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "update_bukid",
      entity: "Bukid",
      entity_id: updatedBukid.id,
      description: `Updated bukid ID: ${id}`,
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
      message: "Bukid updated successfully",
      data: {
        id: updatedBukid.id,
        name: updatedBukid.name,
        location: updatedBukid.location,
        createdAt: updatedBukid.createdAt,
        updatedAt: updatedBukid.updatedAt,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in updateBukid:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update bukid: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};