// components/Dialogs/KabisilyaFormDialog.tsx (Placeholder)
import React from 'react';
import { X } from 'lucide-react';

interface KabisilyaFormDialogProps {
    id?: number;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess: () => void;
}

const KabisilyaFormDialog: React.FC<KabisilyaFormDialogProps> = ({
    id,
    mode,
    onClose,
    onSuccess
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {mode === 'add' ? 'Create New Kabisilya' : 'Edit Kabisilya'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <p className="text-gray-600">Form for {mode === 'add' ? 'creating' : 'editing'} kabisilya will be implemented here.</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                // Handle form submission
                                onSuccess();
                            }}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {mode === 'add' ? 'Create' : 'Update'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KabisilyaFormDialog;