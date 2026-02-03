import React from "react";
import { Ruler, Hash, RectangleHorizontal } from "lucide-react";
import { TraditionalMeasurement } from "../../utils/measurement";
import { useMeasurementValidation } from "../../hooks/useMeasurementValidation";

interface RectangleFormProps {
  inputs: Record<string, number>;
  errors: Record<string, string>;
  onChange: (field: string, value: number) => void;
  onCalculate: (results: any) => void;
}

const RectangleForm: React.FC<RectangleFormProps> = ({
  inputs,
  errors,
  onChange,
  onCalculate,
}) => {
  const { validateBuholInput } = useMeasurementValidation();

  const handleInputChange = (field: "length" | "width", value: number) => {
    const error = validateBuholInput(
      value,
      field === "length" ? "Length" : "Width",
    );

    onChange(field, value);

    // Check if we have both inputs for calculation
    const currentLength = field === "length" ? value : inputs.length || 0;
    const currentWidth = field === "width" ? value : inputs.width || 0;

    if (!error && currentLength > 0 && currentWidth > 0) {
      const results = TraditionalMeasurement.calculateArea("rectangle", {
        length: currentLength,
        width: currentWidth,
      });
      onCalculate(results);
    } else if (currentLength === 0 || currentWidth === 0) {
      // Reset calculation if one dimension is 0
      onCalculate({ areaSqm: 0, totalLuwang: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Length Input */}
        <div>
          <label className="block text-xs font-medium mb-1.5 text-gray-700">
            Length (Buhol) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              max="2000"
              step="0.01"
              value={inputs.length || ""}
              onChange={(e) =>
                handleInputChange("length", parseFloat(e.target.value) || 0)
              }
              className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
                errors.length ? "border-red-500" : "border-gray-300"
              } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
              placeholder="Length in buhol (e.g., 25.75)"
            />
            <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          {errors.length && (
            <p className="mt-1 text-xs text-red-600">{errors.length}</p>
          )}
        </div>

        {/* Width Input */}
        <div>
          <label className="block text-xs font-medium mb-1.5 text-gray-700">
            Width (Buhol) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              max="2000"
              step="0.01"
              value={inputs.width || ""}
              onChange={(e) =>
                handleInputChange("width", parseFloat(e.target.value) || 0)
              }
              className={`w-full px-3 py-2 pl-10 rounded text-sm border ${
                errors.width ? "border-red-500" : "border-gray-300"
              } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
              placeholder="Width in buhol (e.g., 15.25)"
            />
            <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          {errors.width && (
            <p className="mt-1 text-xs text-red-600">{errors.width}</p>
          )}
        </div>
      </div>

      {/* Conversion Display */}
      {(inputs.length > 0 || inputs.width > 0) && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-blue-700">
            <div className="font-medium mb-2">Traditional Measurements:</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 mb-1">Length:</div>
                <div className="space-y-1">
                  <div>{inputs.length?.toFixed(2) || "0.00"} buhol</div>
                  <div>
                    {TraditionalMeasurement.buholToTali(
                      inputs.length || 0,
                    ).toFixed(3)}{" "}
                    tali
                  </div>
                  <div>
                    {TraditionalMeasurement.buholToMeters(inputs.length || 0).toFixed(2)}{" "}
                    meters
                  </div>
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Width:</div>
                <div className="space-y-1">
                  <div>{inputs.width?.toFixed(2) || "0.00"} buhol</div>
                  <div>
                    {TraditionalMeasurement.buholToTali(
                      inputs.width || 0,
                    ).toFixed(3)}{" "}
                    tali
                  </div>
                  <div>
                    {TraditionalMeasurement.buholToMeters(inputs.width || 0).toFixed(2)}{" "}
                    meters
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Representation */}
      <div className="p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <RectangleHorizontal className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            Rectangle Plot
          </span>
        </div>
        <div className="flex justify-center">
          <div className="relative">
            <div
              className="border-2 border-blue-500 bg-blue-50"
              style={{
                width: inputs.length > inputs.width ? "150px" : "100px",
                height: inputs.width > inputs.length ? "150px" : "100px",
                position: "relative",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs text-blue-700 text-center">
                  <div className="font-bold">Rectangle</div>
                  {inputs.length > 0 && inputs.width > 0 && (
                    <>
                      <div>
                        {inputs.length.toFixed(2)} × {inputs.width.toFixed(2)} buhol
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {inputs.length > 0 && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                Length: {inputs.length.toFixed(2)} buhol
              </div>
            )}

            {inputs.width > 0 && (
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                Width: {inputs.width.toFixed(2)} buhol
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Formula */}
      {inputs.length > 0 && inputs.width > 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <div className="text-xs">
            <div className="font-medium text-yellow-800 mb-1">Calculation:</div>
            <div className="text-yellow-700 space-y-1">
              <div>
                Length: {inputs.length.toFixed(2)} buhol × 50 ={" "}
                {TraditionalMeasurement.buholToMeters(inputs.length).toFixed(2)}m
              </div>
              <div>
                Width: {inputs.width.toFixed(2)} buhol × 50 ={" "}
                {TraditionalMeasurement.buholToMeters(inputs.width).toFixed(2)}m
              </div>
              <div className="font-mono mt-1 p-1 bg-white rounded border">
                Area = {TraditionalMeasurement.buholToMeters(inputs.length).toFixed(2)} ×{" "}
                {TraditionalMeasurement.buholToMeters(inputs.width).toFixed(2)} =
                {(
                  TraditionalMeasurement.buholToMeters(inputs.length) *
                  TraditionalMeasurement.buholToMeters(inputs.width)
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

export default RectangleForm;