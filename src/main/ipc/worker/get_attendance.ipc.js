// ipc/worker/get_attendance.ipc.js
//@ts-check

// @ts-ignore
// @ts-ignore
const Worker = require("../../../entities/Worker");
// @ts-ignore
// @ts-ignore
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
// @ts-ignore
// @ts-ignore
const Payment = require("../../../entities/Payment");
// @ts-ignore
// @ts-ignore
const Debt = require("../../../entities/Debt");
const Assignment = require("../../../entities/Assignment");

module.exports = async function getWorkerAttendance(params = {}) {
  try {
    // @ts-ignore
    // @ts-ignore
    const { workerId, month, year, _userId } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const assignmentRepository = AppDataSource.getRepository(Assignment);

    // Calculate date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month

    const assignments = await assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.pitak', 'pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .where('assignment.workerId = :workerId', { workerId: parseInt(workerId) })
      .andWhere('assignment.assignmentDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      })
      .orderBy('assignment.assignmentDate', 'ASC')
      .getMany();

    // Create attendance calendar
    const daysInMonth = endDate.getDate();
    // @ts-ignore
    const attendance = [];
    
    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      attendance.push({
        date: date.toISOString().split('T')[0],
        day: day,
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        assignments: [],
        hasWork: false,
        totalLuwang: 0
      });
    }

    // Populate assignments
    // @ts-ignore
    assignments.forEach(assignment => {
      // @ts-ignore
      const assignmentDate = new Date(assignment.assignmentDate);
      const dayIndex = assignmentDate.getDate() - 1;
      
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        // @ts-ignore
        attendance[dayIndex].assignments.push({
          id: assignment.id,
          luwangCount: assignment.luwangCount,
          status: assignment.status,
          // @ts-ignore
          pitak: assignment.pitak?.location,
          // @ts-ignore
          bukid: assignment.pitak?.bukid?.name
        });
        // @ts-ignore
        attendance[dayIndex].hasWork = true;
        // @ts-ignore
        attendance[dayIndex].totalLuwang += parseFloat(assignment.luwangCount || 0);
      }
    });

    // Calculate summary
    const summary = {
      totalDays: daysInMonth,
      workingDays: attendance.filter(day => !day.isWeekend).length,
      daysWorked: attendance.filter(day => day.hasWork).length,
      daysOff: attendance.filter(day => !day.isWeekend && !day.hasWork).length,
      weekendDaysWorked: attendance.filter(day => day.isWeekend && day.hasWork).length,
      totalLuwang: attendance.reduce((sum, day) => sum + day.totalLuwang, 0),
      averageLuwangPerDay: attendance.filter(day => day.hasWork).length > 0 ?
        attendance.reduce((sum, day) => sum + day.totalLuwang, 0) / 
        attendance.filter(day => day.hasWork).length : 0,
      attendanceRate: (attendance.filter(day => !day.isWeekend && day.hasWork).length / 
                      attendance.filter(day => !day.isWeekend).length) * 100
    };

    // Group by week
    // @ts-ignore
    const weeks = [];
    // @ts-ignore
    let currentWeek = [];
    
    attendance.forEach((day, index) => {
      currentWeek.push(day);
      
      // Start new week on Sunday or end of month
      if (day.dayOfWeek === 'Sat' || index === attendance.length - 1) {
        const weekNumber = weeks.length + 1;
        // @ts-ignore
        const weekLuwang = currentWeek.reduce((sum, d) => sum + d.totalLuwang, 0);
        // @ts-ignore
        const weekDaysWorked = currentWeek.filter(d => d.hasWork).length;
        
        weeks.push({
          week: weekNumber,
          // @ts-ignore
          days: [...currentWeek],
          summary: {
            daysInWeek: currentWeek.length,
            daysWorked: weekDaysWorked,
            totalLuwang: weekLuwang,
            averageLuwang: weekDaysWorked > 0 ? weekLuwang / weekDaysWorked : 0
          }
        });
        
        currentWeek = [];
      }
    });

    // Get recent months for comparison
    const recentMonths = [];
    for (let i = 0; i < 3; i++) {
      const pastMonth = new Date(targetYear, targetMonth - 1 - i, 1);
      const pastMonthName = pastMonth.toLocaleString('default', { month: 'long' });
      const pastYear = pastMonth.getFullYear();
      
      // Simplified - in reality you'd query for each month
      recentMonths.push({
        month: pastMonthName,
        year: pastYear,
        display: `${pastMonthName} ${pastYear}`
      });
    }

    return {
      status: true,
      message: 'Worker attendance retrieved successfully',
      data: {
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: startDate.toLocaleString('default', { month: 'long' }),
          startDate,
          endDate
        },
        attendance,
        // @ts-ignore
        weeks,
        summary,
        recentMonths,
        trends: {
          // This would require historical data comparison
          monthlyComparison: 'No historical data available for comparison'
        }
      }
    };
  } catch (error) {
    console.error('Error in getWorkerAttendance:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker attendance: ${error.message}`,
      data: null
    };
  }
};