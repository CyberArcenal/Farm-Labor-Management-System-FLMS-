// src/ipc/pitak/get/harvested.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (filters = {}, /** @type {any} */ userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    const query = pitakRepo.createQueryBuilder('pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .leftJoin('bukid.kabisilya', 'kabisilya')
      .addSelect(['kabisilya.id', 'kabisilya.name'])
      .where('pitak.status = :status', { status: 'harvested' });

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
    if (filters.harvestedAfter) {
      query.andWhere('pitak.updatedAt >= :harvestedAfter', { 
        // @ts-ignore
        harvestedAfter: new Date(filters.harvestedAfter) 
      });
    }
    
    // @ts-ignore
    if (filters.harvestedBefore) {
      query.andWhere('pitak.updatedAt <= :harvestedBefore', { 
        // @ts-ignore
        harvestedBefore: new Date(filters.harvestedBefore) 
      });
    }

    // Sorting
    // @ts-ignore
    const sortField = filters.sortBy || 'updatedAt';
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

    // Get comprehensive harvest data for each pitak
    const harvestedPitaks = await Promise.all(pitaks.map(async (/** @type {{ id: any; totalLuwang: string; location: any; bukid: { id: any; name: any; location: any; kabisilya: any; }; updatedAt: any; createdAt: any; }} */ pitak) => {
      const assignmentRepo = AppDataSource.getRepository(Assignment);
      const paymentRepo = AppDataSource.getRepository(Payment);

      // Get assignment statistics
      const assignmentStats = await assignmentRepo
        .createQueryBuilder('assignment')
        .select([
          'COUNT(*) as totalAssignments',
          'SUM(assignment.luwangCount) as totalLuWangAssigned',
          'MIN(assignment.assignmentDate) as firstAssignment',
          'MAX(assignment.assignmentDate) as lastAssignment'
        ])
        .where('assignment.pitakId = :pitakId', { pitakId: pitak.id })
        .getRawOne();

      // Get payment statistics
      const paymentStats = await paymentRepo
        .createQueryBuilder('payment')
        .select([
          'COUNT(*) as totalPayments',
          'SUM(payment.grossPay) as totalGrossPay',
          'SUM(payment.netPay) as totalNetPay',
          'SUM(payment.totalDebtDeduction) as totalDebtDeduction'
        ])
        .where('payment.pitakId = :pitakId', { pitakId: pitak.id })
        .getRawOne();

      // Calculate harvest metrics
      const totalLuWangAssigned = parseFloat(assignmentStats.totalLuWangAssigned) || 0;
      const totalLuWangCapacity = parseFloat(pitak.totalLuwang);
      const utilizationRate = totalLuWangCapacity > 0 
        ? (totalLuWangAssigned / totalLuWangCapacity) * 100 
        : 0;

      // Calculate harvest efficiency
      const totalNetPay = parseFloat(paymentStats.totalNetPay) || 0;
      const revenuePerLuWang = totalLuWangAssigned > 0 
        ? totalNetPay / totalLuWangAssigned 
        : 0;

      // Calculate harvest duration
      const firstAssignment = assignmentStats.firstAssignment;
      const lastAssignment = assignmentStats.lastAssignment;
      let harvestDuration = null;
      
      if (firstAssignment && lastAssignment) {
        const start = new Date(firstAssignment);
        const end = new Date(lastAssignment);
        // @ts-ignore
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        harvestDuration = {
          days: diffDays,
          start: start,
          end: end
        };
      }

      return {
        id: pitak.id,
        location: pitak.location,
        totalLuWangCapacity,
        bukid: pitak.bukid ? {
          id: pitak.bukid.id,
          name: pitak.bukid.name,
          location: pitak.bukid.location,
          kabisilya: pitak.bukid.kabisilya
        } : null,
        harvestData: {
          harvestedAt: pitak.updatedAt,
          totalAssignments: parseInt(assignmentStats.totalAssignments) || 0,
          totalLuWangAssigned,
          utilizationRate,
          totalPayments: parseInt(paymentStats.totalPayments) || 0,
          totalGrossPay: parseFloat(paymentStats.totalGrossPay) || 0,
          totalNetPay,
          totalDebtDeduction: parseFloat(paymentStats.totalDebtDeduction) || 0,
          revenuePerLuWang,
          harvestDuration,
          firstAssignment: assignmentStats.firstAssignment,
          lastAssignment: assignmentStats.lastAssignment
        },
        createdAt: pitak.createdAt,
        updatedAt: pitak.updatedAt
      };
    }));

    // Calculate harvest summary statistics
    const summary = harvestedPitaks.reduce((/** @type {{ totalPitaks: number; totalLuWangCapacity: any; totalLuWangHarvested: any; totalGrossRevenue: any; totalNetRevenue: any; totalAssignments: any; totalPayments: any; averageUtilization: any; averageRevenuePerLuWang: any; bestRevenuePerLuWang: number; bestPerformingPitakId: any; highestUtilization: number; mostUtilizedPitakId: any; }} */ stats, /** @type {{ totalLuWangCapacity: any; harvestData: { totalLuWangAssigned: any; totalGrossPay: any; totalNetPay: any; totalAssignments: any; totalPayments: any; utilizationRate: number; revenuePerLuWang: number; }; id: any; }} */ pitak) => {
      stats.totalPitaks++;
      stats.totalLuWangCapacity += pitak.totalLuWangCapacity;
      stats.totalLuWangHarvested += pitak.harvestData.totalLuWangAssigned;
      stats.totalGrossRevenue += pitak.harvestData.totalGrossPay;
      stats.totalNetRevenue += pitak.harvestData.totalNetPay;
      stats.totalAssignments += pitak.harvestData.totalAssignments;
      stats.totalPayments += pitak.harvestData.totalPayments;
      
      // Calculate average metrics
      stats.averageUtilization += pitak.harvestData.utilizationRate;
      stats.averageRevenuePerLuWang += pitak.harvestData.revenuePerLuWang;
      
      // Track best performing pitak
      if (pitak.harvestData.revenuePerLuWang > stats.bestRevenuePerLuWang) {
        stats.bestRevenuePerLuWang = pitak.harvestData.revenuePerLuWang;
        stats.bestPerformingPitakId = pitak.id;
      }
      
      // Track highest utilization
      if (pitak.harvestData.utilizationRate > stats.highestUtilization) {
        stats.highestUtilization = pitak.harvestData.utilizationRate;
        stats.mostUtilizedPitakId = pitak.id;
      }
      
      return stats;
    }, {
      totalPitaks: 0,
      totalLuWangCapacity: 0,
      totalLuWangHarvested: 0,
      totalGrossRevenue: 0,
      totalNetRevenue: 0,
      totalAssignments: 0,
      totalPayments: 0,
      averageUtilization: 0,
      averageRevenuePerLuWang: 0,
      bestRevenuePerLuWang: 0,
      bestPerformingPitakId: null,
      highestUtilization: 0,
      mostUtilizedPitakId: null
    });

    // Calculate averages
    if (summary.totalPitaks > 0) {
      summary.averageUtilization = summary.averageUtilization / summary.totalPitaks;
      summary.averageRevenuePerLuWang = summary.averageRevenuePerLuWang / summary.totalPitaks;
    }

    // Calculate overall harvest efficiency
    summary.overallHarvestEfficiency = summary.totalLuWangHarvested > 0 
      ? (summary.totalNetRevenue / summary.totalLuWangHarvested) 
      : 0;

    return {
      status: true,
      message: "Harvested pitaks retrieved successfully",
      data: harvestedPitaks,
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
    console.error("Error retrieving harvested pitaks:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve harvested pitaks: ${error.message}`,
      data: null
    };
  }
};