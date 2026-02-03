import React from "react";
import { Circle as CircleIcon, Ruler, Hash, Pi } from "lucide-react";
import { TraditionalMeasurement } from "../../utils/measurement";
import { useMeasurementValidation } from "../../hooks/useMeasurementValidation";

interface CircleFormProps {
  inputs: Record<string, number>;
  errors: Record<string, string>;
  onChange: (field: string, value: number) => void;
  onCalculate: (results: any) => void;
}

const CircleForm: React.FC<CircleFormProps> = ({
  inputs,
  errors,
  onChange,
  onCalculate,
}) => {
  const { validateBuholInput } = useMeasurementValidation();

  const handleRadiusChange = (value: number) => {
    const error = validateBuholInput(value, "Radius");

    onChange("radius", value);

    if (!error && value > 0) {
      const results = TraditionalMeasurement.calculateArea("circle", {
        radius: value,
      });
      onCalculate(results);
    } else if (value === 0) {
      onCalculate({ areaSqm: 0, totalLuwang: 0 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Radius Input */}
      <div>
        <label className="block text-xs font-medium mb-1.5 text-gray-700">
          Radius (Buhol) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0.1"
            max="2000"
            step="0.01"
            value={inputs.radius || ""}
            onChange={(e) => handleRadiusChange(parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
              errors.radius ? "border-red-500" : "border-gray-300"
            } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
            placeholder="Enter radius in buhol (e.g., 12.5)"
          />
          <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        {errors.radius && (
          <p className="mt-1 text-xs text-red-600">{errors.radius}</p>
        )}

        {/* Conversion Display */}
        {inputs.radius > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-700 space-y-1">
              <div className="font-medium">Traditional Measurement:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-gray-600">Radius in Buhol:</div>
                  <div className="font-semibold">{inputs.radius.toFixed(2)} buhol</div>
                </div>
                <div>
                  <div className="text-gray-600">In Tali:</div>
                  <div className="font-semibold">
                    {TraditionalMeasurement.buholToTali(inputs.radius).toFixed(
                      3,
                    )}{" "}
                    tali
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">In Meters:</div>
                  <div className="font-semibold">
                    {TraditionalMeasurement.buholToMeters(inputs.radius).toFixed(2)} meters
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Representation */}
      <div className="p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <CircleIcon className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            Circular Plot
          </span>
        </div>
        <div className="flex justify-center">
          <div className="relative">
            <svg
              width="150"
              height="150"
              className="border border-gray-300 rounded-full"
            >
              <circle
                cx="75"
                cy="75"
                r={Math.min(70, inputs.radius * 5)}
                fill="#dbeafe"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <line
                x1="75"
                y1="75"
                x2={75 + Math.min(70, inputs.radius * 5)}
                y2="75"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              {inputs.radius > 0 && (
                <text
                  x={75 + Math.min(70, inputs.radius * 5) / 2}
                  y="70"
                  className="text-xs fill-red-700"
                >
                  Radius: {inputs.radius.toFixed(2)} buhol
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Calculation Formula */}
      {inputs.radius > 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <div className="text-xs">
            <div className="font-medium text-yellow-800 mb-1">
              Calculation Formula:
            </div>
            <div className="text-yellow-700 space-y-1">
              <div>
                Radius: {inputs.radius.toFixed(2)} buhol × 50 ={" "}
                {TraditionalMeasurement.buholToMeters(inputs.radius).toFixed(2)}m
              </div>
              <div className="flex items-center gap-1">
                <Pi className="w-3 h-3" />π (Pi) ≈ 3.14159
              </div>
              <div className="font-mono mt-1 p-1 bg-white rounded border">
                Area = π × r² = 3.14159 × (
                {TraditionalMeasurement.buholToMeters(inputs.radius).toFixed(2)})² =
                {(
                  Math.PI *
                  Math.pow(
                    TraditionalMeasurement.buholToMeters(inputs.radius),
                    2,
                  )
                ).toFixed(2)}{" "}
                sqm
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleForm;