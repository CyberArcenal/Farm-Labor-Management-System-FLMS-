// Farm Management System Configuration API

// 📊 Farm Setting Types
export const SettingType = {
  FARM_SESSION: "farm_session",
  FARM_BUKID: "farm_bukid",
  FARM_PITAK: "farm_pitak",
  FARM_ASSIGNMENT: "farm_assignment",
  FARM_PAYMENT: "farm_payment",
  FARM_DEBT: "farm_debt",
  FARM_AUDIT: "farm_audit",
} as const;

export type SettingType = (typeof SettingType)[keyof typeof SettingType];

export interface SystemSettingData {
  id: number;
  key: string;
  value: any;
  setting_type: SettingType;
  description?: string;
  isPublic: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedSettingsData {
  settings: SystemSettingData[];
  grouped_settings: {
    farm_session: FarmSessionSettings;
    farm_bukid: FarmBukidSettings;
    farm_pitak: FarmPitakSettings;
    farm_assignment: FarmAssignmentSettings;
    farm_payment: FarmPaymentSettings;
    farm_debt: FarmDebtSettings;
    farm_audit: FarmAuditSettings;
  };
}

// 1. FARM SESSION SETTINGS
export interface FarmSessionSettings {
  default_session_id?: number;
  season_type?: "tag-ulan" | "tag-araw" | "custom";
  year?: number;
  start_date?: string;
  end_date?: string;
  status?: "active" | "closed" | "archived";
  notes?: string;
  require_default_session?: boolean;
  auto_close_previous?: boolean;
  allow_multiple_active_sessions?: boolean;
}

// 2. FARM BUKID SETTINGS
export interface FarmBukidSettings {
  name_format?: string;
  enable_location_descriptor?: boolean;
  auto_duplicate_per_session?: boolean;
  default_status?: "active" | "inactive";
  location_required?: boolean;
  area_unit?: string; // hectares, acres, etc.
  max_bukid_per_session?: number;
  auto_generate_code?: boolean;
  code_prefix?: string;
}

// 3. FARM PITAK SETTINGS
export interface FarmPitakSettings {
  default_total_luwang_capacity?: number;
  location_format?: string;
  status_options?: string[]; // ['active', 'inactive', 'completed']
  auto_generate_pitak_ids?: boolean;
  id_prefix?: string;
  min_capacity?: number;
  max_capacity?: number;
  require_location?: boolean;
  pitak_number_format?: string;
}

// 4. FARM ASSIGNMENT SETTINGS
export interface FarmAssignmentSettings {
  default_luwang_per_worker?: number;
  date_behavior?: "system_date" | "manual_entry";
  status_options?: string[]; // ['active', 'completed', 'cancelled']
  enable_notes_remarks?: boolean;
  auto_assign_bukid?: boolean;
  assignment_duration_days?: number;
  allow_reassignment?: boolean;
  max_workers_per_pitak?: number;
  require_assignment_date?: boolean;
}

// 5. FARM PAYMENT SETTINGS
export interface FarmPaymentSettings {
  default_wage_multiplier?: number;
  deduction_rules?: "manual" | "auto_debt_deduction";
  other_deductions_config?: string; // JSON string for breakdown
  payment_methods?: string[]; // ['cash', 'gcash', 'bank', 'check']
  require_reference_number?: boolean;
  status_options?: string[]; // ['pending', 'processing', 'completed', 'cancelled', 'partially_paid']
  payment_terms_days?: number;
  auto_calculate_total?: boolean;
  tax_percentage?: number;
  require_payment_date?: boolean;
}

// 6. FARM DEBT SETTINGS
export interface FarmDebtSettings {
  default_interest_rate?: number;
  payment_term_days?: number;
  grace_period_days?: number;
  carry_over_to_next_session?: boolean;
  status_options?: string[]; // ['pending', 'partially_paid', 'paid', 'cancelled', 'overdue']
  interest_calculation_method?: "simple" | "compound";
  compound_frequency?: "daily" | "weekly" | "monthly";
  max_debt_amount?: number;
  require_debt_reason?: boolean;
  auto_apply_interest?: boolean;
}

// 7. FARM AUDIT SETTINGS
export interface FarmAuditSettings {
  log_actions_enabled?: boolean;
  track_entity_id?: boolean;
  capture_ip_address?: boolean;
  capture_user_agent?: boolean;
  tie_to_session?: boolean;
  audit_retention_days?: number;
  log_events?: string[]; // ['create', 'update', 'delete', 'view', 'export']
  enable_real_time_logging?: boolean;
  notify_on_critical_events?: boolean;
  critical_events?: string[];
}

// 📊 API Responses
export interface SystemConfigResponse {
  status: boolean;
  message: string;
  data: GroupedSettingsData | null;
}

export interface SettingsListResponse {
  status: boolean;
  message: string;
  data: SystemSettingData[];
}

export interface SettingResponse {
  status: boolean;
  message: string;
  data: SystemSettingData | null;
}

export interface OperationResponse {
  status: boolean;
  message: string;
  data: {
    id?: number;
    key?: string;
    count?: number;
    [key: string]: any;
  } | null;
}

export interface SettingsStatsResponse {
  status: boolean;
  message: string;
  data: {
    total: number;
    by_type: Record<string, number>;
    public_count: number;
    private_count: number;
    timestamp: string;
  };
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: Array<{
    success: boolean;
    id?: number;
    key?: string;
    error?: string;
    action?: string;
  }>;
}

// 📝 Request Payloads
export interface CreateSettingData {
  key: string;
  value: any;
  setting_type: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingData {
  id: number;
  key?: string;
  value?: any;
  setting_type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface SetValueByKeyData {
  key: string;
  value: any;
  setting_type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface BulkUpdateData {
  settingsData: Array<{
    id?: number;
    key: string;
    value: any;
    setting_type: SettingType;
    description?: string;
    isPublic?: boolean;
  }>;
}
// 📌 Default Session Interface (pang-display sa frontend)
export interface DefaultSessionData {
  id: number;
  seasonType: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 📌 Response wrapper (same format as backend)
export interface DefaultSessionResponse {
  status: boolean;
  message: string;
  data: DefaultSessionData | null;
}
export interface UpdateCategorySettingsData {
  [category: string]: Record<string, any>;
}

// 🛠️ API Class
class SystemConfigAPI {
  // 🔧 Core Methods

  /**
   * Get all system configuration grouped by category
   */
  async getGroupedConfig(): Promise<SystemConfigResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getGroupedConfig",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch system configuration",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch system configuration");
    }
  }

  /** 🔑 Get default session data (pang-display sa frontend) */
  async getDefaultSessionData(): Promise<DefaultSessionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getDefaultSessionData",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch default session data",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch default session data");
    }
  }

