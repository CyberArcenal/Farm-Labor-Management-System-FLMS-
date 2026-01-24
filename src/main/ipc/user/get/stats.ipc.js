// ipc/user/get/stats.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUserStats(params = {}) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Get total users
    const totalUsers = await userRepository.count();
    
    // Get active users
    const activeUsers = await userRepository.count({
      where: { isActive: true }
    });
    
    // Get users by role
    const usersByRole = await userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.role')
      .getRawMany();
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await userRepository.count({
      where: {
        createdAt: {
          // @ts-ignore
          $gte: thirtyDaysAgo
        }
      }
    });
    
    // Get last login stats
    const usersWithLastLogin = await userRepository.count({
      where: {
        lastLogin: {
          // @ts-ignore
          $not: null
        }
      }
    });
    
    return {
      status: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole,
        recentRegistrations,
        usersWithLastLogin,
        usersNeverLoggedIn: totalUsers - usersWithLastLogin
      }
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve user statistics: ${error.message}`,
      data: null
    };
  }
};