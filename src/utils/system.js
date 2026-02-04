// systemUtils.js - SHORTENED & CLEANED VERSION
//@ts-check
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const path = require("path");
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const Decimal = require("decimal.js");
const { logger } = require("./logger");
const { AppDataSource } = require("../main/db/dataSource");
const { SystemSetting, SettingType } = require("../entities/systemSettings");

// ============================================================
// 📊 CORE GETTER FUNCTIONS
// ============================================================

/**
 * Get setting value
 * @param {string} key
 * @param {string} settingType
 */
async function getValue(key, settingType, defaultValue = null) {
  try {
    // console.log(
    //   `[DB DEBUG] getValue called for key: "${key}", type: "${settingType}"`
    // );
    if (typeof key !== "string" || !key.trim()) {
      logger.debug(`[DB] Invalid key: ${key}`);
      return defaultValue;
    }

    const repository = AppDataSource.getRepository(SystemSetting);
    if (!repository) {
      logger.debug(
        `[DB] Repository not available for key: ${key}, using default: ${defaultValue}`,
      );
      return defaultValue;
    }

    const query = repository
      .createQueryBuilder("setting")
      .where("setting.key = :key", { key: key.toLowerCase() })
      .andWhere("setting.is_deleted = :is_deleted", { is_deleted: false });

    if (settingType) {
      query.andWhere("setting.setting_type = :settingType", { settingType });
    }

    const setting = await query.getOne();

    // logger.debug(`[DB] Query result for key="${key}":`, {
    //   found: !!setting,
    //   value: setting ? setting.value : "NOT FOUND",
    //   keyInDB: setting ? setting.key : "N/A",
    // });

    if (!setting || setting.value === null || setting.value === undefined) {
      logger.debug(
        `[DB] Setting ${key} not found, using default: ${defaultValue}`,
      );
      return defaultValue;
    }

    return String(setting.value).trim();
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `[DB] Error fetching setting ${key}: ${error.message}, using default: ${defaultValue}`,
    );
    return defaultValue;
  }
}

/**
 * Get boolean setting
 * @param {string} key
 * @param {string} settingType
 */
async function getBool(key, settingType, defaultValue = false) {
  try {
    const raw = await getValue(
      key,
      settingType,
      // @ts-ignore
      defaultValue ? "true" : "false",
    );
    if (raw === null) {
      return defaultValue;
    }

    const normalized = String(raw).trim().toLowerCase();
    if (
      ["true", "1", "yes", "y", "on", "enabled", "active"].includes(normalized)
    ) {
      return true;
    }
    if (
      ["false", "0", "no", "n", "off", "disabled", "inactive"].includes(
        normalized,
      )
    ) {
      return false;
    }

    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      return num > 0;
    }

    logger.warn(
      `Unrecognized boolean for key='${key}': '${raw}' → using default=${defaultValue}`,
    );
    return defaultValue;
  } catch (error) {
    logger.error(
      // @ts-ignore
      `Error in getBool for ${key}: ${error.message}, using default: ${defaultValue}`,
    );
    return defaultValue;
  }
}

/**
 * Get integer setting
 * @param {string} key
 * @param {string} settingType
 */
async function getInt(key, settingType, defaultValue = 0) {
  try {
    // @ts-ignore
    const raw = await getValue(key, settingType, defaultValue.toString());
    if (raw === null) {
      return defaultValue;
    }

    const result = parseInt(String(raw).trim(), 10);
    return isNaN(result) ? defaultValue : result;
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `Invalid int for key='${key}': '${error.message}' – using default=${defaultValue}`,
    );
    return defaultValue;
  }
}

/**
 * Get array setting
 * @param {string} key
 * @param {string} settingType
 */
// @ts-ignore
async function getArray(key, settingType, defaultValue = []) {
  try {
    // @ts-ignore
    const raw = await getValue(key, settingType, JSON.stringify(defaultValue));
    if (raw === null) {
      return defaultValue;
    }

    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return defaultValue;
      }
    }

    return defaultValue;
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `Error getting array setting ${key}: ${error.message}, using default`,
    );
    return defaultValue;
  }
}

// ============================================================
// 🏢 GENERAL SETTINGS
// ============================================================

async function companyName() {
  // @ts-ignore
  return getValue("company_name", SettingType.GENERAL, "Farm Management");
}

async function timezone() {
  // @ts-ignore
  return getValue("default_timezone", SettingType.GENERAL, "Asia/Manila");
}

async function workStart() {
  // @ts-ignore
  return getValue("working_hours_start", SettingType.GENERAL, "09:00:00");
}

