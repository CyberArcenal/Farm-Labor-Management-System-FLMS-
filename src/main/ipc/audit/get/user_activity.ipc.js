// ipc/auditTrail/get/user_activity.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUserActivity(params = {}) {
  try {
    const { 
      // @ts-ignore
      userId, // Specific user ID to filter
      // @ts-ignore
      days = 7, // Last X days
      // @ts-ignore
      includeSystemActions = false,
      // @ts-ignore
      _userId // Current user accessing this data
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);
    
    // Build query conditions
    const whereConditions = {
      timestamp: {
        $gte: startTime
      }
    };
    
    if (userId) {
      // @ts-ignore
      whereConditions.actor = `User ${userId}`;
    } else {
      // Get all user activities (actors starting with "User ")
      // @ts-ignore
      whereConditions.actor = {
        $like: 'User %'
      };
    }
    
    if (!includeSystemActions) {
      // Exclude system-generated actions
      // @ts-ignore
      whereConditions.action = {
        $notLike: 'system_%'
      };
    }
    
    // Get user activities
    const userActivities = await auditRepo.find({
      where: whereConditions,
      order: { timestamp: 'DESC' },
      take: 1000 // Limit for performance
    });
    
    // Group by user
    const activitiesByUser = {};
    userActivities.forEach((/** @type {{ actor: any; }} */ activity) => {
      const user = activity.actor;
      // @ts-ignore
      if (!activitiesByUser[user]) {
        // @ts-ignore
        activitiesByUser[user] = [];
      }
      // @ts-ignore
      activitiesByUser[user].push(activity);
    });
    
    // Calculate user statistics
    const userStats = Object.keys(activitiesByUser).map(user => {
      // @ts-ignore
      const activities = activitiesByUser[user];
      const userIdFromActor = user.replace('User ', '');
      
      // Count actions by type
      const actionCounts = {};
      activities.forEach((/** @type {{ action: string | number; }} */ activity) => {
        // @ts-ignore
        actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
      });
      
      // Get most frequent action
      const mostFrequentAction = Object.keys(actionCounts).reduce((a, b) => 
        // @ts-ignore
        actionCounts[a] > actionCounts[b] ? a : b, 
        Object.keys(actionCounts)[0] || 'None'
      );
      
      // Calculate activity times
      const activityTimes = activities.map((/** @type {{ timestamp: string | number | Date; action: any; }} */ a) => {
        const hour = new Date(a.timestamp).getHours();
        return { hour, activity: a.action };
      });
      
      // Determine peak hour
      const hourCounts = {};
      activityTimes.forEach((/** @type {{ hour: string | number; }} */ at) => {
        // @ts-ignore
        hourCounts[at.hour] = (hourCounts[at.hour] || 0) + 1;
      });
      
      const peakHour = Object.keys(hourCounts).reduce((a, b) => 
        // @ts-ignore
        hourCounts[a] > hourCounts[b] ? a : b, 
        Object.keys(hourCounts)[0] || 'N/A'
      );
      
      return {
        userId: userIdFromActor,
        username: user,
        totalActions: activities.length,
        firstActivity: activities[activities.length - 1]?.timestamp,
        lastActivity: activities[0]?.timestamp,
        mostFrequentAction,
        actionCounts,
        peakHour: parseInt(peakHour),
        activityLevel: getActivityLevel(activities.length, days),
        uniqueActions: Object.keys(actionCounts).length
      };
    });
    
    // Sort users by activity level
    userStats.sort((a, b) => b.totalActions - a.totalActions);
    
    // Get overall statistics
    const overallStats = {
      totalUsers: Object.keys(activitiesByUser).length,
      totalActivities: userActivities.length,
      averageActivitiesPerUser: userActivities.length / (Object.keys(activitiesByUser).length || 1),
      busiestUser: userStats[0] || null,
      timeRange: {
        start: startTime,
        end: new Date(),
        days
      },
      activityTrend: calculateActivityTrend(userActivities)
    };
    
    // Get top actions across all users
    const allActionCounts = {};
    userActivities.forEach((/** @type {{ action: string | number; }} */ activity) => {
      // @ts-ignore
      allActionCounts[activity.action] = (allActionCounts[activity.action] || 0) + 1;
    });
    
    const topActions = Object.keys(allActionCounts)
      // @ts-ignore
      .map(action => ({ action, count: allActionCounts[action] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Helper functions
    /**
       * @param {number} count
       * @param {number} days
       */
    function getActivityLevel(count, days) {
      const dailyAverage = count / days;
      if (dailyAverage > 50) return 'very-high';
      if (dailyAverage > 20) return 'high';
      if (dailyAverage > 5) return 'medium';
      if (dailyAverage > 1) return 'low';
      return 'very-low';
    }
    
    /**
       * @param {any[]} activities
       */
    function calculateActivityTrend(activities) {
      if (activities.length < 2) return 'insufficient-data';
      
      // Group by day
      const dailyCounts = {};
      activities.forEach((/** @type {{ timestamp: { toISOString: () => string; }; }} */ activity) => {
        const dateKey = activity.timestamp.toISOString().split('T')[0];
        // @ts-ignore
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      });
      
      const dates = Object.keys(dailyCounts).sort();
      if (dates.length < 2) return 'stable';
      
      // @ts-ignore
      const firstDayCount = dailyCounts[dates[0]];
      // @ts-ignore
      const lastDayCount = dailyCounts[dates[dates.length - 1]];
      const percentageChange = ((lastDayCount - firstDayCount) / firstDayCount) * 100;
      
      if (percentageChange > 20) return 'increasing';
      if (percentageChange < -20) return 'decreasing';
      return 'stable';
    }
    
    // Log access (be careful with privacy - don't log specific user data)
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: userId ? 'view_specific_user_activity' : 'view_all_user_activity',
      actor: `User ${_userId}`,
      details: { 
        targetUserId: userId, 
        days, 
        userCount: Object.keys(activitiesByUser).length,
        activityCount: userActivities.length 
      },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: userId 
        ? 'User activity retrieved successfully' 
        : 'All user activities retrieved successfully',
      data: {
        activities: userId ? userActivities : undefined, // Only return full list for specific user
        activitiesByUser: userId ? undefined : activitiesByUser, // Only return grouped for all users
        userStats,
        overallStats,
        topActions,
        filters: {
          userId,
          days,
          includeSystemActions
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