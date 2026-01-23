// src/ipc/pitak/get/active.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (filters = {}, /** @type {any} */ userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    const query = pitakRepo.createQueryBuilder('pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .leftJoin('bukid.kabisilya', 'kabisilya')
      .addSelect(['kabisilya.id', 'kabisilya.name'])
      .where('pitak.status = :status', { status: 'active' });

    // Apply additional filters
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

    // Filter by availability
    // @ts-ignore
    if (filters.availableOnly) {
      // Subquery to find pitaks with remaining capacity
      const subQuery = pitakRepo.createQueryBuilder('p')
        .leftJoin(Assignment, 'a', 'a.pitakId = p.id AND a.status IN (:...statuses)', {
          statuses: ['active', 'completed']
        })
        .select('p.id', 'id')
        .addSelect('COALESCE(SUM(a.luwangCount), 0)', 'assignedLuWang')
        .groupBy('p.id')
        .having('p.totalLuwang > COALESCE(SUM(a.luwangCount), 0)');

      query.andWhere(`pitak.id IN (${subQuery.getQuery()})`);
      query.setParameters(subQuery.getParameters());
    }

    // Sorting
    // @ts-ignore
    const sortField = filters.sortBy || 'totalLuwang';
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

    // Get assignment statistics for each pitak
    const pitaksWithAvailability = await Promise.all(pitaks.map(async (/** @type {{ id: any; totalLuwang: string; location: any; bukid: { id: any; name: any; location: any; kabisilya: any; }; createdAt: any; updatedAt: any; }} */ pitak) => {
      const assignmentRepo = AppDataSource.getRepository(Assignment);
      
      const assignmentStats = await assignmentRepo
        .createQueryBuilder('assignment')
        .select([
          'COALESCE(SUM(assignment.luwangCount), 0) as totalAssignedLuWang',
          'COUNT(*) as totalAssignments'
        ])
        .where('assignment.pitakId = :pitakId', { pitakId: pitak.id })
        .andWhere('assignment.status IN (:...statuses)', { 
          statuses: ['active', 'completed'] 
        })
        .getRawOne();

      const totalAssignedLuWang = parseFloat(assignmentStats.totalAssignedLuWang) || 0;
      const totalLuWang = parseFloat(pitak.totalLuwang);
      const remainingLuWang = totalLuWang - totalAssignedLuWang;
      const utilizationRate = totalLuWang > 0 ? (totalAssignedLuWang / totalLuWang) * 100 : 0;

      return {
        id: pitak.id,
        location: pitak.location,
        totalLuwang: totalLuWang,
        bukid: pitak.bukid ? {
          id: pitak.bukid.id,
          name: pitak.bukid.name,
          location: pitak.bukid.location,
          kabisilya: pitak.bukid.kabisilya
        } : null,
        availability: {
          totalAssignedLuWang,
          remainingLuWang,
          utilizationRate,
          isAvailable: remainingLuWang > 0,
          assignmentCount: parseInt(assignmentStats.totalAssignments) || 0
        },
        createdAt: pitak.createdAt,
        updatedAt: pitak.updatedAt
      };
    }));

    // Calculate summary statistics
    const summary = pitaksWithAvailability.reduce((/** @type {{ totalPitaks: number; totalLuWangCapacity: any; totalAssignedLuWang: any; totalRemainingLuWang: any; availablePitaks: string | number; totalAssignments: any; }} */ stats, /** @type {{ totalLuwang: any; availability: { totalAssignedLuWang: any; remainingLuWang: any; isAvailable: any; assignmentCount: any; }; }} */ pitak) => {
      stats.totalPitaks++;
      stats.totalLuWangCapacity += pitak.totalLuwang;
      stats.totalAssignedLuWang += pitak.availability.totalAssignedLuWang;
      stats.totalRemainingLuWang += pitak.availability.remainingLuWang;
      // @ts-ignore
      stats.availablePitaks += pitak.availability.isAvailable ? 1 : 0;
      stats.totalAssignments += pitak.availability.assignmentCount;
      return stats;
    }, {
      totalPitaks: 0,
      totalLuWangCapacity: 0,
      totalAssignedLuWang: 0,
      totalRemainingLuWang: 0,
      availablePitaks: 0,
      totalAssignments: 0
    });

    summary.overallUtilizationRate = summary.totalLuWangCapacity > 0 
      ? (summary.totalAssignedLuWang / summary.totalLuWangCapacity) * 100 
      : 0;

    return {
      status: true,
      message: "Active pitaks retrieved successfully",
      data: pitaksWithAvailability,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary,
        filters
      }
    };

  } catch (error) {
    console.error("Error retrieving active pitaks:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve active pitaks: ${error.message}`,
      data: null
    };
  }
};