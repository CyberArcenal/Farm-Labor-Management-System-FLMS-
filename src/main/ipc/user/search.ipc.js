// ipc/user/search.ipc.js
//@ts-check

const User = require("../../../entities/User");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function searchUsers(params = {}) {
  try {
    const { 
      // @ts-ignore
      query, 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50,
      // @ts-ignore
      role,
      // @ts-ignore
      isActive
    } = params;
    
    if (!query) {
      return {
        status: false,
        message: 'Search query is required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    const queryBuilder = userRepository.createQueryBuilder('user');
    
    // Search in username, email, and name fields
    queryBuilder.where(
      '(user.username LIKE :query OR user.email LIKE :query)',
      { query: `%${query}%` }
    );
    
    // Apply filters
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }
    
    queryBuilder.orderBy('user.username', 'ASC');
    
    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    const [users, total] = await queryBuilder.getManyAndCount();
    
    // Remove passwords from response
    const sanitizedUsers = users.map((/** @type {{ [x: string]: any; password: any; }} */ user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return {
      status: true,
      message: 'Search completed successfully',
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
    console.error('Error in searchUsers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search users: ${error.message}`,
      data: null
    };
  }
};