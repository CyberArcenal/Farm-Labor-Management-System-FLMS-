import React from "react";
import { Settings, Edit, Calculator } from "lucide-react";

interface MeasurementModeToggleProps {
  useAdvancedMode: boolean;
  onChange: (mode: boolean) => void;
}

const MeasurementModeToggle: React.FC<MeasurementModeToggleProps> = ({
  useAdvancedMode,
  onChange,
}) => {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
          !useAdvancedMode
            ? "bg-green-600 text-white"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        <Edit className="w-3.5 h-3.5" />
        Manual Mode
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
          useAdvancedMode
            ? "bg-green-600 text-white"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        <Calculator className="w-3.5 h-3.5" />
        Advanced Mode
      </button>
    </div>
  );
};

export default MeasurementModeToggle;