// ipc/user/get/active.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getActiveUsers(params = {}) {
  try {
    // @ts-ignore
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'DESC' } = params;

    const userRepository = AppDataSource.getRepository(User);
    
    const queryBuilder = userRepository.createQueryBuilder('user');
    queryBuilder.where('user.isActive = :isActive', { isActive: true });
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);
    
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
      message: 'Active users retrieved successfully',
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
    console.error('Error in getActiveUsers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve active users: ${error.message}`,
      data: null
    };
  }
};