// ipc/user/import_csv.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const bcrypt = require("bcryptjs");
const { parse } = require("csv-parse/sync");

module.exports = async function importUsersFromCSV(params = {}, queryRunner = null) {
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
    const { csvData, csvFile, hasHeaders = true, _userId } = params;
    
    let csvContent = csvData;
    
    // If file path is provided, read the file
    if (csvFile && !csvData) {
      const fs = require('fs');
      csvContent = fs.readFileSync(csvFile, 'utf-8');
    }
    
    if (!csvContent) {
      return {
        status: false,
        message: 'CSV data or file is required',
        data: null
      };
    }

    // Parse CSV
    const records = parse(csvContent, {
      columns: hasHeaders,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return {
        status: false,
        message: 'CSV file is empty or invalid',
        data: null
      };
    }

    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository(User);
    const importedUsers = [];
    const errors = [];

    // Check for existing users
    // @ts-ignore
    const usernames = records.map(r => r.username).filter(Boolean);
    // @ts-ignore
    const emails = records.map(r => r.email).filter(Boolean);
    
    const existingUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.username IN (:...usernames)', { usernames })
      .orWhere('user.email IN (:...emails)', { emails })
      .getMany();
    
    // @ts-ignore
    const existingUsernames = existingUsers.map(u => u.username);
    // @ts-ignore
    const existingEmails = existingUsers.map(u => u.email);

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        // @ts-ignore
        const { username, email, role = 'user', isActive = true, password } = record;
        
        // Validate required fields
        if (!username || !email) {
          errors.push({ 
            row: i + (hasHeaders ? 2 : 1),
            record,
            error: 'Username and email are required' 
          });
          continue;
        }

        // Check for duplicates
        if (existingUsernames.includes(username)) {
          errors.push({ 
            row: i + (hasHeaders ? 2 : 1),
            record,
            error: 'Username already exists' 
          });
          continue;
        }

        if (existingEmails.includes(email)) {
          errors.push({ 
            row: i + (hasHeaders ? 2 : 1),
            record,
            error: 'Email already exists' 
          });
          continue;
        }

        // Hash password (generate random if not provided)
        const userPassword = password || Math.random().toString(36).slice(-8);
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

        // Create user
        // @ts-ignore
        const user = userRepository.create({
          username,
          email,
          password: hashedPassword,
          role,
          isActive: isActive === 'true' || isActive === true || isActive === '1',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // @ts-ignore
        const savedUser = await queryRunner.manager.save(user);
        
        // Store for reporting
        importedUsers.push({
          ...savedUser,
          plainPassword: userPassword
        });
        
        // Add to existing lists
        existingUsernames.push(username);
        existingEmails.push(email);
      } catch (error) {
        errors.push({ 
          row: i + (hasHeaders ? 2 : 1),
          record: records[i],
          // @ts-ignore
          error: error.message 
        });
      }
    }

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'import_users_csv',
      description: `Imported ${importedUsers.length} users from CSV`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    // Remove passwords from response
    const sanitizedUsers = importedUsers.map(user => {
      const { password, plainPassword, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      status: true,
      message: `CSV import completed. Imported: ${importedUsers.length}, Failed: ${errors.length}`,
      data: {
        imported: sanitizedUsers,
        errors,
        summary: {
          total: records.length,
          imported: importedUsers.length,
          failed: errors.length
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in importUsersFromCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `CSV import failed: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};