// ipc/user/auth/forgot_password.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const { AppDataSource } = require("../../../db/dataSource");
const crypto = require("crypto");

module.exports = async function forgotPassword(params = {}) {
  try {
    // @ts-ignore
    const { email } = params;
    
    if (!email) {
      return {
        status: false,
        message: 'Email is required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email }
    });

    // For security, don't reveal if the user exists or not
    if (!user) {
      return {
        status: true, // Still return success for security
        message: 'If an account exists with this email, you will receive a reset link',
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

    // Generate reset token
    const resetToken = crypto
      .createHash('sha256')
      .update(user.id + user.email + Date.now())
      .digest('hex');
    
    // In a real application, you would:
    // 1. Save the reset token and expiration to the database
    // 2. Send an email with the reset link
    
    // For this example, we'll just return the token
    // In production, NEVER return the token in the response
    
    // Log activity
    const activityRepo = AppDataSource.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: user.id,
      action: 'forgot_password',
      description: 'Password reset requested',
      // @ts-ignore
      ip_address: params.ipAddress || "127.0.0.1",
      // @ts-ignore
      user_agent: params.userAgent || "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    // Simulate sending email (in production, use an email service)
    console.log(`Reset link for ${user.email}: /reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`);

    return {
      status: true,
      message: 'If an account exists with this email, you will receive a reset link',
      data: {
        // In production, don't return the token
        // token: resetToken,
        emailSent: true
      }
    };
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Password reset request failed: ${error.message}`,
      data: null
    };
  }
};