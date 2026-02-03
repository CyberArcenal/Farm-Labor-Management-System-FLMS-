// Complete Refactored PitakFormDialog.tsx with Traditional Measurement System
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  MapPin,
  TreePalm,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Calendar,
  Hash,
  FileText,
  LandPlot,
  Ruler,
  Grid3x3,
  Settings,
  Calculator,
} from "lucide-react";

// Import Traditional Measurement Components and Utilities
import { useMeasurementValidation } from "./hooks/useMeasurementValidation";
import ResultsDisplay from "./components/ResultDisplay";

// Types and APIs
import type { PitakData } from "../../../../apis/pitak";
import type { BukidData } from "../../../../apis/bukid";
import bukidAPI from "../../../../apis/bukid";
import pitakAPI from "../../../../apis/pitak";
import { showError, showSuccess } from "../../../../utils/notification";
import BukidSelect from "../../../../components/Selects/Bukid";
import AdvancedGeometryForm from "./components/AdvancedGeometryForm";
import ManualInputForm from "./components/ManualInputForm";
import MeasurementModeToggle from "./components/MeasurementModeToggle";
import { dialogs } from "../../../../utils/dialogs";

interface PitakFormDialogProps {
  id?: number;
  bukidId?: number;
  mode: "add" | "edit";
  onClose: () => void;
  onSuccess?: (pitak: PitakData) => void;
}

// Form data interface
interface FormData {
  bukidId: number | null;
  location: string;
  totalLuwang: number;
  areaSqm: number;
  status: "active" | "inactive" | "completed";
  notes: string;

  // Mode and advanced fields
  useAdvancedMode: boolean;
  layoutType: "square" | "rectangle" | "triangle" | "circle" | "";
  buholInputs: Record<string, number>;
  triangleMode?: "base_height" | "three_sides";
  measurementMethod: string;
}

// Calculation results
interface CalculationResults {
  areaSqm: number;
  totalLuwang: number;
  hectare?: number;
}

const PitakFormDialog: React.FC<PitakFormDialogProps> = ({
  id,
  bukidId,
  mode,
  onClose,
  onSuccess,
}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    bukidId: bukidId ? bukidId : null,
    location: "",
    totalLuwang: 0,
    areaSqm: 0,
    status: "active",
    notes: "",

    // Mode and advanced fields
    useAdvancedMode: false,
    layoutType: "",
    buholInputs: {},
    triangleMode: "base_height",
    measurementMethod: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bukids, setBukids] = useState<BukidData[]>([]);
  const [pitak, setPitak] = useState<PitakData | null>(null);
  const [calculationResults, setCalculationResults] =
    useState<CalculationResults>({
      areaSqm: 0,
      totalLuwang: 0,
    });

  // Initialize hooks
  const { validateShapeInputs, clearError, clearAllErrors } =
    useMeasurementValidation();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch bukids for dropdown
        const bukidResponse = await bukidAPI.getAll({ limit: 1000 });
        if (bukidResponse.status && bukidResponse.data?.bukids) {
          setBukids(bukidResponse.data.bukids);
        }

        // Fetch pitak data if in edit mode
        if (mode === "edit" && id) {
          const pitakId = id;
          const response = await pitakAPI.getPitakById(pitakId);

          if (response.status) {
            const pitakData = response.data;
            console.log(pitakData);
            setPitak(pitakData);

            // Parse existing data
            const formData = await parseExistingPitakData(pitakData);
            setFormData(formData);

            // Set initial calculation results
            setCalculationResults({
              areaSqm: pitakData.areaSqm || 0,
              totalLuwang: pitakData.totalLuwang,
            });
          } else {
            showError("Pitak not found");
            onClose();
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showError("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, mode, onClose]);

  // Helper: Parse existing pitak data
  const parseExistingPitakData = async (
    pitakData: PitakData,
  ): Promise<FormData> => {
    let buholInputs = {};
    let triangleMode: "base_height" | "three_sides" = "base_height";
    let measurementMethod = "";
    let useAdvancedMode = false;
    let layoutType: "square" | "rectangle" | "triangle" | "circle" | "" = "";

    // Check if advanced mode was used
    if (pitakData.sideLengths) {
      try {
        const sideLengthsData =
          typeof pitakData.sideLengths === "string"
            ? JSON.parse(pitakData.sideLengths)
            : pitakData.sideLengths;

        if (sideLengthsData.buholInputs || sideLengthsData.measurementMethod) {
          useAdvancedMode = true;
          layoutType = (pitakData.layoutType as any) || "";

          if (sideLengthsData.buholInputs) {
            buholInputs = sideLengthsData.buholInputs;
          }

          if (sideLengthsData.measurementMethod) {
            measurementMethod = sideLengthsData.measurementMethod;
          }

          if (sideLengthsData.triangleMode) {
            triangleMode = sideLengthsData.triangleMode;
          }
        }
      } catch (e) {
        console.error("Error parsing sideLengths:", e);
      }
    }

    return {
      bukidId: pitakData.bukid.id,
      location: pitakData.location || "",
      totalLuwang: pitakData.totalLuwang,
      areaSqm: pitakData.areaSqm || 0,
      status: pitakData.status,
      notes: pitakData.notes || "",
      useAdvancedMode,
      layoutType,
      buholInputs,
      triangleMode,
      measurementMethod,
    };
  };

  // Handle form input changes
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      clearError(field);
    }

    // Handle mode-specific resets
    switch (field) {
      case "useAdvancedMode":
        if (value === false) {
          // Switching to simple mode - clear advanced fields
          setFormData((prev) => ({
            ...prev,
            layoutType: "",
            buholInputs: {},
            measurementMethod: "",
          }));
        }
        clearAllErrors();
        break;

      case "layoutType":
        // Reset inputs when layout type changes
        setFormData((prev) => ({
          ...prev,
          buholInputs: {},
          measurementMethod: "",
        }));
        setCalculationResults({ areaSqm: 0, totalLuwang: 0 });
        clearAllErrors();
        break;
    }
  };

  // Handle manual totalLuwang input (Simple Mode)
  const handleManualLuwangChange = (totalLuwang: number) => {
    const areaSqm = totalLuwang * 250000; // 1 luwang = 250,000 sqm

    setFormData((prev) => ({
      ...prev,
      totalLuwang,
      areaSqm,
    }));

    setCalculationResults({
      areaSqm,
      totalLuwang,
    });

    if (errors.totalLuwang) {
      clearError("totalLuwang");
    }
  };

  // Handle advanced mode calculation results
  const handleAdvancedCalculation = (results: CalculationResults) => {
    setCalculationResults(results);

    setFormData((prev) => ({
      ...prev,
      areaSqm: results.areaSqm,
      totalLuwang: results.totalLuwang,
      measurementMethod:
        results.totalLuwang > 0 ? "traditional_calculation" : "",
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.bukidId) {
      newErrors.bukidId = "Please select a farm (bukid)";
    }

    if (formData.totalLuwang <= 0) {
      newErrors.totalLuwang = "Total Luwang must be greater than 0";
    }

    // Advanced mode validations
    if (formData.useAdvancedMode) {
      if (!formData.layoutType) {
        newErrors.layoutType = "Please select a plot shape";
      }

      // Validate shape inputs
      const shapeErrors = validateShapeInputs(
        formData.layoutType,
        formData.buholInputs,
        formData.triangleMode,
      );
      Object.assign(newErrors, shapeErrors);
    }

    // Length validations
    if (formData.location.length > 255) {
      newErrors.location = "Location must be less than 255 characters";
    }

    if (formData.notes.length > 1000) {
      newErrors.notes = "Notes must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Please fix the errors in the form");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare sideLengths JSON for advanced mode
      let sideLengthsJson = null;
      if (formData.useAdvancedMode) {
        sideLengthsJson = JSON.stringify({
          buholInputs: formData.buholInputs,
          measurementMethod: formData.measurementMethod,
          triangleMode: formData.triangleMode,
          useAdvancedMode: true,
        });
      }

      // Prepare API data
      const pitakData: any = {
        bukidId: formData.bukidId!,
        location: formData.location.trim() || null,
        totalLuwang: parseFloat(formData.totalLuwang.toFixed(2)),
        areaSqm: parseFloat(formData.areaSqm.toFixed(2)),
        status: formData.status,
      };

      // Add advanced mode fields if used
      if (formData.useAdvancedMode) {
        pitakData.layoutType = formData.layoutType;
        pitakData.sideLengths = sideLengthsJson;
        pitakData.measurementMethod = formData.measurementMethod;
        pitakData.traditionalSystemUsed = true;
      }

      // Add notes if available
      if (formData.notes.trim()) {
        pitakData.notes = formData.notes.trim();
      }

      // Call API
      let response;
      if (mode === "add") {
        response = await pitakAPI.validateAndCreate(pitakData);
      } else if (mode === "edit" && id) {
        response = await pitakAPI.validateAndUpdate(id, pitakData);
      }

      if (response?.status) {
        showSuccess(
          mode === "add"
            ? "Pitak created successfully!"
            : "Pitak updated successfully!",
        );

        if (onSuccess && response.data) {
          onSuccess(response.data);
        }

        onClose();
      } else {
        throw new Error(response?.message || "Failed to save pitak");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      showError(error.message || "Failed to save pitak");
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected bukid details
  const selectedBukid = bukids.find((b) => b.id === formData.bukidId);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <LandPlot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {mode === "add" ? "Add New Pitak" : "Edit Pitak"}
              </h3>
              <div className="text-xs text-gray-600 flex items-center gap-2">
                {mode === "edit" && pitak && (
                  <>
                    <span>ID: #{pitak.id}</span>
                    <span>•</span>
                    <span>Area: {pitak.areaSqm?.toFixed(2) || 0} m²</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {mode === "add" ? "Create new plot" : "Edit existing plot"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {if(!await dialogs.confirm({title: 'Close Form', message: 'Are you sure do you want to close this form?.'}))return;onClose();}}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">
                {mode === "add" ? "Loading form..." : "Loading pitak data..."}
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TreePalm className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Farm</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedBukid?.name || "Not selected"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Grid3x3 className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Plot Mode</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formData.useAdvancedMode ? "Advanced" : "Manual"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Area</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formData.areaSqm > 0
                          ? `${formData.areaSqm.toFixed(2)} m²`
                          : "0 m²"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">LuWang</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formData.totalLuwang.toFixed(2)} LuWang
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Farm Selection */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TreePalm className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Farm Selection
                        </h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Select Farm (Bukid){" "}
                            <span className="text-red-500">*</span>
                          </label>

                          {bukidId ? (
                            // Kapag may bukidId, ipakita lang ang naka-select na bukid
                            <div className="p-2 bg-gray-100 rounded border border-gray-300 text-sm text-gray-800">
                              Selected Farm ID: {bukidId}
                            </div>
                          ) : (
                            // Kapag wala pa, ipakita ang BukidSelect
                            <div className="relative">
                              <BukidSelect
                                value={mode === "edit" ? formData.bukidId : 0}
                                disabled={mode === "edit"}
                                onChange={async (bukidId: number | null) => {
                                  if (bukidId) {
                                    try {
                                      const response =
                                        await bukidAPI.getById(bukidId);
                                      if (response.data?.bukid?.id) {
                                        handleChange(
                                          "bukidId",
                                          response.data.bukid.id,
                                        );
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Failed to fetch bukid:",
                                        err,
                                      );
                                    }
                                  }
                                }}
                                placeholder="Search or select a farm..."
                              />
                              {errors.bukidId && (
                                <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.bukidId}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedBukid && (
                          <div
                            className={`bg-blue-50 p-3 rounded border border-blue-200 ${
                              mode === "edit" || bukidId
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <TreePalm className="w-3.5 h-3.5 text-blue-600" />
                                  <h3 className="text-xs font-semibold text-gray-900">
                                    {selectedBukid.name}
                                  </h3>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  {selectedBukid.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {selectedBukid.location}
                                    </div>
                                  )}
                                  <div className="mt-2">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                        selectedBukid.status === "active"
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : selectedBukid.status === "inactive"
                                            ? "bg-gray-100 text-gray-800 border border-gray-200"
                                            : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                      }`}
                                    >
                                      {selectedBukid
                                        ?.status!.charAt(0)
                                        .toUpperCase() +
                                        selectedBukid?.status!.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleChange("bukidId", null)}
                                className={`p-1 rounded hover:bg-white transition-colors text-gray-500 ${
                                  mode === "edit" || bukidId
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                                title="Remove"
                                disabled={mode === "edit" || !!bukidId}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Measurement Mode Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Measurement Mode
                        </h4>
                      </div>

                      {/* Mode Toggle */}
                      <MeasurementModeToggle
                        useAdvancedMode={formData.useAdvancedMode}
                        onChange={(mode) =>
                          handleChange("useAdvancedMode", mode)
                        }
                      />

                      {/* Manual Input Mode */}
                      {!formData.useAdvancedMode && (
                        <ManualInputForm
                          totalLuwang={formData.totalLuwang}
                          error={errors.totalLuwang}
                          onChange={handleManualLuwangChange}
                        />
                      )}

                      {/* Advanced Geometry Mode */}
                      {formData.useAdvancedMode && (
                        <AdvancedGeometryForm
                          layoutType={formData.layoutType}
                          buholInputs={formData.buholInputs}
                          triangleMode={formData.triangleMode}
                          errors={errors}
                          onLayoutTypeChange={(type) =>
                            handleChange("layoutType", type)
                          }
                          onBuholInputChange={(field, value) => {
                            const updatedInputs = {
                              ...formData.buholInputs,
                              [field]: value,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              buholInputs: updatedInputs,
                            }));
                            if (errors[field]) clearError(field);
                          }}
                          onTriangleModeChange={(mode) =>
                            handleChange("triangleMode", mode)
                          }
                          onCalculation={handleAdvancedCalculation}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Calculation Results */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Calculation Results
                        </h4>
                      </div>

                      <ResultsDisplay
                        results={calculationResults}
                        layoutType={formData.layoutType}
                        measurementMethod={formData.measurementMethod}
                        buholInputs={formData.buholInputs}
                      />
                    </div>

                    {/* Location & Status */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Location & Status
                        </h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-xs font-medium mb-1.5 text-gray-700"
                            htmlFor="location"
                          >
                            Specific Location (Optional)
                          </label>
                          <div className="relative">
                            <input
                              id="location"
                              type="text"
                              value={formData.location}
                              onChange={(e) =>
                                handleChange("location", e.target.value)
                              }
                              className={`w-full px-3 py-2 rounded text-sm border ${
                                errors.location
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                              placeholder="E.g., 'Northwest corner', 'Section A-3', 'Near the irrigation pump'"
                            />
                            {errors.location && (
                              <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                {errors.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Selection */}
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700">
                            Plot Status <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["active", "inactive", "completed"] as const).map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleChange("status", status)}
                                  className={`p-3 rounded border flex flex-col items-center justify-center gap-1 ${
                                    formData.status === status
                                      ? "ring-2 ring-green-500 ring-offset-1"
                                      : "border-gray-300 hover:border-green-500"
                                  } transition-all`}
                                >
                                  {status === "active" && (
                                    <CheckCircle
                                      className={`w-4 h-4 ${
                                        formData.status === status
                                          ? "text-green-600"
                                          : "text-gray-400"
                                      }`}
                                    />
                                  )}
                                  {status === "inactive" && (
                                    <XCircle
                                      className={`w-4 h-4 ${
                                        formData.status === status
                                          ? "text-gray-600"
                                          : "text-gray-400"
                                      }`}
                                    />
                                  )}
                                  {status === "completed" && (
                                    <Calendar
                                      className={`w-4 h-4 ${
                                        formData.status === status
                                          ? "text-yellow-600"
                                          : "text-gray-400"
                                      }`}
                                    />
                                  )}
                                  <span
                                    className={`text-xs font-medium ${
                                      formData.status === status
                                        ? status === "active"
                                          ? "text-green-700"
                                          : status === "inactive"
                                            ? "text-gray-700"
                                            : "text-yellow-700"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                          <div className="mt-3 text-xs text-gray-600 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-2 rounded bg-green-50">
                                <div className="font-medium text-green-700 mb-0.5">
                                  Active
                                </div>
                                <div>Available for new assignments</div>
                              </div>
                              <div className="p-2 rounded bg-gray-50">
                                <div className="font-medium text-gray-700 mb-0.5">
                                  Inactive
                                </div>
                                <div>Not available for assignments</div>
                              </div>
                              <div className="p-2 rounded bg-yellow-50">
                                <div className="font-medium text-yellow-700 mb-0.5">
                                  Completed
                                </div>
                                <div>Completed harvesting cycle</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Additional Notes
                        </h4>
                      </div>
                      <div>
                        <textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) =>
                            handleChange("notes", e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded text-sm border ${
                            errors.notes ? "border-red-500" : "border-gray-300"
                          } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                          placeholder="Enter any additional notes about this pitak... 
                          • Soil type and quality
                          • Special conditions or requirements
                          • Landmarks for easy identification
                          • Previous crop history
                          • Any equipment requirements"
                          rows={4}
                        />
                        {errors.notes && (
                          <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {errors.notes}
                          </p>
                        )}
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            Add detailed information to help manage the plot
                            effectively
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              formData.notes.length > 1000
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formData.notes.length}/1000
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                Fields marked with <span className="text-red-500">*</span> are
                required
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {if(!await dialogs.confirm({title: 'Close Form', message: 'Are you sure do you want to close this form?.'}))return;onClose();}}
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || formData.totalLuwang <= 0}
                className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    {mode === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {mode === "add" ? "Create Pitak" : "Update Pitak"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitakFormDialog;
