import React from "react";
import { Calculator, Ruler, Hash } from "lucide-react";
import {
  TraditionalMeasurement,
  type CalculationResult,
} from "../utils/measurement";

interface ResultsDisplayProps {
  results: CalculationResult;
  layoutType: string;
  measurementMethod: string;
  buholInputs: Record<string, number>;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  layoutType,
  measurementMethod,
  buholInputs,
}) => {
  if (!layoutType || results.areaSqm <= 0) return null;

  const getConversionExplanation = () => {
    const explanations = TraditionalMeasurement.getConversionExplanation(
      layoutType as any,
      buholInputs,
    );
    return explanations.slice(3);
  };

  return (
    <div className="space-y-4">
      {/* Conversion Method */}
      <div className="p-3 bg-blue-50 rounded border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <div className="text-xs font-medium text-blue-800">
            Traditional Measurement System
          </div>
        </div>

        <div className="text-xs text-blue-700 space-y-1">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="p-1 bg-white rounded border">
              <div className="text-gray-600">1 buhol =</div>
              <div className="font-semibold">50 meters</div>
            </div>
            <div className="p-1 bg-white rounded border">
              <div className="text-gray-600">1 tali =</div>
              <div className="font-semibold">10 buhol</div>
            </div>
            <div className="p-1 bg-white rounded border">
              <div className="text-gray-600">1 luwang =</div>
              <div className="font-semibold">250,000 m²</div>
            </div>
          </div>

          <div className="text-xs text-gray-600">
            Method:{" "}
            <span className="font-medium text-blue-800">
              {measurementMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Square Meters */}
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-green-600" />
            <div className="text-xs font-medium text-green-800">Area (SQM)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">
              {results.areaSqm.toFixed(2)}
            </div>
            <div className="text-xs mt-0.5 text-gray-600">Square Meters</div>
          </div>
        </div>

        {/* Luwang */}
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-yellow-600" />
            <div className="text-xs font-medium text-yellow-800">
              Total Luwang
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-700">
              {results.totalLuwang.toFixed(2)}
            </div>
            <div className="text-xs mt-0.5 text-gray-600">
              Luwang
              <br />
              (250,000 m² per Luwang)
            </div>
          </div>
        </div>

        {/* Hectare */}
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-purple-600" />
            <div className="text-xs font-medium text-purple-800">
              Total Hectare
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-700">
              {results.totalHectare?.toFixed(2)}
            </div>
            <div className="text-xs mt-0.5 text-gray-600">
              Hectare
              <br />
              (20 luwang = 1 hectare)
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Conversion */}
      {buholInputs && Object.keys(buholInputs).length > 0 && (
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-xs">
            <div className="font-medium text-gray-800 mb-2">
              Traditional to Modern Conversion:
            </div>
            <div className="space-y-1 text-gray-700">
              {getConversionExplanation().map((line, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
        <div className="text-xs font-medium text-gray-800 mb-1">Summary:</div>
        <div className="text-xs text-gray-700 space-y-1">
          <div>
            This plot has an area of {results.areaSqm.toFixed(2)} square meters,
          </div>
          <div>
            which is equivalent to {results.totalLuwang.toFixed(2)} luwang,
          </div>
          <div>or {results.totalHectare?.toFixed(2)} hectare.</div>
          <div className="mt-2 text-green-700">
            ✓ Measurement recorded using traditional buhol/tali system
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
