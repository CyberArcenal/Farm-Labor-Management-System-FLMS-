// ipc/user/update_role.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateUserRole(params = {}, queryRunner = null) {
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
    const { id, role, _userId } = params;
    
    if (!id || !role) {
      return {
        status: false,
        message: 'User ID and role are required',
        data: null
      };
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      return {
        status: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
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

    // Prevent changing own role to non-admin
    if (parseInt(id) === parseInt(_userId) && role !== 'admin') {
      return {
        status: false,
        message: 'Cannot change your own role to non-admin',
        data: null
      };
    }

    const oldRole = user.role;
    user.role = role;
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
      action: 'update_user_role',
      description: `Changed user role: ${user.username} from ${oldRole} to ${role}`,
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
      message: 'User role updated successfully',
      data: { user: userWithoutPassword }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateUserRole:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update user role: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};