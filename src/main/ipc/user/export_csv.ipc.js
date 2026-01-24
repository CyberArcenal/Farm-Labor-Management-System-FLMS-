// ipc/user/export_csv.ipc.js
//@ts-check

const User = require("../../../entities/User");
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const { stringify } = require("csv-stringify/sync");

module.exports = async function exportUsersToCSV(params = {}) {
  try {
    const { 
      // @ts-ignore
      includeInactive = false,
      // @ts-ignore
      roles = [],
      // @ts-ignore
      startDate,
      // @ts-ignore
      endDate,
      // @ts-ignore
      fields = ['id', 'username', 'email', 'role', 'isActive', 'createdAt', 'lastLogin']
    } = params;

    const userRepository = AppDataSource.getRepository(User);
    const queryBuilder = userRepository.createQueryBuilder('user');
    
    // Apply filters
    if (!includeInactive) {
      queryBuilder.where('user.isActive = :isActive', { isActive: true });
    }
    
    if (roles && roles.length > 0) {
      queryBuilder.andWhere('user.role IN (:...roles)', { roles });
    }
    
    if (startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate: end });
    }
    
    // Get users
    const users = await queryBuilder.getMany();
    
    if (users.length === 0) {
      return {
        status: false,
        message: 'No users found matching the criteria',
        data: null
      };
    }

    // Prepare data for CSV
    const csvData = users.map((/** @type {{ [x: string]: any; }} */ user) => {
      const row = {};
      
      fields.forEach((/** @type {string | number} */ field) => {
        if (user[field] !== undefined) {
          // @ts-ignore
          row[field] = user[field];
        }
      });
      
      return row;
    });

    // Generate CSV
    const csv = stringify(csvData, {
      header: true,
      columns: fields.map((/** @type {any} */ field) => ({ key: field, header: field }))
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `users-export-${timestamp}.csv`;

    return {
      status: true,
      message: 'CSV export completed successfully',
      data: {
        csv,
        filename,
        count: users.length,
        fields,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in exportUsersToCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `CSV export failed: ${error.message}`,
      data: null
    };
  }
};