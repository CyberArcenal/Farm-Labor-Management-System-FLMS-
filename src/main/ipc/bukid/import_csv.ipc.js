// ipc/bukid/import_csv.ipc.js
//@ts-check

const fs = require('fs');
const csv = require('csv-parser');
const { AppDataSource } = require('../../db/dataSource');
const Bukid = require('../../../entities/Bukid');
const UserActivity = require('../../../entities/UserActivity');

module.exports = async function importBukidFromCSV(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { filePath, _userId } = params;
    
    if (!filePath || !fs.existsSync(filePath)) {
      return {
        status: false,
        message: 'CSV file not found',
        data: null
      };
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
      total: 0
    };

    // @ts-ignore
    const bukids = [];
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          bukids.push(row);
          results.total++;
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each bukid
    // @ts-ignore
    for (const [index, bukidData] of bukids.entries()) {
      try {
        const { name, location, kabisilyaId, status } = bukidData;
        
        if (!name) {
          // @ts-ignore
          results.errors.push({
            row: index + 1,
            error: 'Name is required'
          });
          results.skipped++;
          continue;
        }

        // Check if bukid already exists
        // @ts-ignore
        const existingBukid = await queryRunner.manager.findOne(Bukid, {
          where: { name }
        });

        if (existingBukid) {
          // @ts-ignore
          results.errors.push({
            row: index + 1,
            name,
            error: 'Bukid already exists'
          });
          results.skipped++;
          continue;
        }

        // Create bukid
        // @ts-ignore
        const bukid = queryRunner.manager.create(Bukid, {
          name,
          location: location || null,
          kabisilya: kabisilyaId ? { id: parseInt(kabisilyaId) } : null,
          status: status || 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // @ts-ignore
        await queryRunner.manager.save(bukid);
        results.imported++;
        
      } catch (error) {
        // @ts-ignore
        results.errors.push({
          row: index + 1,
          name: bukidData.name || 'Unknown',
          // @ts-ignore
          error: error.message
        });
        results.skipped++;
      }
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'import_bukid_csv',
      description: `Imported ${results.imported} bukids from CSV`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease && results.imported > 0) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    } else if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }

    // Clean up file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn('Failed to delete CSV file:', error);
    }

    return {
      status: results.imported > 0,
      message: `Imported ${results.imported} of ${results.total} bukids successfully`,
      data: { results }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in importBukidFromCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to import bukid from CSV: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};