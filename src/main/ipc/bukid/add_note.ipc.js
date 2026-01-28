// ipc/bukid/add_note.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const Bukid = require("../../../entities/Bukid");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async function addBukidNote(params = {}, queryRunner = null) {
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
    const { id, note, _userId } = params;

    if (!id || !note) {
      return {
        status: false,
        message: "Bukid ID and note are required",
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

    // Add note (assuming Bukid entity has a `notes` field)
    const currentNotes = bukid.notes || "";
    const newNotes = currentNotes
      ? `${currentNotes}\n${new Date().toISOString()}: ${note}`
      : `${new Date().toISOString()}: ${note}`;

    bukid.notes = newNotes;
    bukid.updatedAt = new Date();

    const updatedBukid = await bukidRepo.save(bukid);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: "add_bukid_note",
      entity: "Bukid",
      entity_id: updatedBukid.id,
      description: `Added note to bukid ID: ${id}`,
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
      message: "Note added successfully",
      data: {
        id: updatedBukid.id,
        name: updatedBukid.name,
        location: updatedBukid.location,
        notes: updatedBukid.notes,
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
    console.error("Error in addBukidNote:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to add note: ${error.message}`,
      data: null,
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};