// ipc/bukid/stats.ipc.js
//@ts-check

const Bukid = require("../../../../entities/Bukid");
const { AppDataSource } = require("../../../db/dataSource");


module.exports = async function getBukidStats(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { _userId } = params;
    
    // Get basic counts
    const stats = await bukidRepository
      .createQueryBuilder('bukid')
      .select('COUNT(bukid.id)', 'total')
      .addSelect('COUNT(CASE WHEN bukid.status = "active" THEN 1 END)', 'active')
      .addSelect('COUNT(CASE WHEN bukid.status = "inactive" THEN 1 END)', 'inactive')
      .addSelect('COUNT(DISTINCT bukid.kabisilyaId)', 'kabisilyaCount')
      .getRawOne();

    // Get pitak distribution
    const pitakDistribution = await bukidRepository
      .createQueryBuilder('bukid')
      .leftJoin('bukid.pitaks', 'pitak')
      .select('bukid.id', 'bukidId')
      .addSelect('bukid.name', 'bukidName')
      .addSelect('COUNT(pitak.id)', 'pitakCount')
      .addSelect('SUM(pitak.totalLuwang)', 'totalLuwang')
      .groupBy('bukid.id')
      .orderBy('pitakCount', 'DESC')
      .getRawMany();

    // Get recent activity
    const recentBukid = await bukidRepository.find({
      order: { updatedAt: 'DESC' },
      take: 5,
      relations: ['kabisilya']
    });

    return {
      status: true,
      message: 'Statistics retrieved successfully',
      data: { 
        summary: {
          totalBukid: parseInt(stats.total) || 0,
          activeBukid: parseInt(stats.active) || 0,
          inactiveBukid: parseInt(stats.inactive) || 0,
          kabisilyaWithBukid: parseInt(stats.kabisilyaCount) || 0
        },
        pitakDistribution,
        recentBukid
      }
    };
  } catch (error) {
    console.error('Error in getBukidStats:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get statistics: ${error.message}`,
      data: null
    };
  }
};