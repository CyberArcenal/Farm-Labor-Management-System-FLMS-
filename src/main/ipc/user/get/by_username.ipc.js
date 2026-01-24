// ipc/user/get/by_username.ipc.js
// @ts-nocheck

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUserByUsername(params = {}) {
  try {
    const { username } = params;
    
    if (!username) {
      return {
        status: false,
        message: 'Username is required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username }
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
    console.error('Error in getUserByUsername:', error);
    return {
      status: false,
      message: `Failed to retrieve user: ${error.message}`,
      data: null
    };
  }
};