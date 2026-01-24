// ipc/user/auth/login.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = async function loginUser(params = {}) {
  try {
    // @ts-ignore
    const { username, email, password } = params;
    
    // Validate input
    if ((!username && !email) || !password) {
      return {
        status: false,
        message: 'Username/email and password are required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    
    // Find user by username or email
    const whereCondition = username ? { username } : { email };
    const user = await userRepository.findOne({
      where: whereCondition
    });

    if (!user) {
      return {
        status: false,
        message: 'Invalid credentials',
        data: null
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        status: false,
        message: 'Account is deactivated',
        data: null
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        status: false,
        message: 'Invalid credentials',
        data: null
      };
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Log activity
    const activityRepo = AppDataSource.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: user.id,
      action: 'login',
      description: 'User logged in successfully',
      // @ts-ignore
      ip_address: params.ipAddress || "127.0.0.1",
      // @ts-ignore
      user_agent: params.userAgent || "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    return {
      status: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: 24 * 60 * 60 // 24 hours in seconds
      }
    };
  } catch (error) {
    console.error('Error in loginUser:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Login failed: ${error.message}`,
      data: null
    };
  }
};