// src/ipc/bukid/create.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function createBukid(params = {}, queryRunner = null) {
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
    const { name, location, _userId } = params;

    if (!name) {
      return {
        status: false,
        message: "Bukid name is required",
        data: null,
      };
    }

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return {
        status: false,
        message: "No default session configured. Please set one in Settings.",
        data: null,
      };
    }

    // @ts-ignore
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    const existingBukid = await bukidRepo.findOne({ where: { name } });
    if (existingBukid) {
      return {
        status: false,
        message: "Bukid with this name already exists",
        data: null,
      };
    }

    // ✅ Create new bukid tied to session
    const newBukid = bukidRepo.create({
      name,
      location: location || null,
      session: { id: sessionId }, // 🔑 tie to default session
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedBukid = await bukidRepo.save(newBukid);

    // ✅ Log activity with session context
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "create_bukid",
      entity: "Bukid",
      entity_id: savedBukid.id,
      session: { id: sessionId },
      description: `Created bukid: ${name}`,
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
      message: "Bukid created successfully",
      data: {
        id: savedBukid.id,
        name: savedBukid.name,
        location: savedBukid.location,
        sessionId,
        createdAt: savedBukid.createdAt,
        updatedAt: savedBukid.updatedAt,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in createBukid:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create bukid: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};