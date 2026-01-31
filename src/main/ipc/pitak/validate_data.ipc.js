// src/ipc/pitak/validate_data.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Bukid = require("../../../entities/Bukid");
const { AppDataSource } = require("../../db/dataSource");
const { Not } = require("typeorm");

module.exports = async (
  /** @type {{ bukidId: any; location: any; totalLuwang: any; status: any; excludePitakId?: null | undefined; }} */ params,
) => {
  try {
    const {
      bukidId,
      location,
      totalLuwang,
      status,
      excludePitakId = null, // For update validation
    } = params;

    const errors = [];
    const warnings = [];
    const validStatuses = ["active", "inactive", "completed"];

    // Validate bukidId
    if (bukidId === undefined) {
      errors.push("bukidId is required");
    } else if (bukidId !== null) {
      const bukidRepo = AppDataSource.getRepository(Bukid);
      const bukid = await bukidRepo.findOne({ where: { id: bukidId } });
      if (!bukid) {
        errors.push(`Bukid with ID ${bukidId} not found`);
      }
    }

    // Validate location (if provided)
    if (location !== undefined && location !== null) {
      if (typeof location !== "string") {
        errors.push("location must be a string");
      } else if (location.length > 255) {
        errors.push("location must be less than 255 characters");
      }

      // Check for duplicate location in same bukid
      if (bukidId && location) {
        const pitakRepo = AppDataSource.getRepository(Pitak);
        const whereClause = { bukidId, location };

        if (excludePitakId) {
          // @ts-ignore
          whereClause.id = Not(excludePitakId);
        }

        const existing = await pitakRepo.findOne({ where: whereClause });
        if (existing) {
          errors.push(
            `A pitak already exists at location "${location}" in the same bukid`,
          );
        }
      }
    }

    // Validate totalLuwang
    if (totalLuwang !== undefined) {
      const totalLuwangNum = parseFloat(totalLuwang);
      if (isNaN(totalLuwangNum)) {
        errors.push("totalLuwang must be a valid number");
      } else if (totalLuwangNum < 0) {
        errors.push("totalLuwang cannot be negative");
      } else if (totalLuwangNum > 999.99) {
        errors.push("totalLuwang cannot exceed 999.99");
      } else {
        // Check if totalLuwang is reasonable
        if (totalLuwangNum > 100) {
          warnings.push("totalLuwang seems unusually high");
        }
      }
    }

    // Validate status
    if (status !== undefined && status !== null) {
      if (!validStatuses.includes(status)) {
        errors.push(`status must be one of: ${validStatuses.join(", ")}`);
      }
    }

    // Additional business rule validations
    if (bukidId && location && totalLuwang !== undefined) {
      // Check if location matches pattern if needed
      const locationPattern = /^[A-Za-z0-9\s\-_,.#]+$/;
      if (location && !locationPattern.test(location)) {
        warnings.push(
          "location contains special characters that may be invalid",
        );
      }

      // Check totalLuwang against bukid's existing pitaks
      const pitakRepo = AppDataSource.getRepository(Pitak);
      const bukidPitaks = await pitakRepo.find({
        // @ts-ignore
        where: { bukidId },
        select: ["totalLuwang"],
      });

      // @ts-ignore
      const totalBukidLuWang = bukidPitaks.reduce(
        (
          /** @type {number} */ sum,
          /** @type {{ totalLuwang: string; }} */ p,
        ) => sum + parseFloat(p.totalLuwang),
        0,
      );

      // @ts-ignore
      if (totalLuwangNum > 0 && totalLuwangNum > totalBukidLuWang * 2) {
        warnings.push(
          "totalLuwang is significantly higher than other pitaks in this bukid",
        );
      }
    }

    const isValid = errors.length === 0;

    return {
      status: isValid,
      message: isValid ? "Data is valid" : "Data validation failed",
      data: {
        isValid,
        errors,
        warnings,
        fields: {
          bukidId: bukidId !== undefined ? "provided" : "missing",
          location: location !== undefined ? "provided" : "missing",
          totalLuwang: totalLuwang !== undefined ? "provided" : "missing",
          status: status !== undefined ? "provided" : "missing",
        },
      },
    };
  } catch (error) {
    console.error("Error validating pitak data:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Validation error: ${error.message}`,
      data: null,
    };
  }
};
