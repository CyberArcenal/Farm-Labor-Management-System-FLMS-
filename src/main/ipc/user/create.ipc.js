// ipc/user/create.ipc.js
//@ts-check

const bcrypt = require("bcryptjs");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function createUser(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
    // @ts-ignore
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { username, email, password, role, isActive, userId } = params;
    
    // Validate required fields
    if (!username || !email || !password) {
      return {
        status: false,
        message: 'Username, email, and password are required',
        data: null
      };
    }

    // Get repositories
    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository('User');
    // @ts-ignore
    const userActivityRepository = queryRunner.manager.getRepository('UserActivity');

    // Check if username already exists
    const existingUserByUsername = await userRepository.findOne({
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
    const existingUserByEmail = await userRepository.findOne({
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
    const user = userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedUser = await userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser;
    
    // Log activity - Use repository.create() and repository.save()
    const activity = userActivityRepository.create({
      user_id: savedUser.id, // This should be the ID of the user performing the action
      action: 'create_user',
      details: JSON.stringify({
        message: `Created user: ${username} (${email})`,
        newUserId: savedUser.id
      }),
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System"
    });
    
    await userActivityRepository.save(activity);

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