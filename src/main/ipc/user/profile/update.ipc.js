// ipc/user/profile/update.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function updateProfile(params = {}, queryRunner = null) {
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
    const { userId, name, email, contact, address, _userId } = params;
    
    if (!userId) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    // Users can only update their own profile unless they're admin
    const isSelf = parseInt(userId) === parseInt(_userId);
    // @ts-ignore
    const currentUser = await queryRunner.manager.findOne(User, {
      where: { id: parseInt(_userId) }
    });
    
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isSelf && !isAdmin) {
      return {
        status: false,
        message: 'You can only update your own profile',
        data: null
      };
    }

    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return {
        status: false,
        message: 'User not found',
        data: null
      };
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

    // Update other profile fields
    if (name !== undefined) user.name = name;
    if (contact !== undefined) user.contact = contact;
    if (address !== undefined) user.address = address;
    
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
      action: 'update_profile',
      description: `Updated profile for user: ${user.username}`,
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
      message: 'Profile updated successfully',
      data: { user: userWithoutPassword }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateProfile:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update profile: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};