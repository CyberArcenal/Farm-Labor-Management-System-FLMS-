// src/ipc/pitak/export_assignments.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Assignment = require("../../../entities/Assignment");
const { stringify } = require('csv-stringify/sync');
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async (/** @type {{ pitakId: any; dateRange?: {} | undefined; _userId: any; }} */ params) => {
  try {
    const { pitakId, dateRange = {}, _userId } = params;

    if (!pitakId) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Verify pitak exists
    const pitak = await pitakRepo.findOne({ 
      where: { id: pitakId },
      relations: ['bukid']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Build query for assignments
    const query = assignmentRepo.createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.worker', 'worker')
      .leftJoinAndSelect('assignment.pitak', 'pitak')
      .where('assignment.pitakId = :pitakId', { pitakId });

    // Apply date range filter
    // @ts-ignore
    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere('assignment.assignmentDate BETWEEN :startDate AND :endDate', {
        // @ts-ignore
        startDate: new Date(dateRange.startDate),
        // @ts-ignore
        endDate: new Date(dateRange.endDate)
      });
    }

    // Get assignments
    const assignments = await query
      .orderBy('assignment.assignmentDate', 'DESC')
      .getMany();

    // Prepare CSV data
    const csvData = assignments.map((/** @type {{ id: any; assignmentDate: { toISOString: () => string; }; luwangCount: string; status: any; workerId: any; worker: { name: any; contact: any; }; pitakId: any; pitak: { location: any; }; notes: any; createdAt: { toISOString: () => string; }; updatedAt: { toISOString: () => string; }; }} */ assignment) => ({
      'Assignment ID': assignment.id,
      'Assignment Date': assignment.assignmentDate.toISOString().split('T')[0],
      'LuWang Count': parseFloat(assignment.luwangCount).toFixed(2),
      'Status': assignment.status,
      'Worker ID': assignment.workerId,
      'Worker Name': assignment.worker ? assignment.worker.name : '',
      'Worker Contact': assignment.worker ? (assignment.worker.contact || '') : '',
      'Pitak ID': assignment.pitakId,
      'Pitak Location': assignment.pitak ? assignment.pitak.location : '',
      'Notes': assignment.notes || '',
      'Created Date': assignment.createdAt.toISOString().split('T')[0],
      'Updated Date': assignment.updatedAt ? assignment.updatedAt.toISOString().split('T')[0] : ''
    }));

    // Generate CSV
    const csv = stringify(csvData, {
      header: true,
      quoted: true,
      delimiter: ','
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pitakLocation = pitak.location || pitak.id;
    const filename = `pitak_${pitakLocation}_assignments_${timestamp}.csv`;

    // Calculate summary
    const summary = assignments.reduce((/** @type {{ totalAssignments: number; totalLuWang: number; completed: number; active: number; cancelled: number; }} */ sum, /** @type {{ luwangCount: string; status: string; }} */ assignment) => {
      sum.totalAssignments++;
      sum.totalLuWang += parseFloat(assignment.luwangCount);
      if (assignment.status === 'completed') sum.completed++;
      if (assignment.status === 'active') sum.active++;
      if (assignment.status === 'cancelled') sum.cancelled++;
      return sum;
    }, {
      totalAssignments: 0,
      totalLuWang: 0,
      completed: 0,
      active: 0,
      cancelled: 0
    });

    // Log activity
    await AppDataSource.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'export_pitak_assignments',
      entity: 'Pitak',
      entity_id: pitakId,
      details: JSON.stringify({
        dateRange,
        assignmentCount: assignments.length,
        filename,
        summary
      })
    });

    return {
      status: true,
      message: "Assignments export completed",
      data: {
        csv,
        filename,
        pitak: {
          id: pitak.id,
          location: pitak.location,
          totalLuwang: parseFloat(pitak.totalLuwang)
        },
        summary: {
          ...summary,
          totalLuWang: summary.totalLuWang.toFixed(2)
        },
        assignments: assignments.map((/** @type {{ id: any; assignmentDate: any; luwangCount: string; status: any; worker: { id: any; name: any; }; }} */ a) => ({
          id: a.id,
          assignmentDate: a.assignmentDate,
          luwangCount: parseFloat(a.luwangCount),
          status: a.status,
          worker: a.worker ? {
            id: a.worker.id,
            name: a.worker.name
          } : null
        }))
      }
    };

  } catch (error) {
    console.error("Error exporting pitak assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export assignments: ${error.message}`,
      data: null
    };
  }
};