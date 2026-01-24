// ipc/user/update.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateUser(params = {}, queryRunner = null) {
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
    const { id, username, email, role, isActive, _userId } = params;
    
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

    // Check if new username already exists (if changing username)
    if (username && username !== user.username) {
      const existingUser = await userRepository.findOne({
        where: { username }
      });

      if (existingUser) {
        return {
          status: false,
          message: 'Username already exists',
          data: null
        };
      }
      user.username = username;
    }

    // Check if new email already exists (if changing email)
    if (email && email !== user.email) {
      const existingUser = await userRepository.findOne({
        where: { email }
      });

      if (existingUser) {
        return {
          status: false,
          message: 'Email already exists',
          data: null
        };
      }
      user.email = email;
    }

    // Update other fields
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
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
      action: 'update_user',
      description: `Updated user: ${user.username} (ID: ${user.id})`,
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
      message: 'User updated successfully',
      data: { user: userWithoutPassword }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateUser:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update user: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};