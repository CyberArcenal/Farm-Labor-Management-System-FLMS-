// PitakViewDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, MapPin, TreePalm, Calendar, FileText, LandPlot, Ruler, Info, ClipboardList, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Copy, Edit
} from 'lucide-react';
import type { PitakWithDetails } from '../../../apis/pitak';
import pitakAPI from '../../../apis/pitak';
import { showError } from '../../../utils/notification';
import { formatDate, formatCurrency } from '../../../utils/formatters';

interface PitakViewDialogProps {
    id: number;
    onClose: () => void;
    onEdit?: (id: number) => void;
}

const PitakViewDialog: React.FC<PitakViewDialogProps> = ({
    id,
    onClose,
    onEdit
}) => {
    const [loading, setLoading] = useState(true);
    const [pitak, setPitak] = useState<PitakWithDetails | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'assignments' | 'payments' | 'stats'>('details');

    // Fetch pitak data
    useEffect(() => {
        const fetchPitakData = async () => {
            try {
                setLoading(true);
                const response = await pitakAPI.getPitakById(id);

                if (response.status && response.data) {
                    setPitak(response.data);
                } else {
                    showError('Failed to load pitak data');
                    onClose();
                }
            } catch (error) {
                console.error('Error fetching pitak data:', error);
                showError('Failed to load pitak data');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPitakData();
        }
    }, [id, onClose]);

    // Calculate utilization color
    const getUtilizationColor = (rate: number) => {
        if (rate >= 80) return 'text-red-600';
        if (rate >= 60) return 'text-yellow-600';
        return 'text-green-600';
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    border: 'border-green-200',
                    icon: CheckCircle
                };
            case 'inactive':
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    border: 'border-gray-200',
                    icon: XCircle
                };
            case 'harvested':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    border: 'border-yellow-200',
                    icon: Calendar
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    border: 'border-gray-200',
                    icon: Info
                };
        }
    };

    // Handle copy to clipboard
    const handleCopyDetails = () => {
        if (!pitak) return;

        const details = `
Pitak #${pitak.id}
Farm: ${pitak.bukid?.name || 'N/A'}
Location: ${pitak.location || 'N/A'}
LuWang Capacity: ${pitak.totalLuwang.toFixed(2)}
Status: ${pitak.status}
Utilization: ${pitak.stats?.utilizationRate || 0}%
Created: ${formatDate(pitak.createdAt)}
Updated: ${formatDate(pitak.updatedAt)}
        `.trim();

        navigator.clipboard.writeText(details);
        // You can add a toast notification here
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200">
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600">Loading pitak details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!pitak) {
        return null;
    }

    const statusBadge = getStatusBadge(pitak.status);
    const StatusIcon = statusBadge.icon;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-5xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                            <LandPlot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Pitak #{pitak.id}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {pitak.status.charAt(0).toUpperCase() + pitak.status.slice(1)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{pitak.location || 'No specific location'}</span>
                                <span className="text-gray-400">•</span>
                                <span>Farm: {pitak.bukid?.name || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(pitak.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                                title="Edit Pitak"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleCopyDetails}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            title="Copy Details"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex px-4">
                        {['details', 'assignments', 'payments', 'stats'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab
                                    ? 'border-green-600 text-green-700 bg-white'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-150px)] p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">LuWang Capacity</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {pitak.totalLuwang.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Total capacity</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <Ruler className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Utilization Rate</div>
                                            <div className={`text-2xl font-bold ${getUtilizationColor(pitak.stats?.utilizationRate || 0)}`}>
                                                {pitak.stats?.utilizationRate?.toFixed(1) || 0}%
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {pitak.stats?.assignments?.totalLuWangAssigned?.toFixed(2) || 0} assigned
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Assignments</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {pitak.stats?.assignments?.total || 0}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex gap-1">
                                                <span className="text-green-600">{pitak.stats?.assignments?.completed || 0} done</span>
                                                <span>•</span>
                                                <span>{pitak.stats?.assignments?.active || 0} active</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <ClipboardList className="w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Total Payments</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {pitak.stats?.payments?.total || 0}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatCurrency(pitak.stats?.payments?.totalNetPay || 0)}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-amber-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Information */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Farm Information */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TreePalm className="w-5 h-5 text-green-600" />
                                            <h4 className="text-base font-semibold text-gray-900">Farm Information</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Farm Name</label>
                                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <TreePalm className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{pitak.bukid?.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Kabisilya</label>
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <span className="text-sm text-gray-900">
                                                        {pitak.bukid?.kabisilya?.name || 'Not assigned'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Farm Location</label>
                                                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-900">
                                                        {pitak.bukid?.location || 'No location specified'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* LuWang Details */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Ruler className="w-5 h-5 text-blue-600" />
                                            <h4 className="text-base font-semibold text-gray-900">LuWang Details</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <div className="text-2xl font-bold text-blue-700">
                                                        {pitak.totalLuwang.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-blue-600 mt-1">Total Capacity</div>
                                                </div>
                                                <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                    <div className={`text-2xl font-bold ${getUtilizationColor(pitak.stats?.utilizationRate || 0)}`}>
                                                        {pitak.stats?.utilizationRate?.toFixed(1) || 0}%
                                                    </div>
                                                    <div className="text-xs text-emerald-600 mt-1">Utilization</div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-2">Capacity Breakdown</label>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Assigned LuWang</span>
                                                        <span className="font-medium text-gray-900">
                                                            {pitak.stats?.assignments?.totalLuWangAssigned?.toFixed(2) || '0.00'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Remaining Capacity</span>
                                                        <span className="font-medium text-emerald-600">
                                                            {(pitak.totalLuwang - (pitak.stats?.assignments?.totalLuWangAssigned || 0)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Status & Timeline */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="w-5 h-5 text-purple-600" />
                                            <h4 className="text-base font-semibold text-gray-900">Status & Timeline</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Current Status</label>
                                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <StatusIcon className="w-4 h-4" />
                                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                                        {pitak.status}
                                                    </span>
                                                    <span className="ml-auto text-xs text-gray-500">
                                                        {pitak.status === 'active' ? 'Available for assignments' :
                                                            pitak.status === 'inactive' ? 'Not available' :
                                                                'Harvesting completed'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-gray-600">Created</span>
                                                    </div>
                                                    <span className="text-gray-900">{formatDate(pitak.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        <span className="text-gray-600">Last Updated</span>
                                                    </div>
                                                    <span className="text-gray-900">{formatDate(pitak.updatedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {pitak.notes && (
                                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <FileText className="w-5 h-5 text-amber-600" />
                                                <h4 className="text-base font-semibold text-gray-900">Additional Notes</h4>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                <p className="text-sm text-gray-700 whitespace-pre-line">
                                                    {pitak.notes}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">Assignments</h4>
                                <span className="text-sm text-gray-500">
                                    {pitak.assignments?.length || 0} total assignments
                                </span>
                            </div>
                            {pitak.assignments && pitak.assignments.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Assignment ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Worker
                                                </th>
                                                <th className="px 4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    LuWang
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pitak.assignments.map((assignment) => (
                                                <tr key={assignment.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        #{assignment.id}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {formatDate(assignment.assignmentDate)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {assignment.worker?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        <span className="font-medium">{assignment.luwangCount}</span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${assignment.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : assignment.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {assignment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Assignments</h4>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        This pitak doesn't have any assignments yet. Assignments will appear here when workers are assigned to this plot.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">Payments</h4>
                                {pitak.stats?.payments && (
                                    <div className="text-sm text-gray-500">
                                        Total: {formatCurrency(pitak.stats.payments.totalNetPay)}
                                    </div>
                                )}
                            </div>
                            {pitak.payments && pitak.payments.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Payment ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Worker
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Gross Pay
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Net Pay
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pitak.payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        #{payment.id}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {formatDate(payment.paymentDate)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {payment.worker?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {formatCurrency(payment.grossPay)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        <span className="font-medium text-green-600">
                                                            {formatCurrency(payment.netPay)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${payment.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : payment.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Payments</h4>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        No payment records found for this pitak. Payments will appear here when workers receive payments for assignments on this plot.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'stats' && pitak.stats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Assignment Statistics */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Assignment Statistics</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Assignments</span>
                                            <span className="text-lg font-bold text-gray-900">{pitak.stats.assignments.total}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total LuWang Assigned</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                {pitak.stats.assignments.totalLuWangAssigned?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Completed Assignments</span>
                                            <span className="text-lg font-bold text-green-600">{pitak.stats.assignments.completed}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Active Assignments</span>
                                            <span className="text-lg font-bold text-yellow-600">{pitak.stats.assignments.active}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Statistics */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Payment Statistics</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Payments</span>
                                            <span className="text-lg font-bold text-gray-900">{pitak.stats.payments.total}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Gross Pay</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                {formatCurrency(pitak.stats.payments.totalGrossPay)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Net Pay</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(pitak.stats.payments.totalNetPay)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Completed Payments</span>
                                            <span className="text-lg font-bold text-green-600">{pitak.stats.payments.completed}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Utilization Chart (Simple) */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-gray-900">Capacity Utilization</h4>
                                    <span className={`text-lg font-bold ${getUtilizationColor(pitak.stats.utilizationRate)}`}>
                                        {pitak.stats.utilizationRate?.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${pitak.stats.utilizationRate >= 80 ? 'bg-red-500' :
                                                pitak.stats.utilizationRate >= 60 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                            }`}
                                        style={{ width: `${Math.min(pitak.stats.utilizationRate, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                    <span>0%</span>
                                    <span>Capacity Used: {(pitak.stats.assignments.totalLuWangAssigned || 0).toFixed(2)} LuWang</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            Last updated: {formatDate(pitak.updatedAt)}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyDetails}
                                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copy Details
                            </button>
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PitakViewDialog;