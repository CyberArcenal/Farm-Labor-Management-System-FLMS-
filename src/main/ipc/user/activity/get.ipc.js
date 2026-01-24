// ipc/user/activity/get.ipc.js
//@ts-check

// @ts-ignore
const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUserActivity(params = {}) {
  try {
    const { 
      // @ts-ignore
      userId, 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 100,
      // @ts-ignore
      action,
      // @ts-ignore
      startDate,
      // @ts-ignore
      endDate,
      // @ts-ignore
      sortBy = 'created_at',
      // @ts-ignore
      sortOrder = 'DESC'
    } = params;
    
    if (!userId) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    const activityRepository = AppDataSource.getRepository(UserActivity);
    const queryBuilder = activityRepository.createQueryBuilder('activity');
    
    // Filter by user
    queryBuilder.where('activity.user_id = :userId', { userId: parseInt(userId) });
    
    // Filter by action
    if (action) {
      queryBuilder.andWhere('activity.action = :action', { action });
    }
    
    // Filter by date range
    if (startDate) {
      queryBuilder.andWhere('activity.created_at >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('activity.created_at <= :endDate', { endDate: end });
    }
    
    // Apply sorting
    queryBuilder.orderBy(`activity.${sortBy}`, sortOrder);
    
    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    const [activities, total] = await queryBuilder.getManyAndCount();
    
    return {
      status: true,
      message: 'User activity retrieved successfully',
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getUserActivity:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve user activity: ${error.message}`,
      data: null
    };
  }
};