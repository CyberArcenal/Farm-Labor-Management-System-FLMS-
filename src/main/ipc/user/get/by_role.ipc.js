// ipc/user/get/by_role.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUsersByRole(params = {}) {
  try {
    // @ts-ignore
    const { role, page = 1, limit = 50 } = params;
    
    if (!role) {
      return {
        status: false,
        message: 'Role is required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    
    const queryBuilder = userRepository.createQueryBuilder('user');
    queryBuilder.where('user.role = :role', { role });
    queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    queryBuilder.orderBy('user.name', 'ASC');
    
    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    const [users, total] = await queryBuilder.getManyAndCount();
    
    // Remove passwords from response
    // @ts-ignore
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return {
      status: true,
      message: 'Users retrieved successfully',
      data: {
        users: sanitizedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve users: ${error.message}`,
      data: null
    };
  }
};