async function workEnd() {
  // @ts-ignore
  return getValue("working_hours_end", SettingType.GENERAL, "17:00:00");
}

async function language() {
  // @ts-ignore
  return getValue("language", SettingType.GENERAL, "en");
}

// ============================================================
// 🏞️ FARM SESSION SETTINGS
// ============================================================

async function farmSessionDefaultSessionId() {
  return getInt("default_session_id", SettingType.FARM_SESSION, 0);
}

async function farmSessionSeasonType() {
  // @ts-ignore
  return getValue("season_type", SettingType.FARM_SESSION, "tag-ulan");
}

async function farmSessionYear() {
  return getInt("year", SettingType.FARM_SESSION, new Date().getFullYear());
}

async function farmSessionStartDate() {
  // @ts-ignore
  return getValue("start_date", SettingType.FARM_SESSION, "");
}

async function farmSessionEndDate() {
  // @ts-ignore
  return getValue("end_date", SettingType.FARM_SESSION, "");
}

async function farmSessionStatus() {
  // @ts-ignore
  return getValue("status", SettingType.FARM_SESSION, "active");
}

async function farmSessionNotes() {
  // @ts-ignore
  return getValue("notes", SettingType.FARM_SESSION, "");
}

async function farmSessionRequireDefaultSession() {
  return getBool("require_default_session", SettingType.FARM_SESSION, true);
}

async function farmSessionAutoClosePrevious() {
  return getBool("auto_close_previous", SettingType.FARM_SESSION, true);
}

async function farmSessionAllowMultipleActiveSessions() {
  return getBool(
    "allow_multiple_active_sessions",
    SettingType.FARM_SESSION,
    false,
  );
}

// ============================================================
// 🌾 FARM BUKID SETTINGS
// ============================================================

async function farmBukidNameFormat() {
  // @ts-ignore
  return getValue("name_format", SettingType.FARM_BUKID, "Bukid_{number}");
}

async function farmBukidEnableLocationDescriptor() {
  return getBool("enable_location_descriptor", SettingType.FARM_BUKID, true);
}

async function farmBukidAutoDuplicatePerSession() {
  return getBool("auto_duplicate_per_session", SettingType.FARM_BUKID, true);
}

async function farmBukidDefaultStatus() {
  // @ts-ignore
  return getValue("default_status", SettingType.FARM_BUKID, "active");
}

async function farmBukidLocationRequired() {
  return getBool("location_required", SettingType.FARM_BUKID, true);
}

async function farmBukidAreaUnit() {
  // @ts-ignore
  return getValue("area_unit", SettingType.FARM_BUKID, "hectares");
}

async function farmBukidMaxBukidPerSession() {
  return getInt("max_bukid_per_session", SettingType.FARM_BUKID, 10);
}

async function farmBukidAutoGenerateCode() {
  return getBool("auto_generate_code", SettingType.FARM_BUKID, true);
}

async function farmBukidCodePrefix() {
  // @ts-ignore
  return getValue("code_prefix", SettingType.FARM_BUKID, "BKD");
}

// ============================================================
// 📍 FARM PITAK SETTINGS
// ============================================================

async function farmPitakDefaultTotalLuwangCapacity() {
  return getInt("default_total_luwang_capacity", SettingType.FARM_PITAK, 100);
}

async function farmPitakLocationFormat() {
  // @ts-ignore
  return getValue("location_format", SettingType.FARM_PITAK, "Pitak_{number}");
}

async function farmPitakStatusOptions() {
  return getArray("status_options", SettingType.FARM_PITAK, [
    "active",
    "inactive",
    "completed",
  ]);
}

async function farmPitakAutoGeneratePitakIds() {
  return getBool("auto_generate_pitak_ids", SettingType.FARM_PITAK, true);
}

async function farmPitakIdPrefix() {
  // @ts-ignore
  return getValue("id_prefix", SettingType.FARM_PITAK, "PTK");
}

async function farmPitakMinCapacity() {
  return getInt("min_capacity", SettingType.FARM_PITAK, 1);
}

async function farmPitakMaxCapacity() {
  return getInt("max_capacity", SettingType.FARM_PITAK, 200);
}

async function farmPitakRequireLocation() {
  return getBool("require_location", SettingType.FARM_PITAK, true);
}

async function farmPitakPitakNumberFormat() {
  // @ts-ignore
  return getValue(
    "pitak_number_format",
    SettingType.FARM_PITAK,
    // @ts-ignore
    "{bukid_code}-{sequence}",
  );
}

