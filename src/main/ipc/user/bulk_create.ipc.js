// ipc/user/bulk_create.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const bcrypt = require("bcryptjs");

module.exports = async function bulkCreateUsers(params = {}, queryRunner = null) {
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
    const { users, defaultPassword, _userId } = params;
    
    if (!Array.isArray(users) || users.length === 0) {
      return {
        status: false,
        message: 'Users array is required and must not be empty',
        data: null
      };
    }

    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository(User);
    const createdUsers = [];
    const errors = [];

    // Check for duplicates first
    const usernames = users.map(u => u.username).filter(Boolean);
    const emails = users.map(u => u.email).filter(Boolean);
    
    const existingUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.username IN (:...usernames)', { usernames })
      .orWhere('user.email IN (:...emails)', { emails })
      .getMany();
    
    const existingUsernames = existingUsers.map((/** @type {{ username: any; }} */ u) => u.username);
    const existingEmails = existingUsers.map((/** @type {{ email: any; }} */ u) => u.email);

    for (const userData of users) {
      try {
        const { username, email, role = 'user', isActive = true } = userData;
        
        // Validate required fields
        if (!username || !email) {
          errors.push({ 
            user: userData, 
            error: 'Username and email are required' 
          });
          continue;
        }

        // Check for duplicates in this batch
        if (existingUsernames.includes(username)) {
          errors.push({ 
            user: userData, 
            error: 'Username already exists' 
          });
          continue;
        }

        if (existingEmails.includes(email)) {
          errors.push({ 
            user: userData, 
            error: 'Email already exists' 
          });
          continue;
        }

        // Hash password (use default password or generate random one)
        const password = userData.password || defaultPassword || Math.random().toString(36).slice(-8);
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        // @ts-ignore
        const user = userRepository.create({
          username,
          email,
          password: hashedPassword,
          role,
          isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // @ts-ignore
        const savedUser = await queryRunner.manager.save(user);
        
        // Store plain password for reporting (in real app, send email instead)
        const userWithPlainPassword = {
          ...savedUser,
          plainPassword: password
        };
        
        createdUsers.push(userWithPlainPassword);
        
        // Add to existing lists to avoid duplicates in the same batch
        existingUsernames.push(username);
        existingEmails.push(email);
      } catch (error) {
        errors.push({ 
          user: userData, 
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
      action: 'bulk_create_users',
      description: `Created ${createdUsers.length} users in bulk`,
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
    const sanitizedUsers = createdUsers.map(user => {
      const { password, plainPassword, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      status: true,
      message: `Bulk creation completed. Created: ${createdUsers.length}, Failed: ${errors.length}`,
      data: {
        created: sanitizedUsers,
        errors,
        summary: {
          total: users.length,
          created: createdUsers.length,
          failed: errors.length
        }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in bulkCreateUsers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk creation failed: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};