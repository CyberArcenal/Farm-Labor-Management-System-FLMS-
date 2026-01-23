// src/ipc/assignment/search/search.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const Worker = require("../../../../entities/Worker");
const Pitak = require("../../../../entities/Pitak");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Search assignments
 * @param {string} query - Search query
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
module.exports = async (query, userId) => {
  try {
    if (!query || query.trim() === '') {
      return {
        status: false,
        message: "Search query is required",
        data: null
      };
    }

    const searchTerm = `%${query.trim()}%`;
    
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    // Search in multiple fields
    const assignments = await assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .where("assignment.notes LIKE :searchTerm", { searchTerm })
      .orWhere("worker.name LIKE :searchTerm", { searchTerm })
      .orWhere("worker.code LIKE :searchTerm", { searchTerm })
      .orWhere("pitak.name LIKE :searchTerm", { searchTerm })
      .orWhere("pitak.code LIKE :searchTerm", { searchTerm })
      .orWhere("pitak.location LIKE :searchTerm", { searchTerm })
      .orderBy("assignment.assignmentDate", "DESC")
      .getMany();

    // Also search by date if query looks like a date
    let dateResults = [];
    try {
      const dateQuery = new Date(query);
      if (!isNaN(dateQuery.getTime())) {
        const dateStr = dateQuery.toISOString().split('T')[0];
        const nextDay = new Date(dateQuery);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        
        dateResults = await assignmentRepo
          .createQueryBuilder("assignment")
          .leftJoinAndSelect("assignment.worker", "worker")
          .leftJoinAndSelect("assignment.pitak", "pitak")
          .where("assignment.assignmentDate >= :date", { date: dateStr })
          .andWhere("assignment.assignmentDate < :nextDay", { nextDay: nextDayStr })
          .orderBy("assignment.assignmentDate", "DESC")
          .getMany();
      }
    } catch (error) {
      // Ignore date parsing errors
    }

    // Combine results, removing duplicates
    const allAssignments = [...assignments];
    const assignmentIds = new Set(assignments.map((/** @type {{ id: any; }} */ a) => a.id));
    
    dateResults.forEach((/** @type {{ id: any; }} */ assignment) => {
      if (!assignmentIds.has(assignment.id)) {
        allAssignments.push(assignment);
        assignmentIds.add(assignment.id);
      }
    });

    // Group search results by category
    const searchResults = {
      total: allAssignments.length,
      byCategory: {
        notes: assignments.filter((/** @type {{ notes: string | string[]; }} */ a) => a.notes && a.notes.includes(query)).length,
        worker: assignments.filter((/** @type {{ worker: { name: string | string[]; code: string | string[]; }; }} */ a) => 
          a.worker && (a.worker.name.includes(query) || a.worker.code.includes(query))
        ).length,
        pitak: assignments.filter((/** @type {{ pitak: { name: string | string[]; code: string | string[]; location: string | string[]; }; }} */ a) => 
          a.pitak && (a.pitak.name.includes(query) || a.pitak.code.includes(query) || a.pitak.location?.includes(query))
        ).length,
        date: dateResults.length
      },
      assignments: allAssignments.map(assignment => {
        // Highlight search matches
        const highlights = [];
        
        if (assignment.notes && assignment.notes.includes(query)) {
          highlights.push("notes");
        }
        
        if (assignment.worker) {
          if (assignment.worker.name.includes(query)) highlights.push("worker name");
          if (assignment.worker.code.includes(query)) highlights.push("worker code");
        }
        
        if (assignment.pitak) {
          if (assignment.pitak.name.includes(query)) highlights.push("pitak name");
          if (assignment.pitak.code.includes(query)) highlights.push("pitak code");
          if (assignment.pitak.location && assignment.pitak.location.includes(query)) highlights.push("pitak location");
        }

        return {
          id: assignment.id,
          luwangCount: parseFloat(assignment.luwangCount).toFixed(2),
          assignmentDate: assignment.assignmentDate,
          status: assignment.status,
          highlights,
          worker: assignment.worker ? {
            id: assignment.worker.id,
            name: assignment.worker.name,
            code: assignment.worker.code
          } : null,
          pitak: assignment.pitak ? {
            id: assignment.pitak.id,
            name: assignment.pitak.name,
            code: assignment.pitak.code,
            location: assignment.pitak.location
          } : null,
          notes: assignment.notes ? 
            (assignment.notes.length > 100 
              ? assignment.notes.substring(0, 100) + '...' 
              : assignment.notes)
            : null
        };
      })
    };

    // Get search suggestions
    const suggestions = [];
    
    // Worker suggestions
    const workerRepo = AppDataSource.getRepository(Worker);
    const workerSuggestions = await workerRepo
      .createQueryBuilder("worker")
      .where("worker.name LIKE :searchTerm", { searchTerm })
      .orWhere("worker.code LIKE :searchTerm", { searchTerm })
      .take(5)
      .getMany();
    
    if (workerSuggestions.length > 0) {
      suggestions.push({
        type: "workers",
        message: `Found ${workerSuggestions.length} workers matching "${query}"`,
        data: workerSuggestions.map((/** @type {{ id: any; name: any; code: any; }} */ w) => ({
          id: w.id,
          name: w.name,
          code: w.code
        }))
      });
    }

    // Pitak suggestions
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const pitakSuggestions = await pitakRepo
      .createQueryBuilder("pitak")
      .where("pitak.name LIKE :searchTerm", { searchTerm })
      .orWhere("pitak.code LIKE :searchTerm", { searchTerm })
      .orWhere("pitak.location LIKE :searchTerm", { searchTerm })
      .take(5)
      .getMany();
    
    if (pitakSuggestions.length > 0) {
      suggestions.push({
        type: "pitaks",
        message: `Found ${pitakSuggestions.length} pitaks matching "${query}"`,
        data: pitakSuggestions.map((/** @type {{ id: any; name: any; code: any; location: any; }} */ p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          location: p.location
        }))
      });
    }

    return {
      status: true,
      message: `Found ${searchResults.total} assignments matching "${query}"`,
      data: {
        results: searchResults,
        suggestions,
        searchTerm: query
      }
    };

  } catch (error) {
    console.error("Error searching assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Search failed: ${error.message}`,
      data: null
    };
  }
};