// ============================================================
// 👨‍🌾 FARM ASSIGNMENT SETTINGS
// ============================================================

async function farmAssignmentDefaultLuwangPerWorker() {
  return getInt("default_luwang_per_worker", SettingType.FARM_ASSIGNMENT, 5);
}

async function farmAssignmentDateBehavior() {
  // @ts-ignore
  return getValue("date_behavior", SettingType.FARM_ASSIGNMENT, "system_date");
}

async function farmAssignmentStatusOptions() {
  return getArray("status_options", SettingType.FARM_ASSIGNMENT, [
    "active",
    "completed",
    "cancelled",
  ]);
}

async function farmAssignmentEnableNotesRemarks() {
  return getBool("enable_notes_remarks", SettingType.FARM_ASSIGNMENT, true);
}

async function farmAssignmentAutoAssignBukid() {
  return getBool("auto_assign_bukid", SettingType.FARM_ASSIGNMENT, true);
}

async function farmAssignmentAssignmentDurationDays() {
  return getInt("assignment_duration_days", SettingType.FARM_ASSIGNMENT, 30);
}

async function farmAssignmentAllowReassignment() {
  return getBool("allow_reassignment", SettingType.FARM_ASSIGNMENT, true);
}

async function farmAssignmentMaxWorkersPerPitak() {
  return getInt("max_workers_per_pitak", SettingType.FARM_ASSIGNMENT, 10);
}

async function farmAssignmentRequireAssignmentDate() {
  return getBool("require_assignment_date", SettingType.FARM_ASSIGNMENT, true);
}

// ============================================================
// 💰 FARM PAYMENT SETTINGS
// ============================================================

async function farmPaymentDefaultWageMultiplier() {
  // @ts-ignore
  return getValue("default_wage_multiplier", SettingType.FARM_PAYMENT, "1.0");
}

async function farmPaymentDeductionRules() {
  // @ts-ignore
  return getValue("deduction_rules", SettingType.FARM_PAYMENT, "manual");
}

async function farmPaymentOtherDeductionsConfig() {
  // @ts-ignore
  return getValue("other_deductions_config", SettingType.FARM_PAYMENT, "{}");
}

async function farmPaymentPaymentMethods() {
  return getArray("payment_methods", SettingType.FARM_PAYMENT, [
    "cash",
    "gcash",
  ]);
}

async function farmPaymentRequireReferenceNumber() {
  return getBool("require_reference_number", SettingType.FARM_PAYMENT, false);
}

async function farmPaymentStatusOptions() {
  return getArray("status_options", SettingType.FARM_PAYMENT, [
    "pending",
    "processing",
    "completed",
    "cancelled",
    "partially_paid",
  ]);
}

async function farmPaymentPaymentTermsDays() {
  return getInt("payment_terms_days", SettingType.FARM_PAYMENT, 15);
}

async function farmPaymentAutoCalculateTotal() {
  return getBool("auto_calculate_total", SettingType.FARM_PAYMENT, true);
}

async function farmPaymentTaxPercentage() {
  // @ts-ignore
  return getValue("tax_percentage", SettingType.FARM_PAYMENT, "0");
}

async function farmPaymentRequirePaymentDate() {
  return getBool("require_payment_date", SettingType.FARM_PAYMENT, true);
}

// ============================================================
// 💳 FARM DEBT SETTINGS
// ============================================================

async function farmDebtDefaultInterestRate() {
  // @ts-ignore
  return getValue("default_interest_rate", SettingType.FARM_DEBT, "5");
}

async function farmDebtPaymentTermDays() {
  return getInt("payment_term_days", SettingType.FARM_DEBT, 30);
}

async function farmDebtGracePeriodDays() {
  return getInt("grace_period_days", SettingType.FARM_DEBT, 7);
}

async function farmDebtCarryOverToNextSession() {
  return getBool("carry_over_to_next_session", SettingType.FARM_DEBT, true);
}

async function farmDebtStatusOptions() {
  return getArray("status_options", SettingType.FARM_DEBT, [
    "pending",
    "partially_paid",
    "paid",
    "cancelled",
    "overdue",
  ]);
}

async function farmDebtInterestCalculationMethod() {
  // @ts-ignore
  return getValue(
    "interest_calculation_method",
    SettingType.FARM_DEBT,
    // @ts-ignore
    "simple",
  );
}

async function farmDebtCompoundFrequency() {
  // @ts-ignore
  return getValue("compound_frequency", SettingType.FARM_DEBT, "monthly");
}

async function farmDebtMaxDebtAmount() {
  // @ts-ignore
  return getValue("max_debt_amount", SettingType.FARM_DEBT, "10000");
}

