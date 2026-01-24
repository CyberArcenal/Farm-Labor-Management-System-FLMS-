// ipc/user/get/by_email.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUserByEmail(params = {}) {
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

    if (!user) {
      return {
        status: false,
        message: 'User not found',
        data: null
      };
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return {
      status: true,
      message: 'User retrieved successfully',
      data: { user: userWithoutPassword }
    };
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve user: ${error.message}`,
      data: null
    };
  }
};