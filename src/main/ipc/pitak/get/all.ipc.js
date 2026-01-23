// src/ipc/pitak/get/all.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
// @ts-ignore
const Bukid = require("../../../../entities/Bukid");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    const query = pitakRepo.createQueryBuilder('pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .leftJoin('bukid.kabisilya', 'kabisilya')
      .addSelect(['kabisilya.id', 'kabisilya.name']);

    // Apply filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      query.andWhere('pitak.status = :status', { status: filters.status });
    }
    
    // @ts-ignore
    if (filters.bukidId) {
      // @ts-ignore
      query.andWhere('pitak.bukidId = :bukidId', { bukidId: filters.bukidId });
    }
    
    // @ts-ignore
    if (filters.location) {
      // @ts-ignore
      query.andWhere('pitak.location LIKE :location', { location: `%${filters.location}%` });
    }
    
    // @ts-ignore
    if (filters.minLuWang) {
      // @ts-ignore
      query.andWhere('pitak.totalLuwang >= :minLuWang', { minLuWang: filters.minLuWang });
    }
    
    // @ts-ignore
    if (filters.maxLuWang) {
      // @ts-ignore
      query.andWhere('pitak.totalLuwang <= :maxLuWang', { maxLuWang: filters.maxLuWang });
    }

    // Sorting
    // @ts-ignore
    const sortField = filters.sortBy || 'createdAt';
    // @ts-ignore
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    query.orderBy(`pitak.${sortField}`, sortOrder);

    // Pagination
    // @ts-ignore
    const page = parseInt(filters.page) || 1;
    // @ts-ignore
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;
    
    query.skip(skip).take(limit);

    const [pitaks, total] = await query.getManyAndCount();

    // Get summary stats
    const statsQuery = pitakRepo.createQueryBuilder('pitak')
      .select([
        'COUNT(*) as total',
        'SUM(pitak.totalLuwang) as totalLuWang',
        'AVG(pitak.totalLuwang) as averageLuWang',
        'SUM(CASE WHEN pitak.status = "active" THEN 1 ELSE 0 END) as activeCount',
        'SUM(CASE WHEN pitak.status = "inactive" THEN 1 ELSE 0 END) as inactiveCount',
        'SUM(CASE WHEN pitak.status = "harvested" THEN 1 ELSE 0 END) as harvestedCount'
      ]);
    
    // @ts-ignore
    if (filters.bukidId) {
      // @ts-ignore
      statsQuery.where('pitak.bukidId = :bukidId', { bukidId: filters.bukidId });
    }
    
    const stats = await statsQuery.getRawOne();

    return {
      status: true,
      message: "Pitaks retrieved successfully",
      // @ts-ignore
      data: pitaks.map(p => ({
        id: p.id,
        location: p.location,
        totalLuwang: parseFloat(p.totalLuwang),
        status: p.status,
        bukid: p.bukid ? {
          id: p.bukid.id,
          name: p.bukid.name,
          location: p.bukid.location,
          kabisilya: p.bukid.kabisilya
        } : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
          total: parseInt(stats.total) || 0,
          totalLuWang: parseFloat(stats.totalLuWang) || 0,
          averageLuWang: parseFloat(stats.averageLuWang) || 0,
          activeCount: parseInt(stats.activeCount) || 0,
          inactiveCount: parseInt(stats.inactiveCount) || 0,
          harvestedCount: parseInt(stats.harvestedCount) || 0
        }
      }
    };

  } catch (error) {
    console.error("Error retrieving pitaks:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pitaks: ${error.message}`,
      data: null
    };
  }
};