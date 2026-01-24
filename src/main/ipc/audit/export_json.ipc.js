// ipc/auditTrail/export_json.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const fs = require('fs');
const path = require('path');

module.exports = async function exportAuditTrailsToJSON(params = {}) {
  try {
    const { 
      // @ts-ignore
      filters = {},
      // @ts-ignore
      startDate,
      // @ts-ignore
      endDate,
      // @ts-ignore
      format = 'pretty', // 'pretty' or 'compact'
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
      order: { timestamp: 'DESC' },
      take: 10000 // Safety limit
    });
    
    if (auditTrails.length === 0) {
      return {
        status: false,
        message: 'No audit trails found to export',
        data: null
      };
    }
    
    // Prepare data structure
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: `User ${_userId}`,
        recordCount: auditTrails.length,
        filters,
        dateRange: {
          startDate: startDate || 'not-specified',
          endDate: endDate || 'not-specified'
        }
      },
      // @ts-ignore
      auditTrails: auditTrails.map(trail => ({
        id: trail.id,
        action: trail.action,
        actor: trail.actor,
        details: trail.details,
        timestamp: trail.timestamp.toISOString()
      }))
    };
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '../../../../exports/audit_trails/json');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit_trails_${timestamp}.json`;
    const filepath = path.join(exportDir, filename);
    
    // Write JSON file
    const jsonString = format === 'pretty' 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
    
    fs.writeFileSync(filepath, jsonString, 'utf8');
    
    // Log export activity
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'export_audit_trails_json',
      actor: `User ${_userId}`,
      details: { 
        filters, 
        startDate, 
        endDate, 
        recordCount: auditTrails.length,
        filename,
        format 
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
        downloadUrl: `/exports/audit_trails/json/${filename}`,
        fileSize: fs.statSync(filepath).size,
        format
      }
    };
  } catch (error) {
    console.error('Error in exportAuditTrailsToJSON:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export audit trails: ${error.message}`,
      data: null
    };
  }
};