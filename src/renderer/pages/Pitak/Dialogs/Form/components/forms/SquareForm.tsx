import React from "react";
import { Ruler, Hash, Maximize } from "lucide-react";
import { TraditionalMeasurement } from "../../utils/measurement";
import { useMeasurementValidation } from "../../hooks/useMeasurementValidation";

interface SquareFormProps {
  inputs: Record<string, number>;
  errors: Record<string, string>;
  onChange: (field: string, value: number) => void;
  onCalculate: (results: any) => void;
}

const SquareForm: React.FC<SquareFormProps> = ({
  inputs,
  errors,
  onChange,
  onCalculate,
}) => {
  const { validateBuholInput } = useMeasurementValidation();

  const handleSideChange = (value: number) => {
    const error = validateBuholInput(value, "Side");

    onChange("side", value);

    // Always calculate if value is valid
    if (!error && value > 0) {
      const results = TraditionalMeasurement.calculateArea("square", {
        side: value,
      });
      onCalculate(results);
    } else if (value === 0) {
      // Reset calculation if value is 0
      onCalculate({ areaSqm: 0, totalLuwang: 0 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Input */}
      <div>
        <label className="block text-xs font-medium mb-1.5 text-gray-700">
          Side Length (in Buhol) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0.1"
            max="2000"
            step="0.01"
            value={inputs.side || ""}
            onChange={(e) => handleSideChange(parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
              errors.side ? "border-red-500" : "border-gray-300"
            } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
            placeholder="Enter side length in buhol (e.g., 15.5)"
          />
          <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        {errors.side && (
          <p className="mt-1 text-xs text-red-600">{errors.side}</p>
        )}

        {/* Conversion Display */}
        {inputs.side && inputs.side > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-700 space-y-1">
              <div className="font-medium">Traditional Measurement:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-gray-600">In Buhol:</div>
                  <div className="font-semibold">{inputs.side.toFixed(2)} buhol</div>
                </div>
                <div>
                  <div className="text-gray-600">In Tali:</div>
                  <div className="font-semibold">
                    {TraditionalMeasurement.buholToTali(inputs.side).toFixed(3)}{" "}
                    tali
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">In Meters:</div>
                  <div className="font-semibold">
                    {TraditionalMeasurement.buholToMeters(inputs.side).toFixed(2)} meters
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Representation */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Maximize className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Square Plot</span>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative">
            <div
              className="border-2 border-green-500 bg-green-50 flex items-center justify-center"
              style={{
                width: "120px",
                height: "120px",
                position: "relative",
              }}
            >
              <div className="text-xs text-green-700 text-center">
                <div className="font-bold">Square</div>
                {inputs.side > 0 && (
                  <>
                    <div>{inputs.side.toFixed(2)} buhol</div>
                    <div>
                      = {TraditionalMeasurement.buholToMeters(inputs.side).toFixed(2)}m
                    </div>
                  </>
                )}
              </div>
            </div>
            {inputs.side > 0 && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                Side
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Formula */}
      {inputs.side > 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <div className="text-xs">
            <div className="font-medium text-yellow-800 mb-1">
              Calculation Formula:
            </div>
            <div className="text-yellow-700 space-y-1">
              <div>Side (buhol) × 50 = Side (meters)</div>
              <div>Area = Side (m) × Side (m)</div>
              <div className="font-mono mt-1 p-1 bg-white rounded border">
                {inputs.side > 0 ? (
                  <>
                    ({inputs.side.toFixed(2)} × 50) × ({inputs.side.toFixed(2)} × 50) =
                    {TraditionalMeasurement.buholToMeters(inputs.side).toFixed(2)} ×{" "}
                    {TraditionalMeasurement.buholToMeters(inputs.side).toFixed(2)} =
                    {(TraditionalMeasurement.buholToMeters(inputs.side) *
                      TraditionalMeasurement.buholToMeters(inputs.side)).toFixed(2)}{" "}
                    sqm
                  </>
                ) : (
                  "Enter side length to see calculation"
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SquareForm;