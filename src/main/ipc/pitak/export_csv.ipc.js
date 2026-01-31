// src/ipc/pitak/export_csv.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const { stringify } = require('csv-stringify/sync');
const { AppDataSource } = require("../../db/dataSource");
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ filters?: {} | undefined; _userId: any; }} */ params) => {
  try {
    const { filters = {}, _userId } = params;

    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    const query = pitakRepo.createQueryBuilder('pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')

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
    if (filters.minLuWang) {
      // @ts-ignore
      query.andWhere('pitak.totalLuwang >= :minLuWang', { minLuWang: filters.minLuWang });
    }
    
    // @ts-ignore
    if (filters.maxLuWang) {
      // @ts-ignore
      query.andWhere('pitak.totalLuwang <= :maxLuWang', { maxLuWang: filters.maxLuWang });
    }

    // Get all pitaks (no pagination for export)
    const pitaks = await query.getMany();

    // Prepare CSV data
    const csvData = pitaks.map((pitak) => ({
      'ID': pitak.id,
      'Location': pitak.location || '',
      // @ts-ignore
      'Total LuWang': parseFloat(pitak.totalLuwang).toFixed(2),
      'Status': pitak.status,
      // @ts-ignore
      'Bukid ID': pitak.bukidId,
      // @ts-ignore
      'Bukid Name': pitak.bukid ? pitak.bukid.name : '',
      // @ts-ignore
      'Bukid Location': pitak.bukid ? (pitak.bukid.location || '') : '',
      // @ts-ignore
      'Created Date': pitak.createdAt.toISOString().split('T')[0],
      // @ts-ignore
      'Created Time': pitak.createdAt.toISOString().split('T')[1].split('.')[0],
      // @ts-ignore
      'Updated Date': pitak.updatedAt.toISOString().split('T')[0],
      // @ts-ignore
      'Updated Time': pitak.updatedAt.toISOString().split('T')[1].split('.')[0]
    }));

    // Generate CSV
    const csv = stringify(csvData, {
      header: true,
      quoted: true,
      delimiter: ','
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pitaks_export_${timestamp}.csv`;

    // Log activity
    await AppDataSource.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'export_pitaks_csv',
      entity: 'Pitak',
      details: JSON.stringify({
        filters,
        count: pitaks.length,
        filename
      })
    });

    return {
      status: true,
      message: "CSV export completed",
      data: {
        csv,
        filename,
        count: pitaks.length,
        // @ts-ignore
        totalLuWang: pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: string; }} */ p) => sum + parseFloat(p.totalLuwang), 0).toFixed(2)
      }
    };

  } catch (error) {
    console.error("Error exporting pitaks to CSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export CSV: ${error.message}`,
      data: null
    };
  }
};