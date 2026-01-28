// components/Worker/Dialogs/WorkerViewDialog.tsx
import React, { useState, useEffect } from 'react';
import { X, Edit, User, Mail, Phone, MapPin, Calendar, DollarSign, Users, FileText, History, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import workerAPI from '../../../../apis/worker';
import { showError } from '../../../../utils/notification';
import { formatDate, formatCurrency } from '../../../../utils/formatters';

interface WorkerViewDialogProps {
    id: number;
    onClose: () => void;
    onEdit: (id: number) => void;
}

const WorkerViewDialog: React.FC<WorkerViewDialogProps> = ({ id, onClose, onEdit }) => {
    const [loading, setLoading] = useState(true);
    const [worker, setWorker] = useState<any>(null);

    useEffect(() => {
        fetchWorkerData();
    }, [id]);

    const fetchWorkerData = async () => {
        try {
            setLoading(true);
            const response = await workerAPI.getWorker(id);
            if (response.status && response.data.worker) {
                setWorker(response.data.worker);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to load worker data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return CheckCircle;
            case 'inactive': return XCircle;
            case 'on-leave': return Clock;
            default: return User;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50';
            case 'inactive': return 'text-gray-600 bg-gray-50';
            case 'on-leave': return 'text-yellow-600 bg-yellow-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User className="w-6 h-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-800">Worker Details</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading worker details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!worker) {
        return null;
    }

    const StatusIcon = getStatusIcon(worker.status);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <User className="w-6 h-6 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{worker.name}</h2>
                                <p className="text-sm text-gray-500">Worker ID: {worker.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onEdit(worker.id)}
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Personal Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Information Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                        <p className="font-medium text-gray-800">{worker.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Status</p>
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${getStatusColor(worker.status)}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium capitalize">{worker.status}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <p className="font-medium text-gray-800">{worker.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <p className="font-medium text-gray-800">{worker.contact || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500 mb-1">Address</p>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                            <p className="font-medium text-gray-800">{worker.address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    Financial Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Total Debt</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(worker.totalDebt || 0)}</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(worker.totalPaid || 0)}</p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${(worker.currentBalance || 0) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                        <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                                        <p className={`text-2xl font-bold ${(worker.currentBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(worker.currentBalance || 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500">Last Payment</p>
                                        <p className="font-medium text-gray-800">
                                            {worker.lastPaymentDate ? formatDate(worker.lastPaymentDate, 'MMM dd, yyyy') : 'No payments yet'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Work Info & Timeline */}
                        <div className="space-y-6">
                            {/* Work Information Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    Work Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Hire Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-medium text-gray-800">
                                                {worker.hireDate ? formatDate(worker.hireDate, 'MMM dd, yyyy') : 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Days Employed</p>
                                        <p className="font-medium text-gray-800">
                                            {worker.hireDate ? Math.floor((new Date().getTime() - new Date(worker.hireDate).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Assigned Kabisilya</p>
                                        {worker.kabisilya ? (
                                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                                <Users className="w-4 h-4 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{worker.kabisilya.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {worker.kabisilya.id}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">Not assigned to any kabisilya</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <History className="w-5 h-5 text-gray-600" />
                                    Timeline
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {formatDate(worker.createdAt, 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-500">Last Updated</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {formatDate(worker.updatedAt, 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button className="w-full text-left px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Record Payment
                                    </button>
                                    <button className="w-full text-left px-4 py-3 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Generate Report
                                    </button>
                                    <button className="w-full text-left px-4 py-3 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        View Assigned Tasks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {worker.notes && (
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{worker.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkerViewDialog;