// ipc/auditTrail/get/actions_list.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getActionsList(params = {}) {
  try {
    const { 
      // @ts-ignore
      limit = 100, 
      // @ts-ignore
      includeCounts = true,
      // @ts-ignore
      _userId 
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    let actionsList;
    
    if (includeCounts) {
      // Get actions with counts
      actionsList = await auditRepo.createQueryBuilder("audit")
        .select("audit.action", "action")
        .addSelect("COUNT(*)", "count")
        .addSelect("MAX(audit.timestamp)", "lastOccurrence")
        .addSelect("MIN(audit.timestamp)", "firstOccurrence")
        .groupBy("audit.action")
        .orderBy("count", "DESC")
        .limit(parseInt(limit))
        .getRawMany();
      
      // Format dates
      actionsList = actionsList.map((/** @type {{ action: any; count: string; lastOccurrence: any; firstOccurrence: string | number | Date; }} */ item) => ({
        action: item.action,
        count: parseInt(item.count),
        lastOccurrence: item.lastOccurrence,
        firstOccurrence: item.firstOccurrence,
        // @ts-ignore
        frequency: `Approx. ${Math.round(parseInt(item.count) / ((new Date() - new Date(item.firstOccurrence)) / (1000 * 60 * 60 * 24 * 30)))} times per month`
      }));
    } else {
      // Just get distinct actions
      actionsList = await auditRepo.createQueryBuilder("audit")
        .select("DISTINCT audit.action", "action")
        .orderBy("audit.action", "ASC")
        .limit(parseInt(limit))
        .getRawMany();
    }
    
    // Group by action category (if we can identify patterns)
    const categorizedActions = {
      user_actions: [],
      system_actions: [],
      data_actions: [],
      security_actions: [],
      other: []
    };
    
    actionsList.forEach((/** @type {{ action: any; }} */ item) => {
      const action = item.action || item;
      const actionStr = typeof action === 'string' ? action : action.action;
      
      if (actionStr.includes('login') || actionStr.includes('logout') || actionStr.includes('user')) {
        // @ts-ignore
        categorizedActions.user_actions.push(action);
      } else if (actionStr.includes('system') || actionStr.includes('server') || actionStr.includes('startup')) {
        // @ts-ignore
        categorizedActions.system_actions.push(action);
      } else if (actionStr.includes('create') || actionStr.includes('update') || actionStr.includes('delete')) {
        // @ts-ignore
        categorizedActions.data_actions.push(action);
      } else if (actionStr.includes('security') || actionStr.includes('permission') || actionStr.includes('access')) {
        // @ts-ignore
        categorizedActions.security_actions.push(action);
      } else {
        // @ts-ignore
        categorizedActions.other.push(action);
      }
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_actions_list',
      actor: `User ${_userId}`,
      details: { includeCounts, limit },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Actions list retrieved successfully',
      data: {
        actions: actionsList,
        categorized: categorizedActions,
        totals: {
          totalUniqueActions: actionsList.length,
          userActions: categorizedActions.user_actions.length,
          systemActions: categorizedActions.system_actions.length,
          dataActions: categorizedActions.data_actions.length,
          securityActions: categorizedActions.security_actions.length,
          otherActions: categorizedActions.other.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getActionsList:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve actions list: ${error.message}`,
      data: null
    };
  }
};