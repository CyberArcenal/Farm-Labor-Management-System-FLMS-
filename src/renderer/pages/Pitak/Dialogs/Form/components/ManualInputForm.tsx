import React from "react";
import { AlertCircle, Hash } from "lucide-react";

interface ManualInputFormProps {
  totalLuwang: number;
  error?: string;
  onChange: (value: number) => void;
}

const ManualInputForm: React.FC<ManualInputFormProps> = ({
  totalLuwang,
  error,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5 text-gray-700">
          Total LuWang <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.000001"
            value={totalLuwang || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
              error ? "border-red-500" : "border-gray-300"
            } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
            placeholder="Enter total luwang"
          />
          <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        {error && (
          <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        <div className="mt-2 text-xs text-gray-500">
          <p>1 LuWang = 500m × 500m = 250,000 m²</p>
          <p className="mt-1">
            Area: <span className="font-semibold">{(totalLuwang * 250000).toFixed(2)} m²</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualInputForm;