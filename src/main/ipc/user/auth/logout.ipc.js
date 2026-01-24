// ipc/user/auth/logout.ipc.js
//@ts-check

// @ts-ignore
const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function logoutUser(params = {}) {
  try {
    // @ts-ignore
    const { userId, token, ipAddress, userAgent } = params;
    
    if (!userId) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    // Log logout activity
    const activityRepo = AppDataSource.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: userId,
      action: 'logout',
      description: 'User logged out successfully',
      ip_address: ipAddress || "127.0.0.1",
      user_agent: userAgent || "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    // Note: In a stateless JWT system, we cannot invalidate the token on the server side.
    // The client should discard the token. If you need token invalidation,
    // consider using a token blacklist or switching to a session-based system.

    return {
      status: true,
      message: 'Logout successful',
      data: null
    };
  } catch (error) {
    console.error('Error in logoutUser:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Logout failed: ${error.message}`,
      data: null
    };
  }
};