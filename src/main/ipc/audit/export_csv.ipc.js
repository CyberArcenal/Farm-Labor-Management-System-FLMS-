// ipc/auditTrail/export_csv.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

module.exports = async function exportAuditTrailsToCSV(params = {}) {
  try {
    const { 
      // @ts-ignore
      filters = {},
      // @ts-ignore
      startDate,
      // @ts-ignore
      endDate,
      // @ts-ignore
      _userId 
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const whereConditions = {};
    
    // Apply date filters if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      
      // @ts-ignore
      whereConditions.timestamp = {
        $gte: start,
        $lte: end
      };
    }
    
    // Apply other filters
    if (filters.action) {
      // @ts-ignore
      whereConditions.action = filters.action;
    }
    
    if (filters.actor) {
      // @ts-ignore
      whereConditions.actor = filters.actor;
    }
    
    // Get all matching records (be careful with large datasets)
    const auditTrails = await auditRepo.find({
      where: whereConditions,
      order: { timestamp: 'DESC' }
    });
    
    if (auditTrails.length === 0) {
      return {
        status: false,
        message: 'No audit trails found to export',
        data: null
      };
    }
    
    // Prepare data for CSV
    const csvData = auditTrails.map((/** @type {{ id: any; action: any; actor: any; details: any; timestamp: { toISOString: () => string; }; }} */ trail) => ({
      id: trail.id,
      action: trail.action,
      actor: trail.actor,
      details: JSON.stringify(trail.details),
      timestamp: trail.timestamp.toISOString(),
      date: trail.timestamp.toISOString().split('T')[0],
      time: trail.timestamp.toISOString().split('T')[1].split('.')[0]
    }));
    
    // Convert to CSV
    const json2csvParser = new Parser({
      fields: ['id', 'action', 'actor', 'details', 'timestamp', 'date', 'time']
    });
    
    const csv = json2csvParser.parse(csvData);
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '../../../../exports/audit_trails');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit_trails_${timestamp}.csv`;
    const filepath = path.join(exportDir, filename);
    
    // Write CSV file
    fs.writeFileSync(filepath, csv);
    
    // Log export activity
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'export_audit_trails_csv',
      actor: `User ${_userId}`,
      details: { 
        filters, 
        startDate, 
        endDate, 
        recordCount: auditTrails.length,
        filename 
      },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trails exported successfully',
      data: {
        filename,
        filepath,
        recordCount: auditTrails.length,
        downloadUrl: `/exports/audit_trails/${filename}`
      }
    };
  } catch (error) {
    console.error('Error in exportAuditTrailsToCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export audit trails: ${error.message}`,
      data: null
    };
  }
};