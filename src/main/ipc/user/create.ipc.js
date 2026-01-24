// ipc/user/create.ipc.js
//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const bcrypt = require("bcryptjs");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function createUser(params = {}, queryRunner = null) {
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
    const { username, email, password, role, isActive, _userId } = params;
    
    // Validate required fields
    if (!username || !email || !password) {
      return {
        status: false,
        message: 'Username, email, and password are required',
        data: null
      };
    }

    // Check if username already exists
    // @ts-ignore
    const existingUserByUsername = await queryRunner.manager.findOne(User, {
      where: { username }
    });

    if (existingUserByUsername) {
      return {
        status: false,
        message: 'Username already exists',
        data: null
      };
    }

    // Check if email already exists
    // @ts-ignore
    const existingUserByEmail = await queryRunner.manager.findOne(User, {
      where: { email }
    });

    if (existingUserByEmail) {
      return {
        status: false,
        message: 'Email already exists',
        data: null
      };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    // @ts-ignore
    const user = queryRunner.manager.create(User, {
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // @ts-ignore
    const savedUser = await queryRunner.manager.save(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser;
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'create_user',
      description: `Created user: ${username} (${email})`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: 'User created successfully',
      data: { user: userWithoutPassword }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in createUser:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create user: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};