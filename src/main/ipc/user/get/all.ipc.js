// ipc/user/get/all.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAllUsers(params = {}) {
  try {
    const { 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      sortBy = 'createdAt', 
      // @ts-ignore
      sortOrder = 'DESC',
      // @ts-ignore
      includeInactive = false
    } = params;

    const userRepository = AppDataSource.getRepository(User);
    
    // Build query
    const queryBuilder = userRepository.createQueryBuilder('user');
    
    if (!includeInactive) {
      queryBuilder.where('user.isActive = :isActive', { isActive: true });
    }
    
    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);
    
    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    // Get users and total count
    const [users, total] = await queryBuilder.getManyAndCount();
    
    // Remove passwords from response
    const sanitizedUsers = users.map((/** @type {{ [x: string]: any; password: any; }} */ user) => {
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
    console.error('Error in getAllUsers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve users: ${error.message}`,
      data: null
    };
  }
};