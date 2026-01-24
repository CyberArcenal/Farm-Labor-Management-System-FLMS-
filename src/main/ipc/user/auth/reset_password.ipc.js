// ipc/user/auth/reset_password.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

module.exports = async function resetPassword(params = {}) {
  try {
    // @ts-ignore
    const { token, email, newPassword, confirmPassword } = params;
    
    if (!token || !email || !newPassword || !confirmPassword) {
      return {
        status: false,
        message: 'Token, email, and passwords are required',
        data: null
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        status: false,
        message: 'Passwords do not match',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return {
        status: false,
        message: 'User not found',
        data: null
      };
    }

    // In a real application, you would verify the reset token
    // For this example, we'll assume the token is valid if it matches a hash
    // or you could store reset tokens in the database with expiration
    
    // Simple token validation (replace with your actual token validation logic)
    const expectedToken = crypto
      .createHash('sha256')
      .update(user.id + user.email + process.env.RESET_SECRET)
      .digest('hex');
    
    if (token !== expectedToken) {
      return {
        status: false,
        message: 'Invalid or expired reset token',
        data: null
      };
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedPassword;
    user.updatedAt = new Date();
    
    await userRepository.save(user);
    
    // Log activity
    const activityRepo = AppDataSource.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: user.id,
      action: 'reset_password',
      description: 'Password reset successful',
      // @ts-ignore
      ip_address: params.ipAddress || "127.0.0.1",
      // @ts-ignore
      user_agent: params.userAgent || "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    return {
      status: true,
      message: 'Password reset successful',
      data: null
    };
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Password reset failed: ${error.message}`,
      data: null
    };
  }
};