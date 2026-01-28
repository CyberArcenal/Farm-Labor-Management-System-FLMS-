// ipc/bukid/export_csv.ipc.js
//@ts-check

const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const { AppDataSource } = require('../../db/dataSource');
const Bukid = require('../../../entities/Bukid');

module.exports = async function exportBukidToCSV(params = {}) {
  try {
    // @ts-ignore
    const { filters = {}, _userId } = params;
    
    const bukidRepository = AppDataSource.getRepository(Bukid);

    const queryBuilder = bukidRepository.createQueryBuilder('bukid')
      .leftJoinAndSelect('bukid.kabisilya', 'kabisilya')
      .leftJoinAndSelect('bukid.pitaks', 'pitaks');

    if (filters.kabisilyaId) {
      queryBuilder.andWhere('bukid.kabisilyaId = :kabisilyaId', { kabisilyaId: filters.kabisilyaId });
    }
    if (filters.status) {
      queryBuilder.andWhere('bukid.status = :status', { status: filters.status });
    }

    const bukids = await queryBuilder.getMany();

    // Prepare data for CSV
    // @ts-ignore
    const csvData = bukids.map((/** @type {{ id: any; name: any; location: any; status: any; kabisilya: { id: any; name: any; }; pitaks: string | any[]; createdAt: any; updatedAt: any; }} */ bukid) => ({
      id: bukid.id,
      name: bukid.name,
      location: bukid.location || '',
      status: bukid.status,
      kabisilya_id: bukid.kabisilya?.id || '',
      kabisilya_name: bukid.kabisilya?.name || '',
      pitak_count: bukid.pitaks?.length || 0,
      created_at: bukid.createdAt,
      updated_at: bukid.updatedAt
    }));

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '../../../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bukid-export-${timestamp}.csv`;
    const filePath = path.join(exportDir, filename);

    // Write CSV file
    fs.writeFileSync(filePath, csv);

    return {
      status: true,
      message: 'Bukid exported to CSV successfully',
      data: {
        filePath,
        filename,
        recordCount: csvData.length,
        downloadUrl: `file://${filePath}`
      }
    };
  } catch (error) {
    console.error('Error in exportBukidToCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export bukid to CSV: ${error.message}`,
      data: null
    };
  }
};