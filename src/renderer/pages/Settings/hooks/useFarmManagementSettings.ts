import { useState, useEffect, useCallback } from "react";
import systemConfigAPI, { 
  type FarmSessionSettings, 
  type FarmBukidSettings, 
  type FarmPitakSettings,
  type FarmAssignmentSettings,
  type FarmPaymentSettings,
  type FarmDebtSettings,
  type FarmAuditSettings
} from "../../../apis/system_config";
import { showError, showSuccess } from "../../../utils/notification";

interface FarmManagementSettings {
  farm_session: FarmSessionSettings;
  farm_bukid: FarmBukidSettings;
  farm_pitak: FarmPitakSettings;
  farm_assignment: FarmAssignmentSettings;
  farm_payment: FarmPaymentSettings;
  farm_debt: FarmDebtSettings;
  farm_audit: FarmAuditSettings;
}

interface UseFarmManagementSettingsReturn {
  settings: FarmManagementSettings | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<FarmManagementSettings>) => Promise<void>;
  updateFormSettings: (category: keyof FarmManagementSettings, newSettings: any) => void;
  resetForm: () => void;
  hasChanges: boolean;
}

export const useFarmManagementSettings = (): UseFarmManagementSettingsReturn => {
  const [settings, setSettings] = useState<FarmManagementSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<FarmManagementSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all farm settings using grouped config
      const response = await systemConfigAPI.getGroupedConfig();

      if (response.status && response.data?.grouped_settings) {
        const grouped = response.data.grouped_settings;
        const farmSettings = {
          farm_session: grouped.farm_session || {},
          farm_bukid: grouped.farm_bukid || {},
          farm_pitak: grouped.farm_pitak || {},
          farm_assignment: grouped.farm_assignment || {},
          farm_payment: grouped.farm_payment || {},
          farm_debt: grouped.farm_debt || {},
          farm_audit: grouped.farm_audit || {},
        };

        setSettings(farmSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(farmSettings)));
      } else {
        throw new Error(response.message || "Failed to fetch farm settings");
      }
    } catch (err: any) {
      console.error("Error fetching farm settings:", err);
      setError(err.message || "An error occurred while fetching settings");
      
      // Set default settings even if fetch fails
      const defaultSettings = {
        farm_session: {},
        farm_bukid: {},
        farm_pitak: {},
        farm_assignment: {},
        farm_payment: {},
        farm_debt: {},
        farm_audit: {},
      };
      
      setSettings(defaultSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(defaultSettings)));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFormSettings = useCallback((category: keyof FarmManagementSettings, newSettings: any) => {
    setSettings(prev => ({
      ...prev!,
      [category]: { ...prev![category], ...newSettings }
    }));
  }, []);

  const updateSettings = async (newSettings: Partial<FarmManagementSettings>) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(null);

      console.log("Updating farm settings:", newSettings);

      // Update settings using updateGroupedConfig
      const response = await systemConfigAPI.updateGroupedConfig(newSettings);

      if (response.status) {
        // Update both settings and originalSettings
        setSettings(prev => ({ ...prev!, ...newSettings }));
        setOriginalSettings(prev => ({ ...prev!, ...newSettings }));
        setSaveSuccess(true);
        
        showSuccess('Farm settings saved successfully!');
        
        // Refresh settings to get updated values
        setTimeout(() => fetchSettings(), 500);
      } else {
        throw new Error(response.message || "Failed to update settings");
      }
    } catch (err: any) {
      console.error("Error updating farm settings:", err);
      setSaveError(err.message || "An error occurred while saving settings");
      showError('Failed to save farm settings');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (originalSettings) {
      setSettings(originalSettings);
    }
    setSaveSuccess(false);
    setSaveError(null);
    showSuccess('Settings reset to original values');
  };

  const hasChanges = useCallback(() => {
    if (!settings || !originalSettings) {
      return false;
    }
    
    const settingsStr = JSON.stringify(settings);
    const originalStr = JSON.stringify(originalSettings);
    
    return settingsStr !== originalStr;
  }, [settings, originalSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    saving,
    saveSuccess,
    saveError,
    fetchSettings,
    updateSettings,
    updateFormSettings,
    resetForm,
    hasChanges: hasChanges(),
  };
};