async function farmDebtRequireDebtReason() {
  return getBool("require_debt_reason", SettingType.FARM_DEBT, false);
}

async function farmDebtAutoApplyInterest() {
  return getBool("auto_apply_interest", SettingType.FARM_DEBT, false);
}

// ============================================================
// 📝 FARM AUDIT SETTINGS
// ============================================================

async function farmAuditLogActionsEnabled() {
  return getBool("log_actions_enabled", SettingType.FARM_AUDIT, true);
}

async function farmAuditTrackEntityId() {
  return getBool("track_entity_id", SettingType.FARM_AUDIT, true);
}

async function farmAuditCaptureIpAddress() {
  return getBool("capture_ip_address", SettingType.FARM_AUDIT, false);
}

async function farmAuditCaptureUserAgent() {
  return getBool("capture_user_agent", SettingType.FARM_AUDIT, false);
}

async function farmAuditTieToSession() {
  return getBool("tie_to_session", SettingType.FARM_AUDIT, true);
}

async function farmAuditAuditRetentionDays() {
  return getInt("audit_retention_days", SettingType.FARM_AUDIT, 365);
}

async function farmAuditLogEvents() {
  return getArray("log_events", SettingType.FARM_AUDIT, [
    "create",
    "update",
    "delete",
  ]);
}

async function farmAuditEnableRealTimeLogging() {
  return getBool("enable_real_time_logging", SettingType.FARM_AUDIT, false);
}

async function farmAuditNotifyOnCriticalEvents() {
  return getBool("notify_on_critical_events", SettingType.FARM_AUDIT, false);
}

async function farmAuditCriticalEvents() {
  return getArray("critical_events", SettingType.FARM_AUDIT, [
    "data_deletion",
    "system_failure",
  ]);
}

/**
 * Kunin ang rate per luwang mula sa settings
 * @returns {Promise<number>}
 */
async function farmRatePerLuwang() {
  // @ts-ignore
  const value = await getValue(
    "rate_per_luwang",
    SettingType.FARM_PAYMENT,
    // @ts-ignore
    "230.00",
  );
  // @ts-ignore
  const rate = parseFloat(value);

  if (isNaN(rate)) {
    throw new Error(
      "Invalid rate_per_luwang setting. Please check system settings.",
    );
  }

  return rate;
}

async function getDebtLimit() {
  // @ts-ignore
  const value = await getValue(
    "debt_limit",
    SettingType.FARM_PAYMENT,
    // @ts-ignore
    "10000.00",
  );
  // @ts-ignore
  const limit = parseFloat(value);

  if (isNaN(limit)) {
    throw new Error("Invalid debt limit. Please check system settings.");
  }

  return limit;
}

/**
 * Debt allocation strategy setting
 * @returns {Promise<"equal"|"proportional"|"auto">}
 */
async function farmDebtAllocationStrategy() {
  // @ts-ignore
  const value = await getValue(
    "debt_allocation_strategy",
    SettingType.FARM_PAYMENT,
    // @ts-ignore
    "auto",
  );

  const allowed = ["equal", "proportional", "auto"];
  // @ts-ignore
  if (!allowed.includes(value)) {
    throw new Error(
      `Invalid debt_allocation_strategy setting "${value}". Allowed values: ${allowed.join(", ")}`,
    );
  }

  // @ts-ignore
  return value;
}

// ============================================================
// 🎯 HELPER FUNCTIONS
// ============================================================

/**
 * Get grouped farm settings
 */
async function getFarmSettingsGrouped() {
  try {
    const settings = {};

    // Collect all settings by category
    for (const category of Object.values(SettingType).filter((t) =>
      t.startsWith("farm_"),
    )) {
      // @ts-ignore
      settings[category] = {};
      const repository = AppDataSource.getRepository(SystemSetting);
      const categorySettings = await repository.find({
        where: {
          setting_type: category,
          is_deleted: false,
        },
      });

      for (const setting of categorySettings) {
        // @ts-ignore
        settings[category][setting.key] = setting.value;
      }
    }

    return settings;
  } catch (error) {
    // @ts-ignore
    logger.error(`Error getting grouped farm settings: ${error.message}`);
    return {};
  }
}

/**
 * Get specific farm setting with proper type conversion
 * @param {string} category
 * @param {string} key
 */
