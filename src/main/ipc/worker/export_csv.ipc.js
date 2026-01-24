// ipc/worker/export_csv.ipc.js
//@ts-check

const { stringify } = require('csv-stringify');
const fs = require('fs');
const path = require('path');
const Worker = require("../../../entities/Worker");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function exportWorkersToCSV(params = {}) {
  try {
    const { 
      // @ts-ignore
      workerIds = [], 
      // @ts-ignore
      status = null, 
      // @ts-ignore
      kabisilyaId = null,
      // @ts-ignore
      startDate = null, 
      // @ts-ignore
      endDate = null,
      // @ts-ignore
      includeFields = 'all',
      // @ts-ignore
      _userId 
    } = params;

    const workerRepository = AppDataSource.getRepository(Worker);

    // Build query
    const qb = workerRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.kabisilya', 'kabisilya');

    // Apply filters
    if (workerIds && workerIds.length > 0) {
      qb.where('worker.id IN (:...workerIds)', { workerIds: workerIds.map((/** @type {string} */ id) => parseInt(id)) });
    }

    if (status) {
      if (workerIds.length > 0) {
        qb.andWhere('worker.status = :status', { status });
      } else {
        qb.where('worker.status = :status', { status });
      }
    }

    if (kabisilyaId) {
      if (workerIds.length > 0 || status) {
        qb.andWhere('worker.kabisilyaId = :kabisilyaId', { kabisilyaId: parseInt(kabisilyaId) });
      } else {
        qb.where('worker.kabisilyaId = :kabisilyaId', { kabisilyaId: parseInt(kabisilyaId) });
      }
    }

    if (startDate && endDate) {
      qb.andWhere('worker.hireDate BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate)
      });
    }

    const workers = await qb.orderBy('worker.name', 'ASC').getMany();

    if (workers.length === 0) {
      return {
        status: false,
        message: 'No workers found matching the criteria',
        data: null
      };
    }

    // Define field mappings
    const allFields = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'contact', header: 'Contact' },
      { key: 'email', header: 'Email' },
      { key: 'address', header: 'Address' },
      { key: 'status', header: 'Status' },
      { key: 'hireDate', header: 'Hire Date' },
      { key: 'kabisilyaName', header: 'Kabisilya' },
      { key: 'totalDebt', header: 'Total Debt' },
      { key: 'totalPaid', header: 'Total Paid' },
      { key: 'currentBalance', header: 'Current Balance' },
      { key: 'createdAt', header: 'Created At' },
      { key: 'updatedAt', header: 'Updated At' }
    ];

    // Filter fields based on includeFields parameter
    let selectedFields = allFields;
    if (includeFields !== 'all') {
      if (Array.isArray(includeFields)) {
        selectedFields = allFields.filter(field => includeFields.includes(field.key));
      } else if (typeof includeFields === 'string') {
        const fieldGroups = {
          'basic': ['id', 'name', 'contact', 'email', 'status'],
          'contact': ['id', 'name', 'contact', 'email', 'address'],
          'financial': ['id', 'name', 'totalDebt', 'totalPaid', 'currentBalance'],
          'employment': ['id', 'name', 'hireDate', 'kabisilyaName', 'status']
        };
        
        // @ts-ignore
        if (fieldGroups[includeFields]) {
          // @ts-ignore
          selectedFields = allFields.filter(field => fieldGroups[includeFields].includes(field.key));
        }
      }
    }

    // Prepare data for CSV
    const csvData = workers.map((/** @type {{ id: any; name: any; contact: string; email: string; address: string; status: any; hireDate: { toISOString: () => string; }; kabisilya: { name: string; }; totalDebt: any; totalPaid: any; currentBalance: any; createdAt: { toISOString: () => string; }; updatedAt: { toISOString: () => string; }; }} */ worker) => {
      const row = {};
      
      selectedFields.forEach(field => {
        switch (field.key) {
          case 'id':
            // @ts-ignore
            row[field.header] = worker.id;
            break;
          case 'name':
            // @ts-ignore
            row[field.header] = worker.name;
            break;
          case 'contact':
            // @ts-ignore
            row[field.header] = worker.contact || '';
            break;
          case 'email':
            // @ts-ignore
            row[field.header] = worker.email || '';
            break;
          case 'address':
            // @ts-ignore
            row[field.header] = worker.address || '';
            break;
          case 'status':
            // @ts-ignore
            row[field.header] = worker.status;
            break;
          case 'hireDate':
            // @ts-ignore
            row[field.header] = worker.hireDate ? worker.hireDate.toISOString().split('T')[0] : '';
            break;
          case 'kabisilyaName':
            // @ts-ignore
            row[field.header] = worker.kabisilya?.name || '';
            break;
          case 'totalDebt':
            // @ts-ignore
            row[field.header] = worker.totalDebt;
            break;
          case 'totalPaid':
            // @ts-ignore
            row[field.header] = worker.totalPaid;
            break;
          case 'currentBalance':
            // @ts-ignore
            row[field.header] = worker.currentBalance;
            break;
          case 'createdAt':
            // @ts-ignore
            row[field.header] = worker.createdAt ? worker.createdAt.toISOString().split('T')[0] : '';
            break;
          case 'updatedAt':
            // @ts-ignore
            row[field.header] = worker.updatedAt ? worker.updatedAt.toISOString().split('T')[0] : '';
            break;
        }
      });
      
      return row;
    });

    // Generate CSV string
    const csvString = await new Promise((resolve, reject) => {
      stringify(csvData, {
        header: true,
        columns: selectedFields.map(field => ({ key: field.header, header: field.header })),
        delimiter: ','
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    // Create temporary file
    const timestamp = new Date().getTime();
    const fileName = `workers_export_${timestamp}.csv`;
    const tempDir = path.join(__dirname, '../../../../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, csvString);

    // Log activity
    const activityRepo = AppDataSource.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'export_workers_csv',
      description: `Exported ${workers.length} workers to CSV`,
      details: JSON.stringify({
        fileName,
        workerCount: workers.length,
        filters: {
          workerIds: workerIds.length > 0 ? workerIds.length : 'all',
          status,
          kabisilyaId,
          dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'all'
        }
      }),
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    // Read file as base64 for sending to frontend
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    // Clean up temporary file after a short delay
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn('Failed to delete temporary export file:', error);
      }
    }, 30000); // Delete after 30 seconds

    return {
      status: true,
      message: `Successfully exported ${workers.length} workers to CSV`,
      data: {
        csvData: csvString,
        fileInfo: {
          fileName,
          filePath,
          fileSize: fileBuffer.length,
          workerCount: workers.length,
          fieldsExported: selectedFields.length
        },
        download: {
          base64: base64Data,
          mimeType: 'text/csv'
        },
        summary: {
          totalWorkers: workers.length,
          byStatus: workers.reduce((/** @type {{ [x: string]: any; }} */ acc, /** @type {{ status: string | number; }} */ worker) => {
            acc[worker.status] = (acc[worker.status] || 0) + 1;
            return acc;
          }, {}),
          byKabisilya: workers.reduce((/** @type {{ [x: string]: any; }} */ acc, /** @type {{ kabisilya: { name: string; }; }} */ worker) => {
            const kabisilya = worker.kabisilya?.name || 'Unassigned';
            acc[kabisilya] = (acc[kabisilya] || 0) + 1;
            return acc;
          }, {}),
          totalDebt: workers.reduce((/** @type {number} */ sum, /** @type {{ totalDebt: any; }} */ worker) => sum + parseFloat(worker.totalDebt || 0), 0),
          totalPaid: workers.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: any; }} */ worker) => sum + parseFloat(worker.totalPaid || 0), 0),
          totalBalance: workers.reduce((/** @type {number} */ sum, /** @type {{ currentBalance: any; }} */ worker) => sum + parseFloat(worker.currentBalance || 0), 0)
        },
        sampleData: csvData.slice(0, 3) // First 3 rows as sample
      }
    };
  } catch (error) {
    console.error('Error in exportWorkersToCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export workers to CSV: ${error.message}`,
      data: null
    };
  }
};