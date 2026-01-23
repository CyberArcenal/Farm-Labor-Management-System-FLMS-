// src/ipc/pitak/import_csv.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Bukid = require("../../../entities/Bukid");
// @ts-ignore
const csv = require('csv-parser');
// @ts-ignore
const { Readable } = require('stream');
const UserActivity = require("../../../entities/UserActivity");

module.exports = async (/** @type {{ csvData: any; options?: {} | undefined; _userId: any; }} */ params, /** @type {{ manager: { getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; user_id: unknown; action: unknown; entity: unknown; entity_id: unknown; ip_address: unknown; user_agent: unknown; details: unknown; created_at: unknown; }> | import("typeorm").EntitySchema<{ id: unknown; name: unknown; location: unknown; createdAt: unknown; updatedAt: unknown; }>) => { (): any; new (): any; save: { (arg0: { user_id: any; action: string; entity: string; entity_id: any; details: string; }): any; new (): any; }; }; }; }} */ queryRunner) => {
  try {
    const { csvData, options = {}, _userId } = params;

    if (!csvData) {
      return {
        status: false,
        message: "CSV data is required",
        data: null
      };
    }

    const {
      // @ts-ignore
      hasHeaders = true,
      // @ts-ignore
      delimiter = ',',
      // @ts-ignore
      skipFirst = 0,
      // @ts-ignore
      maxRows = 1000
    } = options;

    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const bukidRepo = queryRunner.manager.getRepository(Bukid);

    const results = [];
    const errors = [];
    const successful = [];

    // Parse CSV data
    const rows = csvData.split('\n')
      .slice(skipFirst + (hasHeaders ? 1 : 0))
      .filter((/** @type {string} */ row) => row.trim())
      .slice(0, maxRows);

    let rowNumber = skipFirst + (hasHeaders ? 1 : 0) + 1;

    for (const row of rows) {
      try {
        const columns = row.split(delimiter).map((/** @type {string} */ col) => col.trim());
        
        // Expected columns: bukidId, location, totalLuwang, status
        if (columns.length < 1) {
          errors.push({
            row: rowNumber,
            error: "Invalid row format",
            data: row
          });
          rowNumber++;
          continue;
        }

        const bukidId = parseInt(columns[0]);
        const location = columns[1] || null;
        const totalLuwang = parseFloat(columns[2] || '0');
        const status = columns[3] || 'active';

        // Validate bukid
        // @ts-ignore
        const bukid = await bukidRepo.findOne({ where: { id: bukidId } });
        if (!bukid) {
          errors.push({
            row: rowNumber,
            error: `Bukid with ID ${bukidId} not found`,
            data: row
          });
          rowNumber++;
          continue;
        }

        // Validate status
        const validStatuses = ['active', 'inactive', 'harvested'];
        if (!validStatuses.includes(status)) {
          errors.push({
            row: rowNumber,
            error: `Invalid status: ${status}`,
            data: row
          });
          rowNumber++;
          continue;
        }

        // Check for duplicate location in same bukid
        if (location) {
          // @ts-ignore
          const existing = await pitakRepo.findOne({
            where: { bukidId, location }
          });
          
          if (existing) {
            errors.push({
              row: rowNumber,
              error: "Duplicate location in same bukid",
              data: row
            });
            rowNumber++;
            continue;
          }
        }

        // Create pitak
        // @ts-ignore
        const newPitak = pitakRepo.create({
          bukidId,
          location,
          totalLuwang: totalLuwang.toFixed(2),
          status
        });

        const savedPitak = await pitakRepo.save(newPitak);
        successful.push({
          row: rowNumber,
          pitakId: savedPitak.id,
          location: savedPitak.location
        });

        // Log activity
        await queryRunner.manager.getRepository(UserActivity).save({
          user_id: _userId,
          action: 'import_pitak_csv',
          entity: 'Pitak',
          entity_id: savedPitak.id,
          details: JSON.stringify({
            source: 'csv_import',
            row: rowNumber,
            data: {
              bukidId,
              location,
              totalLuwang,
              status
            }
          })
        });

        results.push(savedPitak);
        rowNumber++;

      } catch (error) {
        errors.push({
          row: rowNumber,
          // @ts-ignore
          error: error.message,
          data: row
        });
        rowNumber++;
      }
    }

    const totalLuWang = results.reduce((sum, pitak) => 
      sum + parseFloat(pitak.totalLuwang), 0);

    return {
      status: true,
      message: "CSV import completed",
      data: {
        imported: results.map(p => ({
          id: p.id,
          bukidId: p.bukidId,
          location: p.location,
          totalLuwang: parseFloat(p.totalLuwang),
          status: p.status
        })),
        errors,
        successful
      },
      meta: {
        totalRows: rows.length,
        imported: results.length,
        failed: errors.length,
        totalLuWangImported: totalLuWang.toFixed(2)
      }
    };

  } catch (error) {
    console.error("Error importing pitaks from CSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to import CSV: ${error.message}`,
      data: null
    };
  }
};