// ipc/user/update_status.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateUserStatus(params = {}, queryRunner = null) {
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
    const { id, isActive, _userId } = params;
    
    if (!id || isActive === undefined) {
      return {
        status: false,
        message: 'User ID and status are required',
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

    // Prevent deactivating self
    if (parseInt(id) === parseInt(_userId) && !isActive) {
      return {
        status: false,
        message: 'Cannot deactivate your own account',
        data: null
      };
    }

    const oldStatus = user.isActive;
    user.isActive = isActive;
    user.updatedAt = new Date();

    // @ts-ignore
    const updatedUser = await queryRunner.manager.save(user);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'update_user_status',
      description: `Changed user status: ${user.username} from ${oldStatus ? 'active' : 'inactive'} to ${isActive ? 'active' : 'inactive'}`,
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
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: userWithoutPassword }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateUserStatus:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update user status: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};