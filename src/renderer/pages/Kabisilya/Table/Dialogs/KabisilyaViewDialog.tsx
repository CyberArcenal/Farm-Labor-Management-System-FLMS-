// components/Dialogs/KabisilyaViewDialog.tsx (Placeholder)
import React from 'react';
import { X, Edit } from 'lucide-react';

interface KabisilyaViewDialogProps {
    id: number;
    onClose: () => void;
    onEdit: (id: number) => void;
}

const KabisilyaViewDialog: React.FC<KabisilyaViewDialogProps> = ({
    id,
    onClose,
    onEdit
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Kabisilya Details</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <p className="text-gray-600">Detailed view for kabisilya ID: {id} will be implemented here.</p>
                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KabisilyaViewDialog;