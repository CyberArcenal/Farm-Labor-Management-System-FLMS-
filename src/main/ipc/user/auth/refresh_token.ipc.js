// ipc/user/auth/refresh_token.ipc.js
//@ts-check

const User = require("../../../../entities/User");
// @ts-ignore
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");
const jwt = require("jsonwebtoken");

module.exports = async function refreshToken(params = {}) {
  try {
    // @ts-ignore
    const { refreshToken, userId } = params;
    
    if (!refreshToken && !userId) {
      return {
        status: false,
        message: 'Refresh token or user ID is required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    let user;

    if (refreshToken) {
      // Verify refresh token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(refreshToken, jwtSecret);
      
      user = await userRepository.findOne({
        // @ts-ignore
        where: { id: decoded.id }
      });
    } else {
      // Use user ID directly
      user = await userRepository.findOne({
        where: { id: parseInt(userId) }
      });
    }

    if (!user) {
      return {
        status: false,
        message: 'User not found',
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

    // Generate new token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      status: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expiresIn: 24 * 60 * 60 // 24 hours in seconds
      }
    };
  } catch (error) {
    console.error('Error in refreshToken:', error);
    
    // @ts-ignore
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        status: false,
        message: 'Invalid or expired token',
        data: null
      };
    }
    
    return {
      status: false,
      // @ts-ignore
      message: `Token refresh failed: ${error.message}`,
      data: null
    };
  }
};