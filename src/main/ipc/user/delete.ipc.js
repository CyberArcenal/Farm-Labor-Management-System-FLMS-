// ipc/user/delete.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function deleteUser(params = {}, queryRunner = null) {
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
    const { id, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return {
        status: false,
        message: 'User not found',
        data: null
      };
    }

    // Prevent deleting self
    if (parseInt(id) === parseInt(_userId)) {
      return {
        status: false,
        message: 'Cannot delete your own account',
        data: null
      };
    }

    // Store user info for logging before deletion
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    // Delete the user
    // @ts-ignore
    await queryRunner.manager.remove(user);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'delete_user',
      description: `Deleted user: ${userInfo.username} (ID: ${userInfo.id})`,
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
      message: 'User deleted successfully',
      data: { deletedUser: userInfo }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in deleteUser:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete user: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};