// ipc/user/change_password.ipc.js
//@ts-check


const bcrypt = require("bcryptjs");
const { AppDataSource } = require("../../db/dataSource");
const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async function changePassword(params = {}, queryRunner = null) {
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
    const { id, currentPassword, newPassword, confirmPassword, _userId } = params;
    
    if (!id || !newPassword) {
      return {
        status: false,
        message: 'User ID and new password are required',
        data: null
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        status: false,
        message: 'New password and confirmation do not match',
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

    // Verify current password if changing another user's password (admin) or self
    const isSelf = parseInt(id) === parseInt(_userId);
    
    if (isSelf && currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return {
          status: false,
          message: 'Current password is incorrect',
          data: null
        };
      }
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedPassword;
    user.updatedAt = new Date();

    // @ts-ignore
    await queryRunner.manager.save(user);
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'change_password',
      description: `Changed password for user: ${user.username} (ID: ${user.id})`,
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
      message: 'Password changed successfully',
      data: null
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in changePassword:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to change password: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};