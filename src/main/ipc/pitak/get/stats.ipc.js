// src/ipc/pitak/get/stats.ipc (Simplified Version)
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (dateRange = {}, /** @type {any} */ userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    // Get basic statistics
    const stats = await pitakRepo
      .createQueryBuilder('pitak')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN pitak.status = "active" THEN 1 ELSE 0 END) as active',
        'SUM(CASE WHEN pitak.status = "inactive" THEN 1 ELSE 0 END) as inactive',
        'SUM(CASE WHEN pitak.status = "harvested" THEN 1 ELSE 0 END) as harvested',
        'SUM(pitak.totalLuwang) as totalLuWangCapacity',
        'AVG(pitak.totalLuwang) as averageLuWang',
        'MIN(pitak.totalLuwang) as minLuWang',
        'MAX(pitak.totalLuwang) as maxLuWang'
      ])
      .getRawOne();

    // Get bukid distribution
    const bukidStats = await pitakRepo
      .createQueryBuilder('pitak')
      .leftJoin('pitak.bukid', 'bukid')
      .select('bukid.name', 'bukidName')
      .addSelect('COUNT(pitak.id)', 'pitakCount')
      .groupBy('bukid.name')
      .getRawMany();

    return {
      status: true,
      message: "Pitak statistics retrieved successfully",
      data: {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0,
        harvested: parseInt(stats.harvested) || 0,
        totalLuWangCapacity: parseFloat(stats.totalLuWangCapacity) || 0,
        averageLuWang: parseFloat(stats.averageLuWang) || 0,
        minLuWang: parseFloat(stats.minLuWang) || 0,
        maxLuWang: parseFloat(stats.maxLuWang) || 0,
        bukidDistribution: bukidStats.map(b => ({
          bukidName: b.bukidName,
          pitakCount: parseInt(b.pitakCount) || 0
        }))
      }
    };

  } catch (error) {
    console.error("Error retrieving pitak stats:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pitak stats: ${error.message}`,
      data: null
    };
  }
};