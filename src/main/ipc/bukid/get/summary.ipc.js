// ipc/bukid/get/summary.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getBukidSummary(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { id, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Bukid ID is required',
        data: null
      };
    }

    const bukid = await bukidRepository.findOne({
      where: { id },
      relations: ['kabisilya', 'pitaks', 'pitaks.assignments']
    });

    if (!bukid) {
      return {
        status: false,
        message: 'Bukid not found',
        data: null
      };
    }

    // Calculate summary
    const summary = {
      id: bukid.id,
      name: bukid.name,
      location: bukid.location,
      status: bukid.status,
      kabisilya: bukid.kabisilya?.name || 'Unassigned',
      kabisilyaId: bukid.kabisilya?.id || null,
      pitakCount: bukid.pitaks?.length || 0,
      totalLuwang: bukid.pitaks?.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: any; }} */ pitak) => 
        sum + parseFloat(pitak.totalLuwang || 0), 0) || 0,
      assignmentCount: bukid.pitaks?.reduce((/** @type {any} */ sum, /** @type {{ assignments: string | any[]; }} */ pitak) => 
        sum + (pitak.assignments?.length || 0), 0) || 0,
      activeAssignments: bukid.pitaks?.reduce((/** @type {any} */ sum, /** @type {{ assignments: { filter: (arg0: (a: any) => boolean) => { (): any; new (): any; length: any; }; }; }} */ pitak) => 
        sum + (pitak.assignments?.filter((/** @type {{ status: string; }} */ a) => a.status === 'active')?.length || 0), 0) || 0,
      createdAt: bukid.createdAt,
      updatedAt: bukid.updatedAt
    };

    return {
      status: true,
      message: 'Bukid summary retrieved successfully',
      data: { summary }
    };
  } catch (error) {
    console.error('Error in getBukidSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve bukid summary: ${error.message}`,
      data: null
    };
  }
};