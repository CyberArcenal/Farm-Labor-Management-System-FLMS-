// ipc/auditTrail/get/system_activity.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getSystemActivity(params = {}) {
  try {
    const { 
      // @ts-ignore
      hours = 24, // Last X hours
      // @ts-ignore
      includeUserActions = false,
      // @ts-ignore
      _userId 
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    // Get system-related activities
    const systemActivities = await auditRepo.find({
      where: {
        timestamp: {
          $gte: startTime
        },
        actor: {
          $notLike: 'User %'
        }
      },
      order: { timestamp: 'DESC' },
      take: 1000 // Limit for performance
    });
    
    // If including user actions, get those too
    let userActivities = [];
    if (includeUserActions) {
      userActivities = await auditRepo.find({
        where: {
          timestamp: {
            $gte: startTime
          },
          actor: {
            $like: 'User %'
          }
        },
        order: { timestamp: 'DESC' },
        take: 500
      });
    }
    
    // Categorize system activities
    const categorized = {
      startup_shutdown: [],
      errors: [],
      warnings: [],
      maintenance: [],
      backups: [],
      security: [],
      performance: [],
      other: []
    };
    
    systemActivities.forEach((/** @type {{ action: string; details: {}; }} */ activity) => {
      const action = activity.action.toLowerCase();
      // @ts-ignore
      const details = activity.details || {};
      
      if (action.includes('start') || action.includes('stop') || action.includes('shutdown') || action.includes('restart')) {
        // @ts-ignore
        categorized.startup_shutdown.push(activity);
      } else if (action.includes('error') || action.includes('fail') || action.includes('exception')) {
        // @ts-ignore
        categorized.errors.push(activity);
      } else if (action.includes('warn') || action.includes('alert')) {
        // @ts-ignore
        categorized.warnings.push(activity);
      } else if (action.includes('backup') || action.includes('export') || action.includes('import')) {
        // @ts-ignore
        categorized.backups.push(activity);
      } else if (action.includes('security') || action.includes('login') || action.includes('access') || action.includes('permission')) {
        // @ts-ignore
        categorized.security.push(activity);
      } else if (action.includes('maintenance') || action.includes('cleanup') || action.includes('optimize')) {
        // @ts-ignore
        categorized.maintenance.push(activity);
      } else if (action.includes('performance') || action.includes('slow') || action.includes('timeout') || action.includes('memory')) {
        // @ts-ignore
        categorized.performance.push(activity);
      } else {
        // @ts-ignore
        categorized.other.push(activity);
      }
    });
    
    // Calculate statistics
    const stats = {
      totalSystemActivities: systemActivities.length,
      totalUserActivities: userActivities.length,
      byCategory: {
        startup_shutdown: categorized.startup_shutdown.length,
        errors: categorized.errors.length,
        warnings: categorized.warnings.length,
        maintenance: categorized.maintenance.length,
        backups: categorized.backups.length,
        security: categorized.security.length,
        performance: categorized.performance.length,
        other: categorized.other.length
      },
      timeRange: {
        start: startTime,
        end: new Date(),
        hours
      }
    };
    
    // Get error details (if any)
    const errorDetails = categorized.errors.map(error => ({
      // @ts-ignore
      id: error.id,
      // @ts-ignore
      action: error.action,
      // @ts-ignore
      actor: error.actor,
      // @ts-ignore
      timestamp: error.timestamp,
      // @ts-ignore
      details: error.details
    })).slice(0, 10); // Limit to 10 most recent errors
    
    // Get system health indicators
    const healthIndicators = {
      hasRecentErrors: categorized.errors.length > 0,
      errorRate: (categorized.errors.length / systemActivities.length) * 100,
      warningRate: (categorized.warnings.length / systemActivities.length) * 100,
      securityEvents: categorized.security.length,
      lastBackup: categorized.backups.length > 0 ? 
        // @ts-ignore
        categorized.backups[0].timestamp : null,
      systemUptime: calculateUptime(categorized.startup_shutdown)
    };
    
    // Helper function to calculate approximate system uptime
    /**
       * @param {any[]} startupShutdownEvents
       */
    function calculateUptime(startupShutdownEvents) {
      if (startupShutdownEvents.length === 0) return 'Unknown';
      
      const sortedEvents = startupShutdownEvents
        .sort((/** @type {{ timestamp: number; }} */ a, /** @type {{ timestamp: number; }} */ b) => b.timestamp - a.timestamp);
      
      const lastStartup = sortedEvents.find((/** @type {{ action: string; }} */ e) => 
        e.action.toLowerCase().includes('start') || 
        e.action.toLowerCase().includes('up')
      );
      
      if (!lastStartup) return 'Unknown';
      
      // @ts-ignore
      const uptimeMs = new Date() - new Date(lastStartup.timestamp);
      const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${days}d ${hours}h ${minutes}m`;
    }
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_system_activity',
      actor: `User ${_userId}`,
      details: { hours, includeUserActions },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'System activity retrieved successfully',
      data: {
        systemActivities,
        userActivities: includeUserActions ? userActivities : undefined,
        categorized,
        stats,
        errorDetails,
        healthIndicators,
        summary: {
          totalActivities: systemActivities.length + userActivities.length,
          systemHealth: healthIndicators.hasRecentErrors ? 'needs-attention' : 'healthy',
          recentErrors: categorized.errors.length,
          securityEvents: categorized.security.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getSystemActivity:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve system activity: ${error.message}`,
      data: null
    };
  }
};