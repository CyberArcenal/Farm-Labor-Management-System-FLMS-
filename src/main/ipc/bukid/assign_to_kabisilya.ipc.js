// ipc/bukid/assign_to_kabisilya.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async function assignToKabisilya(params = {}, queryRunner = null) {
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
    const { bukidId, kabisilyaId, _userId } = params;

    if (!bukidId || !kabisilyaId) {
      return {
        status: false,
        message: "Bukid ID and Kabisilya ID are required",
        data: null,
      };
    }

    // ✅ Use repository
    // @ts-ignore
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    const bukid = await bukidRepo.findOne({ where: { id: bukidId } });
    if (!bukid) {
      return {
        status: false,
        message: "Bukid not found",
        data: null,
      };
    }

    // Assign to kabisilya
    bukid.kabisilya = { id: kabisilyaId };
    bukid.updatedAt = new Date();

    const updatedBukid = await bukidRepo.save(bukid);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "assign_bukid_to_kabisilya",
      entity: "Bukid",
      entity_id: updatedBukid.id,
      description: `Assigned bukid ${bukidId} to kabisilya ${kabisilyaId}`,
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
      message: "Bukid assigned to kabisilya successfully",
      data: {
        id: updatedBukid.id,
        name: updatedBukid.name,
        location: updatedBukid.location,
        status: updatedBukid.status,
        kabisilya: updatedBukid.kabisilya,
        createdAt: updatedBukid.createdAt,
        updatedAt: updatedBukid.updatedAt,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in assignToKabisilya:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign bukid to kabisilya: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};