async function getFarmSetting(category, key, defaultValue = null) {
  try {
    // First try to get it from the specific category
    const value = await getValue(key, category, defaultValue);

    // If not found, try to find it in any farm category
    if (value === defaultValue) {
      const repository = AppDataSource.getRepository(SystemSetting);
      const setting = await repository.findOne({
        where: {
          key: key.toLowerCase(),
          setting_type: SettingType.FARM_SESSION, // Default to farm_session if not specified
          is_deleted: false,
        },
      });

      if (setting) {
        return String(setting.value).trim();
      }
    }

    return value;
  } catch (error) {
    // @ts-ignore
    logger.error(
      // @ts-ignore
      `Error getting farm setting ${category}.${key}: ${error.message}`,
    );
    return defaultValue;
  }
}

async function getDefaultInterestRate() {
  // fallback = "0" para walang interest kapag walang setting
  // @ts-ignore
  const value = await getValue(
    "default_interest_rate",
    SettingType.FARM_PAYMENT,
    // @ts-ignore
    "0",
  );
  // @ts-ignore
  const intRate = parseInt(value, 10);

  if (isNaN(intRate)) {
    throw new Error(
      "Invalid default interest rate. Please check system settings.",
    );
  }

  // convert to decimal for computation
  return intRate / 100;
}

// ============================================================
// 📤 EXPORT ALL FUNCTIONS
// ============================================================

module.exports = {
  farmDebtAllocationStrategy,
  getDefaultInterestRate,
  farmRatePerLuwang,
  getDebtLimit,
  // Core getters
  getValue,
  getBool,
  getInt,
  getArray,

  // General settings
  companyName,
  timezone,
  workStart,
  workEnd,
  language,

  // Farm Session Settings
  farmSessionDefaultSessionId,
  farmSessionSeasonType,
  farmSessionYear,
  farmSessionStartDate,
  farmSessionEndDate,
  farmSessionStatus,
  farmSessionNotes,
  farmSessionRequireDefaultSession,
  farmSessionAutoClosePrevious,
  farmSessionAllowMultipleActiveSessions,

  // Farm Bukid Settings
  farmBukidNameFormat,
  farmBukidEnableLocationDescriptor,
  farmBukidAutoDuplicatePerSession,
  farmBukidDefaultStatus,
  farmBukidLocationRequired,
  farmBukidAreaUnit,
  farmBukidMaxBukidPerSession,
  farmBukidAutoGenerateCode,
  farmBukidCodePrefix,

  // Farm Pitak Settings
  farmPitakDefaultTotalLuwangCapacity,
  farmPitakLocationFormat,
  farmPitakStatusOptions,
  farmPitakAutoGeneratePitakIds,
  farmPitakIdPrefix,
  farmPitakMinCapacity,
  farmPitakMaxCapacity,
  farmPitakRequireLocation,
  farmPitakPitakNumberFormat,

  // Farm Assignment Settings
  farmAssignmentDefaultLuwangPerWorker,
  farmAssignmentDateBehavior,
  farmAssignmentStatusOptions,
  farmAssignmentEnableNotesRemarks,
  farmAssignmentAutoAssignBukid,
  farmAssignmentAssignmentDurationDays,
  farmAssignmentAllowReassignment,
  farmAssignmentMaxWorkersPerPitak,
  farmAssignmentRequireAssignmentDate,

  // Farm Payment Settings
  farmPaymentDefaultWageMultiplier,
  farmPaymentDeductionRules,
  farmPaymentOtherDeductionsConfig,
  farmPaymentPaymentMethods,
  farmPaymentRequireReferenceNumber,
  farmPaymentStatusOptions,
  farmPaymentPaymentTermsDays,
  farmPaymentAutoCalculateTotal,
  farmPaymentTaxPercentage,
  farmPaymentRequirePaymentDate,

  // Farm Debt Settings
  farmDebtDefaultInterestRate,
  farmDebtPaymentTermDays,
  farmDebtGracePeriodDays,
  farmDebtCarryOverToNextSession,
  farmDebtStatusOptions,
  farmDebtInterestCalculationMethod,
  farmDebtCompoundFrequency,
  farmDebtMaxDebtAmount,
  farmDebtRequireDebtReason,
  farmDebtAutoApplyInterest,

  // Farm Audit Settings
  farmAuditLogActionsEnabled,
  farmAuditTrackEntityId,
  farmAuditCaptureIpAddress,
  farmAuditCaptureUserAgent,
  farmAuditTieToSession,
  farmAuditAuditRetentionDays,
  farmAuditLogEvents,
  farmAuditEnableRealTimeLogging,
  farmAuditNotifyOnCriticalEvents,
  farmAuditCriticalEvents,

  // Helper functions
  getFarmSettingsGrouped,
  getFarmSetting,
};
