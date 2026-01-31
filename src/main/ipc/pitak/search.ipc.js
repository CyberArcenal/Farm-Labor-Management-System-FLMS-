// src/ipc/pitak/search.ipc
//@ts-check

const Pitak = require("../../../entities/Pitak");
const { AppDataSource } = require("../../db/dataSource");

// @ts-ignore
// @ts-ignore
module.exports = async (/** @type {{ trim: () => { (): any; new (): any; length: number; }; }} */ query, /** @type {any} */ userId) => {
  try {
    // @ts-ignore
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return {
        status: false,
        message: "Search query must be at least 2 characters",
        data: null
      };
    }

    // @ts-ignore
    const searchTerm = query.trim();
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    // Build search query
    const searchQuery = pitakRepo.createQueryBuilder('pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .where('pitak.location LIKE :term', { term: `%${searchTerm}%` })
      .orWhere('CAST(pitak.id AS CHAR) LIKE :term', { term: `%${searchTerm}%` })
      .orWhere('bukid.name LIKE :term', { term: `%${searchTerm}%` })
      .orWhere('pitak.notes LIKE :term', { term: `%${searchTerm}%` })
      .orderBy('pitak.location', 'ASC')
      .take(50); // Limit results

    const pitaks = await searchQuery.getMany();

    // Group results by match type for better organization
    const results = {
      exactMatches: [],
      locationMatches: [],
      bukidMatches: [],
      otherMatches: []
    };

    pitaks.forEach((pitak) => {
      const result = {
        id: pitak.id,
        location: pitak.location,
        // @ts-ignore
        totalLuwang: parseFloat(pitak.totalLuwang),
        status: pitak.status,
        // @ts-ignore
        bukid: pitak.bukid ? {
          // @ts-ignore
          id: pitak.bukid.id,
          // @ts-ignore
          name: pitak.bukid.name,
        } : null,
        matchType: [],
        matchScore: 0
      };

      // Calculate match score and type
      // @ts-ignore
      if (pitak.location && pitak.location.toLowerCase().includes(searchTerm.toLowerCase())) {
        // @ts-ignore
        result.matchType.push('location');
        // @ts-ignore
        result.matchScore += pitak.location.toLowerCase() === searchTerm.toLowerCase() ? 100 : 50;
        
        // @ts-ignore
        if (pitak.location.toLowerCase().startsWith(searchTerm.toLowerCase())) {
          result.matchScore += 20;
        }
      }

      // @ts-ignore
      if (pitak.bukid && pitak.bukid.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        // @ts-ignore
        result.matchType.push('bukid');
        result.matchScore += 30;
      }


      // @ts-ignore
      if (pitak.id.toString().includes(searchTerm)) {
        // @ts-ignore
        result.matchType.push('id');
        result.matchScore += 40;
      }

      // Add to appropriate category
      // @ts-ignore
      if (result.matchType.includes('location') && result.matchScore >= 70) {
        // @ts-ignore
        results.exactMatches.push(result);
      // @ts-ignore
      } else if (result.matchType.includes('location')) {
        // @ts-ignore
        results.locationMatches.push(result);
      // @ts-ignore
      } else if (result.matchType.includes('bukid')) {
        // @ts-ignore
        results.bukidMatches.push(result);
      // @ts-ignore
      } else {
        // @ts-ignore
        results.otherMatches.push(result);
      }
    });

    // Sort each category by match score
    Object.keys(results).forEach(category => {
      // @ts-ignore
      results[category].sort((/** @type {{ matchScore: number; }} */ a, /** @type {{ matchScore: number; }} */ b) => b.matchScore - a.matchScore);
    });

    // Calculate statistics
    const totalResults = Object.values(results).reduce((sum, category) => sum + category.length, 0);
    // @ts-ignore
    const statusCounts = pitaks.reduce((/** @type {{ [x: string]: any; }} */ counts, /** @type {{ status: string | number; }} */ pitak) => {
      counts[pitak.status] = (counts[pitak.status] || 0) + 1;
      return counts;
    }, {});

    // Get quick stats
    // @ts-ignore
    const totalLuWang = pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: string; }} */ p) => sum + parseFloat(p.totalLuwang), 0);
    // @ts-ignore
    const averageLuWang = pitaks.length > 0 ? totalLuWang / pitaks.length : 0;

    return {
      status: true,
      message: `Search completed. Found ${totalResults} results for "${searchTerm}"`,
      data: {
        query: searchTerm,
        results,
        statistics: {
          totalResults,
          statusCounts,
          // @ts-ignore
          totalLuWang: totalLuWang.toFixed(2),
          averageLuWang: averageLuWang.toFixed(2),
          // @ts-ignore
          byBukid: pitaks.reduce((/** @type {{ [x: string]: any; }} */ bukids, /** @type {{ bukid: { name: string | number; }; }} */ pitak) => {
            if (pitak.bukid) {
              bukids[pitak.bukid.name] = (bukids[pitak.bukid.name] || 0) + 1;
            }
            return bukids;
          }, {})
        },
        searchMetadata: {
          searchDate: new Date(),
          resultLimit: 50,
          actualResults: pitaks.length
        }
      }
    };

  } catch (error) {
    console.error("Error searching pitaks:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Search failed: ${error.message}`,
      data: null
    };
  }
};