// ipc/user/bulk_update.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function bulkUpdateUsers(params = {}, queryRunner = null) {
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
    const { updates, _userId } = params;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return {
        status: false,
        message: 'Updates array is required and must not be empty',
        data: null
      };
    }

    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository(User);
    const updatedUsers = [];
    const errors = [];

    for (const updateData of updates) {
      try {
        const { id, ...updateFields } = updateData;
        
        if (!id) {
          errors.push({ 
            update: updateData, 
            error: 'User ID is required' 
          });
          continue;
        }

        const user = await userRepository.findOne({
          where: { id: parseInt(id) }
        });

        if (!user) {
          errors.push({ 
            update: updateData, 
            error: 'User not found' 
          });
          continue;
        }

        // Prevent self-updates for certain fields
        if (parseInt(id) === parseInt(_userId)) {
          if (updateFields.role && updateFields.role !== 'admin') {
            errors.push({ 
              update: updateData, 
              error: 'Cannot change your own role to non-admin' 
            });
            continue;
          }

          if (updateFields.isActive === false) {
            errors.push({ 
              update: updateData, 
              error: 'Cannot deactivate your own account' 
            });
            continue;
          }
        }

        // Apply updates
        Object.assign(user, updateFields);
        user.updatedAt = new Date();

        // @ts-ignore
        const savedUser = await queryRunner.manager.save(user);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = savedUser;
        updatedUsers.push(userWithoutPassword);
      } catch (error) {
        errors.push({ 
          update: updateData, 
          // @ts-ignore
          error: error.message 
        });
      }
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'bulk_update_users',
      description: `Updated ${updatedUsers.length} users in bulk`,
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
      message: `Bulk update completed. Updated: ${updatedUsers.length}, Failed: ${errors.length}`,
      data: {
        updated: updatedUsers,
        errors,
        summary: {
          total: updates.length,
          updated: updatedUsers.length,
          failed: errors.length
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkUpdateUsers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk update failed: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};