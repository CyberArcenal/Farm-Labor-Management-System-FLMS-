import React from 'react';
import { Hash, TrendingUp, TrendingDown, Target, X, Calculator, FileText } from 'lucide-react';

interface LuWangUpdateDialogProps {
  data: any;
  onChange: (data: any) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const LuWangUpdateDialog: React.FC<LuWangUpdateDialogProps> = ({
  data,
  onChange,
  onSubmit,
  onClose
}) => {
  const handleInputChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({ ...data, [field]: numValue });
  };

  const adjustmentTypes = [
    { id: 'set', label: 'Set New Value', icon: Target, color: 'text-blue-600' },
    { id: 'add', label: 'Add to Current', icon: TrendingUp, color: 'text-green-600' },
    { id: 'subtract', label: 'Subtract from Current', icon: TrendingDown, color: 'text-yellow-600' },
  ];

  const getCurrentValue = () => {
    return data.currentLuWang || 0;
  };

  const calculateNewValue = () => {
    const current = getCurrentValue();
    const change = data.totalLuwang || 0;
    
    switch (data.adjustmentType) {
      case 'add':
        return current + change;
      case 'subtract':
        return Math.max(0, current - change);
      case 'set':
      default:
        return change;
    }
  };

  const newValue = calculateNewValue();
  const currentValue = getCurrentValue();
  const difference = newValue - currentValue;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <Hash className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Update LuWang Capacity</h3>
              <p className="text-xs text-gray-600">Adjust LuWang capacity for this pitak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Current & New Capacity Summary */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Current Capacity</div>
              <div className="text-xl font-bold text-gray-900">{currentValue.toLocaleString()}</div>
              <div className="text-xs text-gray-500">LuWang</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs font-medium text-gray-600 mb-1">New Capacity</div>
              <div className="text-xl font-bold text-gray-900">{newValue.toLocaleString()}</div>
              <div className={`text-xs font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {difference >= 0 ? '+' : ''}{difference.toLocaleString()} LuWang
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-240px)] p-4">
          <div className="space-y-4">
            {/* Adjustment Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Adjustment Type
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {adjustmentTypes.map(type => {
                  const Icon = type.icon;
                  const isSelected = data.adjustmentType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleInputChange('adjustmentType', type.id)}
                      className={`p-3 rounded border flex flex-col items-center gap-1 transition-colors ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : type.color}`} />
                      <span className="text-xs font-medium text-gray-900 text-center">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Value Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-gray-500" />
                  {data.adjustmentType === 'set' ? 'New LuWang Capacity' :
                   data.adjustmentType === 'add' ? 'Amount to Add' : 'Amount to Subtract'}
                  <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={data.totalLuwang || ''}
                  onChange={(e) => handleNumberChange('totalLuwang', e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded text-sm border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  min="0"
                  step="0.1"
                  placeholder="Enter amount"
                />
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                {data.adjustmentType === 'set' && 'This will set the total capacity to the specified value'}
                {data.adjustmentType === 'add' && `This will add ${data.totalLuwang || 0} to the current capacity`}
                {data.adjustmentType === 'subtract' && `This will subtract ${data.totalLuwang || 0} from the current capacity`}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  Notes (Optional)
                </div>
              </label>
              <textarea
                value={data.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 rounded text-sm border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                rows={3}
                placeholder="Explain the reason for this adjustment..."
              />
              <p className="text-xs text-gray-500">
                This note will be recorded in the pitak's history log.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Required fields</span> are marked with *
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={!data.totalLuwang || data.totalLuwang < 0 || !data.adjustmentType}
                className="px-3 py-1.5 rounded text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Capacity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuWangUpdateDialog;