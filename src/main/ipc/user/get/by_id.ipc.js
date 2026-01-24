// ipc/user/get/by_id.ipc.js
// @ts-nocheck

const User = require("../../../../entities/User");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getUserById(params = {}) {
  try {
    const { id } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: parseInt(id) }
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
    console.error('Error in getUserById:', error);
    return {
      status: false,
      message: `Failed to retrieve user: ${error.message}`,
      data: null
    };
  }
};