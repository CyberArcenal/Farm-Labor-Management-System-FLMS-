// src/ipc/bukid/bulk_create.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");
const { farmSessionDefaultSessionId } = require("../../../utils/system");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkCreateBukid(params = {}, queryRunner = null) {
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
    const { bukids = [], _userId } = params;

    if (!Array.isArray(bukids) || bukids.length === 0) {
      return {
        status: false,
        message: "No bukid data provided",
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

    const results = {
      successful: [],
      failed: [],
      total: bukids.length,
    };

    // @ts-ignore
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    // Check for duplicates first
    const existingNames = await bukidRepo
      .createQueryBuilder("bukid")
      .select("bukid.name")
      .where("bukid.name IN (:...names)", {
        names: bukids.map((b) => b.name).filter((name) => name),
      })
      .getMany();

    // @ts-ignore
    const existingNameSet = new Set(existingNames.map((b) => b.name));

    // Process each bukid
    for (const [index, bukidData] of bukids.entries()) {
      try {
        const { name, location } = bukidData;

        if (!name) {
          // @ts-ignore
          results.failed.push({ index, name, error: "Name is required" });
          continue;
        }

        if (existingNameSet.has(name)) {
          // @ts-ignore
          results.failed.push({ index, name, error: "Name already exists" });
          continue;
        }

        // ✅ Create bukid tied to session
        const bukid = bukidRepo.create({
          name,
          location: location || null,
          session: { id: sessionId }, // 🔑 tie to default session
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const savedBukid = await bukidRepo.save(bukid);
        // @ts-ignore
        results.successful.push(savedBukid);
      } catch (error) {
        // @ts-ignore
        results.failed.push({
          index,
          name: bukidData.name || "Unknown",
          // @ts-ignore
          error: error.message,
        });
      }
    }

    // ✅ Log activity with session context
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "bulk_create_bukid",
      entity: "Bukid",
      session: { id: sessionId },
      description: `Bulk created ${results.successful.length} bukids`,
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
          ? `Created ${results.successful.length} of ${results.total} bukids successfully`
          : "No bukids were created",
      data: { results, sessionId },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error in bulkCreateBukid:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to bulk create bukid: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};