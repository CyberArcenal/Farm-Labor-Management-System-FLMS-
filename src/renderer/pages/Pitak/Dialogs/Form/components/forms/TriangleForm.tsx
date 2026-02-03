import React from "react";
import { Triangle, Ruler, Hash, AlertTriangle } from "lucide-react";
import {
  TraditionalMeasurement,
  type TriangleMode,
} from "../../utils/measurement";
import { useMeasurementValidation } from "../../hooks/useMeasurementValidation";

interface TriangleFormProps {
  inputs: Record<string, number>;
  errors: Record<string, string>;
  onChange: (field: string, value: number) => void;
  onCalculate: (results: any) => void;
  triangleMode: TriangleMode;
  onTriangleModeChange: (mode: TriangleMode) => void;
}

const TriangleForm: React.FC<TriangleFormProps> = ({
  inputs,
  errors,
  onChange,
  onCalculate,
  triangleMode,
  onTriangleModeChange,
}) => {
  const { validateBuholInput } = useMeasurementValidation();

  const handleModeChange = (newMode: TriangleMode) => {
    onTriangleModeChange(newMode);
    // Clear previous inputs
    if (newMode === "base_height") {
      onChange("sideA", 0);
      onChange("sideB", 0);
      onChange("sideC", 0);
    } else {
      onChange("base", 0);
      onChange("height", 0);
    }
  };

  const handleInputChange = (field: string, value: number) => {
    const fieldLabel =
      field === "base"
        ? "Base"
        : field === "height"
          ? "Height"
          : field === "sideA"
            ? "Side A"
            : field === "sideB"
              ? "Side B"
              : "Side C";

    const error = validateBuholInput(value, fieldLabel);
    onChange(field, value);

    // Calculate based on current mode
    if (triangleMode === "base_height") {
      const base = field === "base" ? value : inputs.base || 0;
      const height = field === "height" ? value : inputs.height || 0;

      if (!error && base > 0 && height > 0) {
        const results = TraditionalMeasurement.calculateArea(
          "triangle",
          { base, height },
          triangleMode,
        );
        onCalculate(results);
      } else if (base === 0 || height === 0) {
        onCalculate({ areaSqm: 0, totalLuwang: 0 });
      }
    } else {
      const sideA = field === "sideA" ? value : inputs.sideA || 0;
      const sideB = field === "sideB" ? value : inputs.sideB || 0;
      const sideC = field === "sideC" ? value : inputs.sideC || 0;

      if (!error && sideA > 0 && sideB > 0 && sideC > 0) {
        // Check triangle inequality with tolerance for floating point
        if (
          sideA >= sideB + sideC - 0.01 ||
          sideB >= sideA + sideC - 0.01 ||
          sideC >= sideA + sideB - 0.01
        ) {
          onCalculate({ areaSqm: 0, totalLuwang: 0 });
        } else {
          const results = TraditionalMeasurement.calculateArea(
            "triangle",
            { sideA, sideB, sideC },
            triangleMode,
          );
          onCalculate(results);
        }
      } else if (sideA === 0 || sideB === 0 || sideC === 0) {
        onCalculate({ areaSqm: 0, totalLuwang: 0 });
      }
    }
  };

  // Validate triangle sides with tolerance for decimals
  const validateTriangleSides = (a: number, b: number, c: number): string => {
    if (a >= b + c - 0.01 || b >= a + c - 0.01 || c >= a + b - 0.01) {
      return "Invalid triangle: One side cannot be greater than or equal to sum of other two sides";
    }
    return "";
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => handleModeChange("base_height")}
          className={`flex-1 py-2 text-sm font-medium ${triangleMode === "base_height" ? "bg-green-600 text-white" : "bg-gray-50 text-gray-700"}`}
        >
          Base + Height
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("three_sides")}
          className={`flex-1 py-2 text-sm font-medium ${triangleMode === "three_sides" ? "bg-green-600 text-white" : "bg-gray-50 text-gray-700"}`}
        >
          3 Sides (Heron's)
        </button>
      </div>

      {/* Base + Height Mode */}
      {triangleMode === "base_height" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700">
                Base (Buhol) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  max="2000"
                  step="0.01"
                  value={inputs.base || ""}
                  onChange={(e) =>
                    handleInputChange("base", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
                    errors.base ? "border-red-500" : "border-gray-300"
                  } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                  placeholder="Base in buhol (e.g., 20.5)"
                />
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.base && (
                <p className="mt-1 text-xs text-red-600">{errors.base}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700">
                Height (Buhol) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  max="2000"
                  step="0.01"
                  value={inputs.height || ""}
                  onChange={(e) =>
                    handleInputChange("height", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
                    errors.height ? "border-red-500" : "border-gray-300"
                  } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                  placeholder="Height in buhol (e.g., 15.25)"
                />
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.height && (
                <p className="mt-1 text-xs text-red-600">{errors.height}</p>
              )}
            </div>
          </div>

          {/* Formula Display */}
          {inputs.base > 0 && inputs.height > 0 && (
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-xs">
                <div className="font-medium text-yellow-800 mb-1">
                  Calculation Formula:
                </div>
                <div className="text-yellow-700 space-y-1">
                  <div>
                    Base: {inputs.base.toFixed(2)} buhol × 50 ={" "}
                    {TraditionalMeasurement.buholToMeters(inputs.base).toFixed(2)}m
                  </div>
                  <div>
                    Height: {inputs.height.toFixed(2)} buhol × 50 ={" "}
                    {TraditionalMeasurement.buholToMeters(inputs.height).toFixed(2)}m
                  </div>
                  <div className="font-mono mt-1 p-1 bg-white rounded border">
                    Area = (Base × Height) ÷ 2 = (
                    {TraditionalMeasurement.buholToMeters(inputs.base).toFixed(2)} ×{" "}
                    {TraditionalMeasurement.buholToMeters(inputs.height).toFixed(2)}) ÷ 2 =
                    {(
                      (TraditionalMeasurement.buholToMeters(inputs.base) *
                        TraditionalMeasurement.buholToMeters(inputs.height)) /
                      2
                    ).toFixed(2)}{" "}
                    sqm
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3 Sides Mode */}
      {triangleMode === "three_sides" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {["sideA", "sideB", "sideC"].map((side, index) => (
              <div key={side}>
                <label className="block text-xs font-medium mb-1.5 text-gray-700">
                  Side {String.fromCharCode(65 + index)} (Buhol){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="2000"
                    step="0.01"
                    value={inputs[side] || ""}
                    onChange={(e) =>
                      handleInputChange(side, parseFloat(e.target.value) || 0)
                    }
                    className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
                      errors[side] ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                    placeholder={`Side ${String.fromCharCode(65 + index)} (e.g., 12.5)`}
                  />
                  <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {errors[side] && (
                  <p className="mt-1 text-xs text-red-600">{errors[side]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Triangle Validation */}
          {inputs.sideA > 0 && inputs.sideB > 0 && inputs.sideC > 0 && (
            <>
              {validateTriangleSides(
                inputs.sideA,
                inputs.sideB,
                inputs.sideC,
              ) ? (
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="text-xs text-red-700">
                      {validateTriangleSides(
                        inputs.sideA,
                        inputs.sideB,
                        inputs.sideC,
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <div className="text-xs">
                    <div className="font-medium text-yellow-800 mb-1">
                      Heron's Formula:
                    </div>
                    <div className="text-yellow-700 space-y-1">
                      <div>
                        a = {inputs.sideA.toFixed(2)} buhol × 50 ={" "}
                        {TraditionalMeasurement.buholToMeters(inputs.sideA).toFixed(2)}m
                      </div>
                      <div>
                        b = {inputs.sideB.toFixed(2)} buhol × 50 ={" "}
                        {TraditionalMeasurement.buholToMeters(inputs.sideB).toFixed(2)}m
                      </div>
                      <div>
                        c = {inputs.sideC.toFixed(2)} buhol × 50 ={" "}
                        {TraditionalMeasurement.buholToMeters(inputs.sideC).toFixed(2)}m
                      </div>
                      <div>
                        s = (a + b + c) ÷ 2 ={" "}
                        {(TraditionalMeasurement.buholToMeters(inputs.sideA) +
                          TraditionalMeasurement.buholToMeters(inputs.sideB) +
                          TraditionalMeasurement.buholToMeters(inputs.sideC)) /
                          2}
                        m
                      </div>
                      <div className="font-mono mt-1 p-1 bg-white rounded border">
                        Area = √[s(s-a)(s-b)(s-c)]
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Visual Representation */}
      <div className="p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Triangle className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            Triangle Plot
          </span>
        </div>
        <div className="flex justify-center">
          <div className="relative">
            <svg
              width="150"
              height="120"
              className="border border-gray-300 rounded"
            >
              <polygon
                points="75,20 20,100 130,100"
                fill="#dbeafe"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {triangleMode === "base_height" &&
                inputs.base > 0 &&
                inputs.height > 0 && (
                  <>
                    <text x="75" y="115" className="text-xs fill-blue-700">
                      Base: {inputs.base.toFixed(2)} buhol
                    </text>
                    <text x="140" y="60" className="text-xs fill-blue-700">
                      Height: {inputs.height.toFixed(2)} buhol
                    </text>
                  </>
                )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriangleForm;