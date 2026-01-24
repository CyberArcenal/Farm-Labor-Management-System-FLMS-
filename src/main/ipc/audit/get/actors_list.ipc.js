// ipc/auditTrail/get/actors_list.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getActorsList(params = {}) {
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
    
    let actorsList;
    
    if (includeCounts) {
      // Get actors with counts
      actorsList = await auditRepo.createQueryBuilder("audit")
        .select("audit.actor", "actor")
        .addSelect("COUNT(*)", "count")
        .addSelect("MAX(audit.timestamp)", "lastActivity")
        .addSelect("MIN(audit.timestamp)", "firstActivity")
        .addSelect("COUNT(DISTINCT audit.action)", "uniqueActions")
        .groupBy("audit.actor")
        .orderBy("count", "DESC")
        .limit(parseInt(limit))
        .getRawMany();
      
      // Format data
      actorsList = actorsList.map((/** @type {{ actor: any; count: string; lastActivity: any; firstActivity: any; uniqueActions: string; }} */ item) => ({
        actor: item.actor,
        count: parseInt(item.count),
        lastActivity: item.lastActivity,
        firstActivity: item.firstActivity,
        uniqueActions: parseInt(item.uniqueActions),
        activityLevel: getActivityLevel(parseInt(item.count))
      }));
    } else {
      // Just get distinct actors
      actorsList = await auditRepo.createQueryBuilder("audit")
        .select("DISTINCT audit.actor", "actor")
        .orderBy("audit.actor", "ASC")
        .limit(parseInt(limit))
        .getRawMany();
    }
    
    // Categorize actors
    const categorizedActors = {
      users: [],
      system: [],
      automated: [],
      unknown: []
    };
    
    actorsList.forEach((/** @type {{ actor: any; }} */ item) => {
      const actor = item.actor || item;
      const actorStr = typeof actor === 'string' ? actor : actor.actor;
      
      if (actorStr.startsWith('User ')) {
        // @ts-ignore
        categorizedActors.users.push(actor);
      } else if (actorStr.includes('System') || actorStr.includes('Server')) {
        // @ts-ignore
        categorizedActors.system.push(actor);
      } else if (actorStr.includes('Cron') || actorStr.includes('Job') || actorStr.includes('Automated')) {
        // @ts-ignore
        categorizedActors.automated.push(actor);
      } else {
        // @ts-ignore
        categorizedActors.unknown.push(actor);
      }
    });
    
    // Get top actions for each actor (for detailed view)
    const actorDetails = [];
    if (includeCounts && actorsList.length > 0) {
      for (const actor of actorsList.slice(0, 10)) { // Limit to top 10 for performance
        const actorStr = typeof actor === 'string' ? actor : actor.actor;
        const topActions = await auditRepo.createQueryBuilder("audit")
          .select("audit.action", "action")
          .addSelect("COUNT(*)", "count")
          .where("audit.actor = :actor", { actor: actorStr })
          .groupBy("audit.action")
          .orderBy("count", "DESC")
          .limit(5)
          .getRawMany();
        
        actorDetails.push({
          actor: actorStr,
          topActions: topActions.map((/** @type {{ action: any; count: string; }} */ a) => ({ action: a.action, count: parseInt(a.count) }))
        });
      }
    }
    
    // Helper function to determine activity level
    /**
       * @param {number} count
       */
    function getActivityLevel(count) {
      if (count > 1000) return 'very-high';
      if (count > 100) return 'high';
      if (count > 10) return 'medium';
      return 'low';
    }
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_actors_list',
      actor: `User ${_userId}`,
      details: { includeCounts, limit },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Actors list retrieved successfully',
      data: {
        actors: actorsList,
        categorized: categorizedActors,
        actorDetails,
        totals: {
          totalUniqueActors: actorsList.length,
          users: categorizedActors.users.length,
          system: categorizedActors.system.length,
          automated: categorizedActors.automated.length,
          unknown: categorizedActors.unknown.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getActorsList:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve actors list: ${error.message}`,
      data: null
    };
  }
};