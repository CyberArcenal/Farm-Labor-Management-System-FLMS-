// ipc/bukid/get_pitak_counts.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getPitakCounts(params = {}) {
  try {
    // @ts-ignore
    const { bukidId, _userId } = params;
    
    const bukidRepository = AppDataSource.getRepository(Bukid);

    let query = bukidRepository
      .createQueryBuilder('bukid')
      .leftJoin('bukid.pitaks', 'pitak')
      .select('bukid.id', 'id')
      .addSelect('bukid.name', 'name')
      .addSelect('COUNT(pitak.id)', 'pitakCount')
      .addSelect('SUM(pitak.totalLuwang)', 'totalLuwang')
      .addSelect('AVG(pitak.totalLuwang)', 'averageLuwang')
      .groupBy('bukid.id');

    if (bukidId) {
      query = query.where('bukid.id = :bukidId', { bukidId });
    }

    const pitakCounts = await query.getRawMany();

    return {
      status: true,
      message: 'Pitak counts retrieved successfully',
      data: { 
        pitakCounts: pitakCounts.map((/** @type {{ pitakCount: string; totalLuwang: string; averageLuwang: string; }} */ item) => ({
          ...item,
          pitakCount: parseInt(item.pitakCount) || 0,
          totalLuwang: parseFloat(item.totalLuwang) || 0,
          averageLuwang: parseFloat(item.averageLuwang) || 0
        }))
      }
    };
  } catch (error) {
    console.error('Error in getPitakCounts:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get pitak counts: ${error.message}`,
      data: null
    };
  }
};