  /**
   * Update multiple settings by category
   */

  async updateGroupedConfig(
    configData: UpdateCategorySettingsData,
  ): Promise<SystemConfigResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "updateGroupedConfig",
        params: { configData: JSON.stringify(configData) }, // Baguhin ito
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to update system configuration",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update system configuration");
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<SettingsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getAllSettings",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch all settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch all settings");
    }
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(
    key: string,
    settingType?: SettingType,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getSettingByKey",
        params: { key, settingType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch setting");
    }
  }

  /**
   * Create a new setting
   */
  async createSetting(
    settingData: CreateSettingData,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "createSetting",
        params: { settingData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create setting");
    }
  }

  /**
   * Update an existing setting
   */
  async updateSetting(
    id: number,
    settingData: UpdateSettingData,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "updateSetting",
        params: { id, settingData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update setting");
    }
  }

  /**
   * Delete a setting (soft delete)
   */
  async deleteSetting(id: number): Promise<OperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "deleteSetting",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete setting");
    }
  }

  /**
   * Get settings by type
   */
  async getByType(settingType: SettingType): Promise<SettingsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getByType",
        params: { settingType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch settings by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch settings by type");
    }
  }

  /**
   * Get value by key
   */
  async getValueByKey(
    key: string,
    defaultValue?: any,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getValueByKey",
        params: { key, defaultValue },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get value by key");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get value by key");
    }
  }

  /**
   * Set value by key (creates or updates)
   */
  async setValueByKey(
    key: string,
    value: any,
    options?: Partial<SetValueByKeyData>,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "setValueByKey",
        params: { key, value, options },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to set value by key");
    } catch (error: any) {
      throw new Error(error.message || "Failed to set value by key");
    }
  }

  /**
   * Bulk update multiple settings
   */
  async bulkUpdate(
    settingsData: BulkUpdateData["settingsData"],
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "bulkUpdate",
        params: { settingsData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update settings");
    }
  }

  /**
   * Bulk delete settings
   */
  async bulkDelete(ids: number[]): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "bulkDelete",
        params: { ids },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk delete settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk delete settings");
    }
  }

  /**
   * Get settings statistics
   */
  async getSettingsStats(): Promise<SettingsStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getSettingsStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get settings statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get settings statistics");
    }
  }

  // 🎯 Farm Management Category Methods

  /**
   * Get farm session settings
   */
  async getFarmSessionSettings(): Promise<FarmSessionSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_session) {
        return config.data.grouped_settings.farm_session;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm session settings:", error);
      return {};
    }
  }

  /**
   * Get farm bukid settings
   */
  async getFarmBukidSettings(): Promise<FarmBukidSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_bukid) {
        return config.data.grouped_settings.farm_bukid;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm bukid settings:", error);
      return {};
    }
  }

  /**
   * Get farm pitak settings
   */
  async getFarmPitakSettings(): Promise<FarmPitakSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_pitak) {
        return config.data.grouped_settings.farm_pitak;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm pitak settings:", error);
      return {};
    }
  }

  /**
   * Get farm assignment settings
   */
  async getFarmAssignmentSettings(): Promise<FarmAssignmentSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_assignment) {
        return config.data.grouped_settings.farm_assignment;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm assignment settings:", error);
      return {};
    }
  }

  /**
   * Get farm payment settings
   */
  async getFarmPaymentSettings(): Promise<FarmPaymentSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_payment) {
        return config.data.grouped_settings.farm_payment;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm payment settings:", error);
      return {};
    }
  }

  /**
   * Get farm debt settings
   */
  async getFarmDebtSettings(): Promise<FarmDebtSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_debt) {
        return config.data.grouped_settings.farm_debt;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm debt settings:", error);
      return {};
    }
  }

  /**
   * Get farm audit settings
   */
  async getFarmAuditSettings(): Promise<FarmAuditSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.farm_audit) {
        return config.data.grouped_settings.farm_audit;
      }
      return {};
    } catch (error) {
      console.error("Error getting farm audit settings:", error);
      return {};
    }
  }

  /**
   * Update farm session settings
   */
  async updateFarmSessionSettings(
    settings: Partial<FarmSessionSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_session", settings);
  }

  /**
   * Update farm bukid settings
   */
  async updateFarmBukidSettings(
    settings: Partial<FarmBukidSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_bukid", settings);
  }

  /**
   * Update farm pitak settings
   */
  async updateFarmPitakSettings(
    settings: Partial<FarmPitakSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_pitak", settings);
  }

  /**
   * Update farm assignment settings
   */
  async updateFarmAssignmentSettings(
    settings: Partial<FarmAssignmentSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_assignment", settings);
  }

  /**
   * Update farm payment settings
   */
  async updateFarmPaymentSettings(
    settings: Partial<FarmPaymentSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_payment", settings);
  }

  /**
   * Update farm debt settings
   */
  async updateFarmDebtSettings(
    settings: Partial<FarmDebtSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_debt", settings);
  }

  /**
   * Update farm audit settings
   */
  async updateFarmAuditSettings(
    settings: Partial<FarmAuditSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("farm_audit", settings);
  }

  /**
   * Update settings for a specific category
   */
  async updateCategorySettings(
    category: string,
    settings: Record<string, any>,
  ): Promise<SystemConfigResponse> {
    const configData = {
      [category]: settings,
    };
    return this.updateGroupedConfig(configData);
  }

  // 🔧 Utility Methods

  /**
   * Get all settings as a flat object
   */
  async getAllSettingsAsObject(): Promise<Record<string, any>> {
    try {
      const settings = await this.getAllSettings();
      const result: Record<string, any> = {};

      if (settings.data) {
        settings.data.forEach((setting) => {
          result[`${setting.setting_type}.${setting.key}`] = setting.value;
        });
      }

      return result;
    } catch (error) {
      console.error("Error getting all settings as object:", error);
      return {};
    }
  }

  /**
   * Get setting value by category and key
   */
  async getSetting(
    category: string,
    key: string,
    defaultValue?: any,
  ): Promise<any> {
    try {
      const fullKey = `${category}.${key}`;
      const settings = await this.getAllSettingsAsObject();
      return settings[fullKey] ?? defaultValue;
    } catch (error) {
      console.error(`Error getting setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set setting value by category and key
   */
  async setSetting(
    category: string,
    key: string,
    value: any,
    description?: string,
  ): Promise<SettingResponse> {
    const options = {
      setting_type: category as SettingType,
      description: description || `Setting for ${category}.${key}`,
      isPublic: false,
    };

    return this.setValueByKey(key, value, options);
  }

  /**
   * Check if a setting exists
   */
  async settingExists(
    key: string,
    settingType?: SettingType,
  ): Promise<boolean> {
    try {
      const response = await this.getSettingByKey(key, settingType);
      return response.status && response.data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get boolean setting value
   */
  async getBooleanSetting(
    category: string,
    key: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    try {
      const value = await this.getSetting(category, key, defaultValue);

      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
      }
      if (typeof value === "number") {
        return value === 1;
      }

      return defaultValue;
    } catch (error) {
      console.error(`Error getting boolean setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get numeric setting value
   */
  async getNumberSetting(
    category: string,
    key: string,
    defaultValue: number = 0,
  ): Promise<number> {
    try {
      const value = await this.getSetting(category, key, defaultValue);
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    } catch (error) {
      console.error(`Error getting number setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get string setting value
   */
  async getStringSetting(
    category: string,
    key: string,
    defaultValue: string = "",
  ): Promise<string> {
    try {
      const value = await this.getSetting(category, key, defaultValue);
      return String(value);
    } catch (error) {
      console.error(`Error getting string setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get array setting value
   */
  async getArraySetting(
    category: string,
    key: string,
    defaultValue: any[] = [],
  ): Promise<any[]> {
    try {
      const value = await this.getSetting(category, key, defaultValue);

      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return defaultValue;
        }
      }

      return defaultValue;
    } catch (error) {
      console.error(`Error getting array setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get object setting value
   */
  async getObjectSetting(
    category: string,
    key: string,
    defaultValue: object = {},
  ): Promise<object> {
    try {
      const value = await this.getSetting(category, key, defaultValue);

      if (typeof value === "object" && value !== null && !Array.isArray(value))
        return value;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            return parsed;
          }
        } catch {
          return defaultValue;
        }
      }

      return defaultValue;
    } catch (error) {
      console.error(`Error getting object setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Initialize default farm settings if they don't exist
   */
  async initializeDefaultSettings(): Promise<void> {
    try {
      const defaultSettings = [
        // Farm session defaults
        {
          key: "require_default_session",
          value: true,
          setting_type: SettingType.FARM_SESSION,
          description: "Require default session for all farm operations",
        },
        {
          key: "season_type",
          value: "tag-ulan",
          setting_type: SettingType.FARM_SESSION,
          description: "Default season type",
        },
        // Farm bukid defaults
        {
          key: "default_status",
          value: "active",
          setting_type: SettingType.FARM_BUKID,
          description: "Default bukid status",
        },
        {
          key: "auto_duplicate_per_session",
          value: true,
          setting_type: SettingType.FARM_BUKID,
          description: "Auto duplicate bukid per session",
        },
        // Farm pitak defaults
        {
          key: "default_total_luwang_capacity",
          value: 100,
          setting_type: SettingType.FARM_PITAK,
          description: "Default total luwang capacity per pitak",
        },
        // Farm assignment defaults
        {
          key: "default_luwang_per_worker",
          value: 5,
          setting_type: SettingType.FARM_ASSIGNMENT,
          description: "Default luwang count per worker",
        },
        // Farm payment defaults
        {
          key: "default_wage_multiplier",
          value: 1.0,
          setting_type: SettingType.FARM_PAYMENT,
          description: "Default wage multiplier",
        },
        {
          key: "payment_methods",
          value: JSON.stringify(["cash", "gcash"]),
          setting_type: SettingType.FARM_PAYMENT,
          description: "Available payment methods",
        },
        // Farm debt defaults
        {
          key: "default_interest_rate",
          value: 5,
          setting_type: SettingType.FARM_DEBT,
          description: "Default interest rate percentage",
        },
        {
          key: "carry_over_to_next_session",
          value: true,
          setting_type: SettingType.FARM_DEBT,
          description: "Carry over debt to next session",
        },
        // Farm audit defaults
        {
          key: "log_actions_enabled",
          value: true,
          setting_type: SettingType.FARM_AUDIT,
          description: "Enable logging of farm actions",
        },
        {
          key: "tie_to_session",
          value: true,
          setting_type: SettingType.FARM_AUDIT,
          description: "Tie audit logs to session",
        },
      ];

      for (const setting of defaultSettings) {
        const exists = await this.settingExists(
          setting.key,
          setting.setting_type,
        );
        if (!exists) {
          await this.createSetting({
            key: setting.key,
            value: setting.value,
            setting_type: setting.setting_type,
            description: setting.description,
            isPublic: false,
          });
        }
      }
    } catch (error) {
      console.error("Error initializing default settings:", error);
    }
  }

  /**
   * Export settings to JSON file
   */
  async exportSettingsToFile(): Promise<string> {
    try {
      const config = await this.getGroupedConfig();
      const jsonStr = JSON.stringify(config.data, null, 2);

      // In a real implementation, you would use the file system API
      // For now, we'll return the JSON string
      return jsonStr;
    } catch (error) {
      console.error("Error exporting settings:", error);
      throw error;
    }
  }

  /**
   * Import settings from JSON file
   */
  async importSettingsFromFile(
    jsonData: string,
  ): Promise<SystemConfigResponse> {
    try {
      const configData = JSON.parse(jsonData);
      return this.updateGroupedConfig(configData);
    } catch (error) {
      console.error("Error importing settings:", error);
      throw error;
    }
  }

  /**
   * Reset settings to default values
   */
  async resetToDefaults(): Promise<SystemConfigResponse> {
    try {
      // Clear all existing settings
      const allSettings = await this.getAllSettings();
      const ids = allSettings.data?.map((setting) => setting.id) || [];

      if (ids.length > 0) {
        await this.bulkDelete(ids);
      }

      // Initialize default settings
      await this.initializeDefaultSettings();

      // Return updated configuration
      return this.getGroupedConfig();
    } catch (error) {
      console.error("Error resetting settings to defaults:", error);
      throw error;
    }
  }

  /**
   * Validate farm settings configuration
   */
  async validateSettings(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const config = await this.getGroupedConfig();
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!config.data) {
        errors.push("No configuration data found");
        return { valid: false, errors, warnings };
      }

      const settings = config.data.settings || [];

      // Check for required farm settings
      const requiredSettings = [
        { category: "farm_session", key: "require_default_session" },
        { category: "farm_bukid", key: "default_status" },
        { category: "farm_pitak", key: "default_total_luwang_capacity" },
        { category: "farm_assignment", key: "default_luwang_per_worker" },
      ];

      for (const required of requiredSettings) {
        const exists = settings.some(
          (s) =>
            s.setting_type === required.category &&
            s.key === required.key &&
            !s.is_deleted,
        );

        if (!exists) {
          warnings.push(
            `Missing setting: ${required.category}.${required.key}`,
          );
        }
      }

      // Validate that default_session_id is set if required
      const requireDefaultSession = await this.getBooleanSetting(
        "farm_session",
        "require_default_session",
      );
      if (requireDefaultSession) {
        const defaultSessionId = await this.getNumberSetting(
          "farm_session",
          "default_session_id",
        );
        if (!defaultSessionId) {
          warnings.push("Default session ID is required but not set");
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error("Error validating settings:", error);
      return {
        valid: false,
        errors: [`Validation error: ${error}`],
        warnings: [],
      };
    }
  }

  /**
   * Get farm system health status
   */
  async getSystemHealth(): Promise<{
    settings_count: number;
    last_updated: string;
    has_errors: boolean;
    categories: string[];
  }> {
    try {
      const stats = await this.getSettingsStats();
      const config = await this.getGroupedConfig();

      // Get all settings to find the most recent update
      const allSettings = await this.getAllSettings();
      let lastUpdated = "";
      if (allSettings.data && allSettings.data.length > 0) {
        // Find the most recent updated_at timestamp
        const timestamps = allSettings.data
          .map((s) => s.updated_at || s.created_at || "")
          .filter((t) => t);
        if (timestamps.length > 0) {
          lastUpdated = timestamps.sort().reverse()[0];
        }
      }

      return {
        settings_count: stats.data?.total || 0,
        last_updated: lastUpdated || new Date().toISOString(),
        has_errors: false,
        categories: Object.values(SettingType),
      };
    } catch (error) {
      console.error("Error getting system health:", error);
      return {
        settings_count: 0,
        last_updated: new Date().toISOString(),
        has_errors: true,
        categories: [],
      };
    }
  }
}

const systemConfigAPI = new SystemConfigAPI();

export default systemConfigAPI;
