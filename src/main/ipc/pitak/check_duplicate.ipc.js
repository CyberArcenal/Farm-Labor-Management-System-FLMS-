// src/ipc/pitak/check_duplicate.ipc.js
//@ts-check

const { Not } = require("typeorm");
const Pitak = require("../../../entities/Pitak");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async (/** @type {{ bukidId: any; location: any; excludePitakId?: null | undefined; radiusKm?: null | undefined; _userId: any; }} */ params) => {
  try {
    // @ts-ignore
    // @ts-ignore
    const { bukidId, location, excludePitakId = null, radiusKm = null, _userId } = params;

    if (!bukidId) {
      return { status: false, message: "Bukid ID is required", data: null };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);

    const duplicates = {
      bukidId,
      location,
      exactMatches: [],
      similarMatches: [],
      nearbyMatches: [],
      hasDuplicates: false
    };

    // Check for exact location match in same bukid
    if (location) {
      const whereClause = { bukidId, location };
      if (excludePitakId) {
        // @ts-ignore
        whereClause.id = Not(excludePitakId);
      }

      const exactMatches = await pitakRepo.find({
        where: whereClause,
        relations: ['bukid']
      });

      if (exactMatches.length > 0) {
        // @ts-ignore
        duplicates.exactMatches = exactMatches.map((/** @type {{ id: any; location: any; totalLuwang: string; status: any; createdAt: any; }} */ p) => ({
          id: p.id,
          location: p.location,
          totalLuwang: parseFloat(p.totalLuwang),
          status: p.status,
          createdAt: p.createdAt
        }));
        duplicates.hasDuplicates = true;
      }

      // Check for similar locations (case-insensitive, partial match)
      const similarMatches = await pitakRepo
        .createQueryBuilder('pitak')
        .where('pitak.bukidId = :bukidId', { bukidId })
        .andWhere('LOWER(pitak.location) LIKE LOWER(:location)', { 
          location: `%${location}%` 
        })
        .andWhere(excludePitakId ? 'pitak.id != :excludePitakId' : '1=1', { excludePitakId })
        .getMany();

      if (similarMatches.length > 0) {
        // @ts-ignore
        duplicates.similarMatches = similarMatches
          .filter((/** @type {{ id: any; }} */ p) => !exactMatches.some((em) => em.id === p.id))
          .map((p) => ({
            id: p.id,
            location: p.location,
            // @ts-ignore
            totalLuwang: parseFloat(p.totalLuwang),
            status: p.status,
            // @ts-ignore
            similarity: calculateSimilarity(location, p.location),
            createdAt: p.createdAt
          }));
        
        if (duplicates.similarMatches.length > 0) {
          duplicates.hasDuplicates = true;
        }
      }
    }

    // If radius is provided, check for nearby pitaks (simplified version)
    if (radiusKm && location) {
      // Note: This is a simplified version. In a real app, you'd use geospatial queries
      const allPitaksInBukid = await pitakRepo.find({
        // @ts-ignore
        where: { bukidId },
        relations: ['bukid']
      });

      // Filter by approximate distance (simulated)
      const nearby = allPitaksInBukid.filter((/** @type {{ id: any; location: any; }} */ p) => {
        if (p.id === excludePitakId) return false;
        if (!p.location) return false;
        
        // Simple string similarity for demo purposes
        // In production, use actual coordinates and distance calculation
        const similarity = calculateSimilarity(location, p.location);
        return similarity > 0.7; // 70% similar
      });

      if (nearby.length > 0) {
        // @ts-ignore
        duplicates.nearbyMatches = nearby.map((p) => ({
          id: p.id,
          location: p.location,
          // @ts-ignore
          totalLuwang: parseFloat(p.totalLuwang),
          status: p.status,
          approximateDistance: 'Similar location name', // In real app, calculate actual distance
          createdAt: p.createdAt
        }));
        duplicates.hasDuplicates = true;
      }
    }

    // Calculate overall duplicate risk score
    let riskScore = 0;
    let riskLevel = 'low';
    const reasons = [];

    if (duplicates.exactMatches.length > 0) {
      riskScore += 100;
      reasons.push(`Exact location match found (${duplicates.exactMatches.length})`);
    }

    if (duplicates.similarMatches.length > 0) {
      riskScore += duplicates.similarMatches.length * 20;
      reasons.push(`Similar location matches found (${duplicates.similarMatches.length})`);
    }

    if (duplicates.nearbyMatches.length > 0) {
      riskScore += duplicates.nearbyMatches.length * 10;
      reasons.push(`Nearby pitaks found (${duplicates.nearbyMatches.length})`);
    }

    // Determine risk level
    if (riskScore >= 100) {
      riskLevel = 'high';
    } else if (riskScore >= 50) {
      riskLevel = 'medium';
    } else if (riskScore >= 20) {
      riskLevel = 'low';
    } else {
      riskLevel = 'none';
    }

    // @ts-ignore
    duplicates.riskAssessment = {
      score: riskScore,
      level: riskLevel,
      reasons,
      recommendation: riskLevel === 'high' 
        ? 'Consider using a different location name' 
        : riskLevel === 'medium' 
          ? 'Verify this is not a duplicate' 
          : 'No significant duplicate risk'
    };

    return {
      status: true,
      message: duplicates.hasDuplicates 
        ? "Potential duplicates found" 
        : "No duplicates found",
      data: duplicates
    };

  } catch (error) {
    console.error("Error checking for duplicates:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to check duplicates: ${error.message}`,
      data: null
    };
  }
};

// Helper function to calculate string similarity (Levenshtein distance)
/**
 * @param {string} str1
 * @param {string} str2
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  // Simple similarity calculation
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  // Check if one contains the other
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }
  
  // Simple character overlap
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}