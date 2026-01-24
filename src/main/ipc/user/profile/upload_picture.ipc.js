// ipc/user/profile/upload_picture.ipc.js
//@ts-check

const User = require("../../../../entities/User");
const UserActivity = require("../../../../entities/UserActivity");
const fs = require("fs");
const path = require("path");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function uploadProfilePicture(params = {}, queryRunner = null) {
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
    const { userId, imageData, imagePath, mimeType, _userId } = params;
    
    if (!userId) {
      return {
        status: false,
        message: 'User ID is required',
        data: null
      };
    }

    // Users can only upload their own profile picture unless they're admin
    const isSelf = parseInt(userId) === parseInt(_userId);
    // @ts-ignore
    const currentUser = await queryRunner.manager.findOne(User, {
      where: { id: parseInt(_userId) }
    });
    
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isSelf && !isAdmin) {
      return {
        status: false,
        message: 'You can only upload your own profile picture',
        data: null
      };
    }

    // @ts-ignore
    const userRepository = queryRunner.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return {
        status: false,
        message: 'User not found',
        data: null
      };
    }

    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let filename;
    let imageUrl;

    if (imagePath) {
      // Handle file upload from path
      const ext = path.extname(imagePath);
      filename = `profile_${userId}_${Date.now()}${ext}`;
      const destPath = path.join(uploadDir, filename);
      
      // Copy file to upload directory
      fs.copyFileSync(imagePath, destPath);
      
      imageUrl = `/uploads/profile-pictures/${filename}`;
    } else if (imageData) {
      // Handle base64 image data
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return {
          status: false,
          message: 'Invalid image data',
          data: null
        };
      }
      
      const type = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      
      // Determine file extension from mime type
      const ext = mimeType ? mimeType.split('/')[1] : 'jpg';
      filename = `profile_${userId}_${Date.now()}.${ext}`;
      const destPath = path.join(uploadDir, filename);
      
      // Save file
      fs.writeFileSync(destPath, buffer);
      
      imageUrl = `/uploads/profile-pictures/${filename}`;
    } else {
      return {
        status: false,
        message: 'Image data or path is required',
        data: null
      };
    }

    // Update user profile with image URL
    // Note: You may need to add a profilePicture field to your User entity
    // For now, we'll store it in a JSON field or custom property
    user.profilePicture = imageUrl;
    user.updatedAt = new Date();

    // @ts-ignore
    const updatedUser = await queryRunner.manager.save(user);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'upload_profile_picture',
      description: `Uploaded profile picture for user: ${user.username}`,
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
      message: 'Profile picture uploaded successfully',
      data: {
        user: userWithoutPassword,
        imageUrl,
        filename
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in uploadProfilePicture:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to upload profile picture: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};