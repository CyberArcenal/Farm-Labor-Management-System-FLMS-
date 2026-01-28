import React from 'react';
import { Download, FileText, X } from 'lucide-react';

interface ExportDialogProps {
  onExport: (format: 'csv' | 'pdf') => void;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onExport, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div
        className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-md shadow-2xl border border-white/20"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export Pitak Data</h3>
              <p className="text-sm text-gray-600">Choose format to export pitak information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              Export Format <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onExport('csv')}
                type="button"
                className="p-4 rounded-xl border transition-all duration-200 flex flex-col items-center border-purple-500 bg-purple-50 ring-2 ring-purple-200 hover:shadow-md"
              >
                <Download className="w-8 h-8 text-purple-600 mb-2" />
                <div className="text-sm font-medium text-gray-900">CSV</div>
                <div className="text-xs text-gray-500">Excel compatible</div>
              </button>
              <button
                onClick={() => onExport('pdf')}
                type="button"
                className="p-4 rounded-xl border transition-all duration-200 flex flex-col items-center border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                <div className="text-sm font-medium text-gray-900">PDF</div>
                <div className="text-xs text-gray-500">Printable report</div>
              </button>
            </div>
          </div>

          {/* Export Details */}
          <div className="text-sm text-gray-600">
            <p>Export will include:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Pitak basic information</li>
              <li>LuWang capacity and utilization</li>
              <li>Assignment statistics</li>
              <li>Payment information</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100"
            style={{
              background: 'white',
              color: '#4b5563',
              border: '1px solid #e5e7eb',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;