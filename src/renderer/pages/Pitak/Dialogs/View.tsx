// PitakViewDialog.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  TreePalm,
  Calendar,
  FileText,
  LandPlot,
  Ruler,
  Info,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Edit,
  Square,
  Triangle,
  Circle,
  Calculator,
  Maximize,
  Minimize,
  AreaChart,
  Box,
  Grid3x3,
  Hash,
  Crop,
  RectangleCircle,
} from "lucide-react";
import type { PitakWithDetails } from "../../../apis/pitak";
import pitakAPI from "../../../apis/pitak";
import { showError } from "../../../utils/notification";
import { formatDate, formatCurrency } from "../../../utils/formatters";

interface PitakViewDialogProps {
  id: number;
  onClose: () => void;
  onEdit?: (id: number) => void;
}

interface GeometryDetails {
  layoutType?: string;
  sideLengths?: any;
  areaSqm?: number;
  totalLuwang?: number;
  hectareEquivalent?: number;
}

const PitakViewDialog: React.FC<PitakViewDialogProps> = ({
  id,
  onClose,
  onEdit,
}) => {
  const [loading, setLoading] = useState(true);
  const [pitak, setPitak] = useState<PitakWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "assignments" | "payments" | "stats" | "geometry"
  >("details");
  const [geometryDetails, setGeometryDetails] = useState<GeometryDetails>({});

  // Layout type icons and descriptions
  const layoutIcons = {
    square: Square,
    rectangle: RectangleCircle,
    triangle: Triangle,
    circle: Circle,
    default: Box,
  };

  // Fetch pitak data
  useEffect(() => {
    const fetchPitakData = async () => {
      try {
        setLoading(true);
        const response = await pitakAPI.getPitakById(id);

        if (response.status && response.data) {
          const pitakData = response.data;
          setPitak(pitakData);

          // Parse and calculate geometry details
          const geoDetails: GeometryDetails = {
            layoutType: pitakData.layoutType,
            sideLengths:
              typeof pitakData.sideLengths === "string"
                ? JSON.parse(pitakData.sideLengths)
                : pitakData.sideLengths,
            areaSqm: pitakData.areaSqm,
            totalLuwang: pitakData.totalLuwang,
            hectareEquivalent: pitakData.areaSqm
              ? pitakData.areaSqm / 10000
              : 0,
          };
          setGeometryDetails(geoDetails);
        } else {
          showError("Failed to load pitak data");
          onClose();
        }
      } catch (error) {
        console.error("Error fetching pitak data:", error);
        showError("Failed to load pitak data");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPitakData();
    }
  }, [id, onClose]);

  // Calculate utilization color
  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "text-red-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          icon: CheckCircle,
        };
      case "inactive":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: XCircle,
        };
      case "completed":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200",
          icon: Calendar,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: Info,
        };
    }
  };

  // Get layout icon component
  const getLayoutIcon = () => {
    if (
      geometryDetails.layoutType &&
      layoutIcons[geometryDetails.layoutType as keyof typeof layoutIcons]
    ) {
      return layoutIcons[
        geometryDetails.layoutType as keyof typeof layoutIcons
      ];
    }
    return layoutIcons.default;
  };

  // Get layout description
  const getLayoutDescription = () => {
    if (!geometryDetails.layoutType) return "Not specified";

    const descriptions: Record<string, string> = {
      square: "All sides equal",
      rectangle: "Length × Width",
      triangle: "Base × Height / 2",
      circle: "π × Radius²",
    };
    return (
      descriptions[geometryDetails.layoutType] || geometryDetails.layoutType
    );
  };

  // Format side lengths for display
  const formatSideLengths = () => {
    if (
      !geometryDetails.sideLengths ||
      typeof geometryDetails.sideLengths !== "object"
    ) {
      return [];
    }

    return Object.entries(geometryDetails.sideLengths).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number,
      unit: "m",
    }));
  };

  // Calculate remaining capacity
  const calculateRemainingCapacity = () => {
    if (!pitak) return 0;
    const assigned = pitak.stats?.assignments?.totalLuWangAssigned || 0;
    return pitak.totalLuwang - assigned;
  };

  // Handle copy to clipboard
  const handleCopyDetails = () => {
    if (!pitak) return;

    let geometryText = "";
    if (geometryDetails.layoutType) {
      geometryText = `\nPlot Shape: ${geometryDetails.layoutType}`;
      if (geometryDetails.areaSqm) {
        geometryText += `\nArea: ${geometryDetails.areaSqm.toFixed(2)} m²`;
      }
    }

    const details = `
Pitak #${pitak.id}
Farm: ${pitak.bukid?.name || "N/A"}
Location: ${pitak.location || "N/A"}
LuWang Capacity: ${pitak.totalLuwang.toFixed(2)}${geometryText}
Status: ${pitak.status}
Utilization: ${pitak.stats?.utilizationRate || 0}%
Created: ${formatDate(pitak.createdAt)}
Updated: ${formatDate(pitak.updatedAt)}
        `.trim();

    navigator.clipboard.writeText(details);
    // You can add a toast notification here
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading pitak details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pitak) {
    return null;
  }

  const statusBadge = getStatusBadge(pitak.status);
  const StatusIcon = statusBadge.icon;
  const LayoutIcon = getLayoutIcon();
  const sideLengths = formatSideLengths();
  const remainingCapacity = calculateRemainingCapacity();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <LandPlot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Pitak #{pitak.id}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {pitak.status.charAt(0).toUpperCase() + pitak.status.slice(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{pitak.location || "No specific location"}</span>
                <span className="text-gray-400">•</span>
                <span>Farm: {pitak.bukid?.name || "N/A"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(pitak.id)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                title="Edit Pitak"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleCopyDetails}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Copy Details"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-4 overflow-x-auto">
            {["details", "geometry", "assignments", "payments", "stats"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex-shrink-0 ${
                    activeTab === tab
                      ? "border-green-600 text-green-700 bg-white"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-150px)] p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        LuWang Capacity
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {pitak.totalLuwang.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total capacity
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Utilization Rate
                      </div>
                      <div
                        className={`text-2xl font-bold ${getUtilizationColor(pitak.stats?.utilizationRate || 0)}`}
                      >
                        {pitak.stats?.utilizationRate?.toFixed(1) || 0}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pitak.stats?.assignments?.totalLuWangAssigned?.toFixed(
                          2,
                        ) || 0}{" "}
                        assigned
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Area</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {geometryDetails.areaSqm
                          ? `${geometryDetails.areaSqm.toFixed(2)}`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Square meters
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <AreaChart className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Plot Shape
                      </div>
                      <div className="text-2xl font-bold text-gray-900 capitalize">
                        {geometryDetails.layoutType || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getLayoutDescription()}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <LayoutIcon className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Farm Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TreePalm className="w-5 h-5 text-green-600" />
                      <h4 className="text-base font-semibold text-gray-900">
                        Farm Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Farm Name
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <TreePalm className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {pitak.bukid?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Farm Location
                        </label>
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900">
                            {pitak.bukid?.location || "No location specified"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Pitak Location
                        </label>
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900">
                            {pitak.location || "No specific location provided"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Summary */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      <h4 className="text-base font-semibold text-gray-900">
                        Capacity Summary
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Capacity</span>
                          <span className="font-medium text-gray-900">
                            {pitak.totalLuwang.toFixed(2)} LuWang
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Assigned</span>
                          <span className="font-medium text-blue-600">
                            {pitak.stats?.assignments?.totalLuWangAssigned?.toFixed(
                              2,
                            ) || "0.00"}{" "}
                            LuWang
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining</span>
                          <span className="font-medium text-green-600">
                            {remainingCapacity.toFixed(2)} LuWang
                          </span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-600">
                            Utilization
                          </span>
                          <span
                            className={`text-xs font-medium ${getUtilizationColor(pitak.stats?.utilizationRate || 0)}`}
                          >
                            {pitak.stats?.utilizationRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pitak.stats?.utilizationRate || 0 >= 80
                                ? "bg-red-500"
                                : (pitak.stats?.utilizationRate || 0) >= 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(pitak.stats?.utilizationRate || 0, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Status & Timeline */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <h4 className="text-base font-semibold text-gray-900">
                        Status & Timeline
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Current Status
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {pitak.status}
                          </span>
                          <span className="ml-auto text-xs text-gray-500">
                            {pitak.status === "active"
                              ? "Available for assignments"
                              : pitak.status === "inactive"
                                ? "Not available"
                                : "Harvesting completed"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-600">Created</span>
                          </div>
                          <span className="text-gray-900">
                            {formatDate(pitak.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-gray-600">Last Updated</span>
                          </div>
                          <span className="text-gray-900">
                            {formatDate(pitak.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {pitak.notes && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-amber-600" />
                        <h4 className="text-base font-semibold text-gray-900">
                          Additional Notes
                        </h4>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {pitak.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "geometry" && (
            <div className="space-y-6">
              {/* Geometry Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Plot Shape
                      </div>
                      <div className="text-lg font-bold text-gray-900 capitalize">
                        {geometryDetails.layoutType || "Not specified"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getLayoutDescription()}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <LayoutIcon className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Area</div>
                      <div className="text-lg font-bold text-gray-900">
                        {geometryDetails.areaSqm
                          ? `${geometryDetails.areaSqm.toFixed(2)} m²`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Square meters
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <AreaChart className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Hectare Equivalent
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {geometryDetails.hectareEquivalent
                          ? geometryDetails.hectareEquivalent.toFixed(2)
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        1 hectare = 10,000 m²
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Crop className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Geometry Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dimensions */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <h4 className="text-base font-semibold text-gray-900">
                      Plot Dimensions
                    </h4>
                  </div>
                  {sideLengths.length > 0 ? (
                    <div className="space-y-4">
                      {sideLengths.map((dimension, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {dimension.label === "Side" && (
                                <Maximize className="w-4 h-4 text-gray-400" />
                              )}
                              {dimension.label === "Length" && (
                                <Maximize className="w-4 h-4 text-gray-400" />
                              )}
                              {dimension.label === "Width" && (
                                <Minimize className="w-4 h-4 text-gray-400" />
                              )}
                              {dimension.label === "Base" && (
                                <Maximize className="w-4 h-4 text-gray-400" />
                              )}
                              {dimension.label === "Height" && (
                                <Minimize className="w-4 h-4 text-gray-400" />
                              )}
                              {dimension.label === "Radius" && (
                                <Circle className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {dimension.label}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {dimension.value} {dimension.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                      {geometryDetails.layoutType && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="text-sm text-gray-600">
                            <div className="font-medium mb-1">
                              Area Calculation:
                            </div>
                            {geometryDetails.layoutType === "square" && (
                              <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Area = Side × Side ={" "}
                                {sideLengths[0]?.value || 0} ×{" "}
                                {sideLengths[0]?.value || 0}
                              </div>
                            )}
                            {geometryDetails.layoutType === "rectangle" && (
                              <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Area = Length × Width ={" "}
                                {sideLengths[0]?.value || 0} ×{" "}
                                {sideLengths[1]?.value || 0}
                              </div>
                            )}
                            {geometryDetails.layoutType === "triangle" && (
                              <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Area = (Base × Height) ÷ 2 = (
                                {sideLengths[0]?.value || 0} ×{" "}
                                {sideLengths[1]?.value || 0}) ÷ 2
                              </div>
                            )}
                            {geometryDetails.layoutType === "circle" && (
                              <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Area = π × Radius² = π ×{" "}
                                {sideLengths[0]?.value || 0}²
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <Box className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        No geometry data available
                      </p>
                    </div>
                  )}
                </div>

                {/* Area Conversions */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <h4 className="text-base font-semibold text-gray-900">
                      Area Conversions
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {/* Square Meters */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-700">
                          {geometryDetails.areaSqm
                            ? geometryDetails.areaSqm.toFixed(2)
                            : "0.00"}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                          Square Meters (m²)
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Base measurement unit
                        </div>
                      </div>
                    </div>

                    {/* LuWang Equivalent */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-700">
                          {pitak.totalLuwang.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          LuWang
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          1 LuWang = 500 m²
                          <br />
                          Conversion:{" "}
                          {geometryDetails.areaSqm
                            ? geometryDetails.areaSqm.toFixed(2)
                            : "0"}{" "}
                          ÷ 500
                        </div>
                      </div>
                    </div>

                    {/* Hectare Equivalent */}
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-700">
                          {geometryDetails.hectareEquivalent
                            ? geometryDetails.hectareEquivalent.toFixed(2)
                            : "0.0000"}
                        </div>
                        <div className="text-sm text-purple-600 mt-1">
                          Hectares
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          1 hectare = 10,000 m²
                          <br />
                          Conversion:{" "}
                          {geometryDetails.areaSqm
                            ? geometryDetails.areaSqm.toFixed(2)
                            : "0"}{" "}
                          ÷ 10,000
                        </div>
                      </div>
                    </div>

                    {/* Quick Conversions */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Quick Conversions
                      </h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>LuWang per Hectare:</span>
                          <span className="font-medium">20 LuWang</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Square meters per LuWang:</span>
                          <span className="font-medium">500 m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hectares per LuWang:</span>
                          <span className="font-medium">0.05 ha</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Assignments
                </h4>
                <span className="text-sm text-gray-500">
                  {pitak.assignments?.length || 0} total assignments
                </span>
              </div>
              {pitak.assignments && pitak.assignments.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignment ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Worker
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          LuWang
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pitak.assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{assignment.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(assignment.assignmentDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {assignment.worker?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium">
                              {assignment.luwangCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                assignment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : assignment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {assignment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Assignments
                  </h4>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    This pitak doesn't have any assignments yet. Assignments
                    will appear here when workers are assigned to this plot.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Payments
                </h4>
                {pitak.stats?.payments && (
                  <div className="text-sm text-gray-500">
                    Total: {formatCurrency(pitak.stats.payments.totalNetPay)}
                  </div>
                )}
              </div>
              {pitak.payments && pitak.payments.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Worker
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gross Pay
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Pay
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pitak.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{payment.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {payment.worker?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.grossPay)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-green-600">
                              {formatCurrency(payment.netPay)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                payment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Payments
                  </h4>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    No payment records found for this pitak. Payments will
                    appear here when workers receive payments for assignments on
                    this plot.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && pitak.stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Statistics */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    Assignment Statistics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Assignments
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {pitak.stats.assignments.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total LuWang Assigned
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {pitak.stats.assignments.totalLuWangAssigned?.toFixed(
                          2,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Completed Assignments
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {pitak.stats.assignments.completed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Active Assignments
                      </span>
                      <span className="text-lg font-bold text-yellow-600">
                        {pitak.stats.assignments.active}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Statistics */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    Payment Statistics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Payments
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {pitak.stats.payments.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Gross Pay
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(pitak.stats.payments.totalGrossPay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Net Pay
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(pitak.stats.payments.totalNetPay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Completed Payments
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {pitak.stats.payments.completed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utilization Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900">
                    Capacity Utilization
                  </h4>
                  <span
                    className={`text-lg font-bold ${getUtilizationColor(pitak.stats.utilizationRate)}`}
                  >
                    {pitak.stats.utilizationRate?.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pitak.stats.utilizationRate >= 80
                        ? "bg-red-500"
                        : pitak.stats.utilizationRate >= 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(pitak.stats.utilizationRate, 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>0%</span>
                  <span>
                    Capacity Used:{" "}
                    {(pitak.stats.assignments.totalLuWangAssigned || 0).toFixed(
                      2,
                    )}{" "}
                    LuWang
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Last updated: {formatDate(pitak.updatedAt)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDetails}
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Details
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitakViewDialog;
