// ipc/bukid/assign_to_kabisilya.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");
const UserActivity = require("../../../../entities/UserActivity");

module.exports = async function assignToKabisilya(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
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
        message: 'Bukid ID and Kabisilya ID are required',
        data: null
      };
    }

    // Find bukid
    // @ts-ignore
    const bukid = await queryRunner.manager.findOne(Bukid, {
      where: { id: bukidId }
    });

    if (!bukid) {
      return {
        status: false,
        message: 'Bukid not found',
        data: null
      };
    }

    // Assign to kabisilya
    // @ts-ignore
    await queryRunner.manager.update(Bukid, bukidId, {
      kabisilya: { id: kabisilyaId },
      updatedAt: new Date()
    });
    
    // Get updated bukid
    // @ts-ignore
    const updatedBukid = await queryRunner.manager.findOne(Bukid, {
      where: { id: bukidId },
      relations: ['kabisilya']
    });

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'assign_bukid_to_kabisilya',
      description: `Assigned bukid ${bukidId} to kabisilya ${kabisilyaId}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: 'Bukid assigned to kabisilya successfully',
      data: { bukid: updatedBukid }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in assignToKabisilya:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign bukid to kabisilya: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};