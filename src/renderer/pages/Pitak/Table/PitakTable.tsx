// // components/Pitak/PitakTablePage.tsx
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     Search, Plus,
//     Edit,
//     Trash2,
//     Eye,
//     Download, RefreshCw,
//     ChevronRight,
//     MapPin,
//     Grid,
//     List,
//     ChevronLeft,
//     ChevronRight as ChevronRightIcon,
//     Hash,
//     Clock,
//     Package,
//     CheckCircle,
//     XCircle,
//     AlertCircle,
//     Home,
//     BarChart3, Users,
//     TrendingUp,
//     Crop,
//     User,
//     Calendar,
//     FileText,
//     MoreVertical,
//     Filter,
//     Settings,
//     Upload,
//     BookOpen,
//     Layers,
//     Target,
//     Zap,
//     Shield,
//     AlertTriangle
// } from 'lucide-react';
// import type { PitakFilters, PitakStatsData, PitakWithDetails } from '../../../apis/pitak';
// import pitakAPI from '../../../apis/pitak';
// import workerAPI from '../../../apis/worker';
// import assignmentAPI from '../../../apis/assignment';
// import { showError, showSuccess, showToast } from '../../../utils/notification';
// import { showConfirm, dialogs } from '../../../utils/dialogs';
// import { formatDate, formatNumber } from '../../../utils/formatters';
// import WorkerSelect from '../../../components/Selects/Worker';

// // Interface for assignment dialog
// interface AssignmentDialogData {
//     pitakId: number;
//     workerId: number | null;
//     assignmentDate: string;
//     luwangCount: number;
//     notes?: string;
// }

// // Interface for bulk operations
// interface BulkOperationData {
//     selectedPitaks: number[];
//     operation: 'activate' | 'deactivate' | 'harvest' | 'export' | 'assign';
//     data?: any;
// }

// const PitakTablePage: React.FC = () => {
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     // Data states
//     const [pitaks, setPitaks] = useState<PitakWithDetails[]>([]);
//     const [stats, setStats] = useState<PitakStatsData | null>(null);
//     const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

//     // Pagination
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [totalItems, setTotalItems] = useState(0);
//     const [limit] = useState(20);

//     // Filters
//     const [searchQuery, setSearchQuery] = useState('');
//     const [statusFilter, setStatusFilter] = useState<string>('all');
//     const [bukidFilter, setBukidFilter] = useState<number | null>(null);
//     const [sortBy, setSortBy] = useState<string>('createdAt');
//     const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

//     // View options
//     const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
//     const [selectedPitaks, setSelectedPitaks] = useState<number[]>([]);
//     const [expandedPitak, setExpandedPitak] = useState<number | null>(null);
//     const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
//     const dropdownRef = useRef<HTMLDivElement>(null);

//     // Dialog states
//     const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
//     const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
//     const [showLuWangUpdateDialog, setShowLuWangUpdateDialog] = useState(false);
//     const [showExportDialog, setShowExportDialog] = useState(false);
//     const [showFiltersDialog, setShowFiltersDialog] = useState(false);

//     // Form states
//     const [assignmentData, setAssignmentData] = useState<AssignmentDialogData>({
//         pitakId: 0,
//         workerId: null,
//         assignmentDate: new Date().toISOString().split('T')[0],
//         luwangCount: 0,
//         notes: ''
//     });
//     const [bulkOperation, setBulkOperation] = useState<BulkOperationData>({
//         selectedPitaks: [],
//         operation: 'assign',
//         data: {}
//     });
//     const [luwangUpdateData, setLuWangUpdateData] = useState({
//         pitakId: 0,
//         totalLuwang: 0,
//         adjustmentType: 'set' as 'add' | 'subtract' | 'set',
//         notes: ''
//     });

//     // Fetch pitak data
//     const fetchPitaks = useCallback(async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const filters: PitakFilters = {
//                 page: currentPage,
//                 limit,
//                 sortBy,
//                 sortOrder,
//                 status: statusFilter !== 'all' ? statusFilter : undefined,
//                 bukidId: bukidFilter || undefined
//             };

//             // If search query exists, use search endpoint
//             let response;
//             if (searchQuery.trim()) {
//                 response = await pitakAPI.searchPitaks(searchQuery);
//             } else {
//                 response = await pitakAPI.getAllPitaks(filters);
//             }

//             if (response.status) {
//                 setPitaks(response.data || []);
//                 setTotalPages(response.meta?.totalPages || 1);
//                 setTotalItems(response.meta?.total || 0);

//                 // Update stats if available
//                 if (response.meta?.stats) {
//                     setStats(response.meta.stats);
//                 }
//             } else {
//                 throw new Error(response.message || 'Failed to fetch pitak data');
//             }

//         } catch (err: any) {
//             setError(err.message);
//             showError(err.message);
//             console.error('Failed to fetch pitak data:', err);
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     }, [currentPage, limit, searchQuery, statusFilter, bukidFilter, sortBy, sortOrder]);

//     // Fetch stats separately
//     const fetchStats = async () => {
//         try {
//             const response = await pitakAPI.getPitakStats();
//             if (response.status) {
//                 setStats(response.data);
//             }
//         } catch (err) {
//             console.error('Failed to fetch pitak stats:', err);
//         }
//     };

//     // Fetch available workers
//     const fetchAvailableWorkers = async () => {
//         try {
//             const response = await workerAPI.getActiveWorkers({ limit: 1000 });
//             if (response.status && response.data.workers) {
//                 setAvailableWorkers(response.data.workers);
//             }
//         } catch (err) {
//             console.error('Failed to fetch workers:', err);
//         }
//     };

//     // Initial load
//     useEffect(() => {
//         fetchPitaks();
//         fetchStats();
//         fetchAvailableWorkers();
//     }, [fetchPitaks]);

//     // Close dropdown when clicking outside
//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//                 setActiveDropdown(null);
//             }
//         };

//         document.addEventListener('mousedown', handleClickOutside);
//         return () => document.removeEventListener('mousedown', handleClickOutside);
//     }, []);

//     // Refresh function
//     const handleRefresh = async () => {
//         setRefreshing(true);
//         await Promise.all([fetchPitaks(), fetchStats(), fetchAvailableWorkers()]);
//     };

//     // Search handler with debounce
//     useEffect(() => {
//         const timer = setTimeout(() => {
//             if (currentPage !== 1) {
//                 setCurrentPage(1);
//             } else {
//                 fetchPitaks();
//             }
//         }, 500);

//         return () => clearTimeout(timer);
//     }, [searchQuery, fetchPitaks]);

//     // Handle status filter change
//     const handleStatusFilterChange = (status: string) => {
//         setStatusFilter(status);
//         setCurrentPage(1);
//     };

//     // Handle sort
//     const handleSort = (field: string) => {
//         if (sortBy === field) {
//             setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//         } else {
//             setSortBy(field);
//             setSortOrder('asc');
//         }
//         setCurrentPage(1);
//     };

//     // Selection handlers
//     const toggleSelectAll = () => {
//         if (selectedPitaks.length === pitaks.length) {
//             setSelectedPitaks([]);
//         } else {
//             setSelectedPitaks(pitaks.map(p => p.id));
//         }
//     };

//     const toggleSelectPitak = (id: number) => {
//         setSelectedPitaks(prev =>
//             prev.includes(id)
//                 ? prev.filter(item => item !== id)
//                 : [...prev, id]
//         );
//     };

//     // Action handlers
//     const handleViewPitak = (id: number) => {
//         navigate(`/farms/pitak/view/${id}`);
//     };

//     const handleEditPitak = (id: number) => {
//         navigate(`/farms/pitak/form/${id}`);
//     };

//     const handleCreatePitak = () => {
//         navigate('/farms/pitak/form');
//     };

//     const handleDeletePitak = async (id: number, location?: string) => {
//         const confirmed = await showConfirm({
//             title: 'Delete Pitak',
//             message: `Are you sure you want to delete this pitak ${location ? `at ${location}` : ''}?`,
//             icon: 'danger',
//             confirmText: 'Delete',
//             cancelText: 'Cancel'
//         });

//         if (!confirmed) return;

//         try {
//             showToast('Deleting pitak...', 'info');
//             const response = await pitakAPI.deletePitak(id);

//             if (response.status) {
//                 showSuccess(`Pitak deleted successfully`);
//                 fetchPitaks();
//                 fetchStats();
//                 setSelectedPitaks(prev => prev.filter(item => item !== id));
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to delete pitak');
//         }
//     };

//     // Assignment functionality
//     const handleAssignWorker = async (pitakId: number) => {
//         const pitak = pitaks.find(p => p.id === pitakId);
//         if (!pitak) return;

//         // Check pitak availability
//         try {
//             const availability = await pitakAPI.checkPitakAvailability(pitakId);
//             if (!availability.data.isAvailable) {
//                 showError(`Pitak is not available. ${availability.data.reasons?.join(', ')}`);
//                 return;
//             }
//         } catch (err) {
//             console.error('Error checking pitak availability:', err);
//         }

//         setAssignmentData({
//             pitakId,
//             workerId: null,
//             assignmentDate: new Date().toISOString().split('T')[0],
//             luwangCount: pitak.totalLuwang > 0 ? Math.min(100, pitak.totalLuwang) : 100,
//             notes: ''
//         });
//         setShowAssignmentDialog(true);
//     };

//     const handleSubmitAssignment = async () => {
//         if (!assignmentData.workerId) {
//             showError('Please select a worker');
//             return;
//         }

//         if (assignmentData.luwangCount <= 0) {
//             showError('Please enter a valid luwang count');
//             return;
//         }

//         try {
//             showToast('Creating assignment...', 'info');

//             // Validate capacity first
//             const capacityResponse = await pitakAPI.validateLuWangCapacity(
//                 assignmentData.pitakId,
//                 assignmentData.luwangCount,
//                 assignmentData.assignmentDate
//             );

//             if (!capacityResponse.data.canAccommodate) {
//                 showError(`Cannot assign ${assignmentData.luwangCount} luwang. ${capacityResponse.data.recommendations?.[0]?.message}`);
//                 return;
//             }

//             // Check worker availability
//             const workerAvailable = await assignmentAPI.isWorkerAvailable(
//                 assignmentData.workerId,
//                 assignmentData.assignmentDate
//             );

//             if (!workerAvailable) {
//                 showError('Selected worker is not available on this date');
//                 return;
//             }

//             // Create assignment
//             const response = await assignmentAPI.createAssignment({
//                 workerId: assignmentData.workerId,
//                 pitakId: assignmentData.pitakId,
//                 luwangCount: assignmentData.luwangCount,
//                 assignmentDate: assignmentData.assignmentDate,
//                 notes: assignmentData.notes
//             });

//             if (response.status) {
//                 showSuccess('Assignment created successfully');
//                 setShowAssignmentDialog(false);
//                 fetchPitaks(); // Refresh to show updated assignments

//                 // Also fetch assignments for this pitak
//                 const assignments = await pitakAPI.getPitakWithAssignments(assignmentData.pitakId);
//                 if (assignments.status) {
//                     // Update the specific pitak in state
//                     setPitaks(prev => prev.map(p =>
//                         p.id === assignmentData.pitakId
//                             ? { ...p, assignments: assignments.data.assignments }
//                             : p
//                     ));
//                 }
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to create assignment');
//         }
//     };

//     // LuWang update functionality
//     const handleUpdateLuWang = (pitakId: number) => {
//         const pitak = pitaks.find(p => p.id === pitakId);
//         if (!pitak) return;

//         setLuWangUpdateData({
//             pitakId,
//             totalLuwang: pitak.totalLuwang,
//             adjustmentType: 'set',
//             notes: ''
//         });
//         setShowLuWangUpdateDialog(true);
//     };

//     const handleSubmitLuWangUpdate = async () => {
//         try {
//             showToast('Updating luwang capacity...', 'info');

//             const response = await pitakAPI.updatePitakLuWang(
//                 luwangUpdateData.pitakId,
//                 luwangUpdateData.totalLuwang,
//                 luwangUpdateData.adjustmentType,
//                 luwangUpdateData.notes
//             );

//             if (response.status) {
//                 showSuccess('LuWang capacity updated successfully');
//                 setShowLuWangUpdateDialog(false);
//                 fetchPitaks();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to update luwang capacity');
//         }
//     };

//     // Bulk operations
//     const handleBulkAssign = () => {
//         if (selectedPitaks.length === 0) {
//             showError('Please select at least one pitak');
//             return;
//         }

//         setBulkOperation({
//             selectedPitaks,
//             operation: 'assign',
//             data: {
//                 workerId: null,
//                 assignmentDate: new Date().toISOString().split('T')[0],
//                 luwangCount: 0,
//                 notes: ''
//             }
//         });
//         setShowBulkAssignDialog(true);
//     };

//     const handleSubmitBulkAssign = async () => {
//         if (!bulkOperation.data.workerId) {
//             showError('Please select a worker');
//             return;
//         }

//         if (bulkOperation.data.luwangCount <= 0) {
//             showError('Please enter a valid luwang count');
//             return;
//         }

//         try {
//             showToast(`Creating assignments for ${bulkOperation.selectedPitaks.length} pitaks...`, 'info');

//             const assignments = bulkOperation.selectedPitaks.map(pitakId => ({
//                 workerId: bulkOperation.data.workerId,
//                 pitakId,
//                 luwangCount: bulkOperation.data.luwangCount,
//                 assignmentDate: bulkOperation.data.assignmentDate,
//                 notes: bulkOperation.data.notes
//             }));

//             const response = await assignmentAPI.bulkCreateAssignments(assignments);

//             if (response.status) {
//                 showSuccess(`Created ${response.data.created?.length || 0} assignments successfully`);
//                 if (response.data.skipped?.length > 0) {
//                     showError(`Skipped ${response.data.skipped.length} assignments due to errors`);
//                 }
//                 setShowBulkAssignDialog(false);
//                 setSelectedPitaks([]);
//                 fetchPitaks();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to create bulk assignments');
//         }
//     };

//     const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'harvested') => {
//         if (selectedPitaks.length === 0) return;

//         const actionMap = {
//             active: 'activate',
//             inactive: 'deactivate',
//             harvested: 'mark as harvested'
//         };

//         const confirmed = await showConfirm({
//             title: `Bulk ${actionMap[status]}`,
//             message: `Are you sure you want to ${actionMap[status]} ${selectedPitaks.length} selected pitak(s)?`,
//             icon: 'warning',
//             confirmText: `Yes, ${actionMap[status]}`,
//             cancelText: 'Cancel'
//         });

//         if (!confirmed) return;

//         try {
//             showToast(`${actionMap[status]}ing selected pitaks...`, 'info');

//             const results = await Promise.allSettled(
//                 selectedPitaks.map(id =>
//                     status === 'harvested'
//                         ? pitakAPI.markPitakAsHarvested(id)
//                         : pitakAPI.updatePitakStatus(id, status)
//                 )
//             );

//             const successful = results.filter(r => r.status === 'fulfilled' && r.value?.status);
//             const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

//             if (failed.length === 0) {
//                 showSuccess(`Successfully ${actionMap[status]}ed ${successful.length} pitak(s)`);
//             } else {
//                 showError(`${actionMap[status].charAt(0).toUpperCase() + actionMap[status].slice(1)}ed ${successful.length} pitak(s), failed to ${actionMap[status]} ${failed.length} pitak(s)`);
//             }

//             fetchPitaks();
//             fetchStats();
//             setSelectedPitaks([]);
//         } catch (err: any) {
//             showError(err.message || `Failed to ${actionMap[status]} pitaks`);
//         }
//     };

//     // Export functionality
//     const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
//         try {
//             showToast(`Exporting pitak data...`, 'info');

//             let response;
//             if (format === 'csv') {
//                 const filters: PitakFilters = {
//                     status: statusFilter !== 'all' ? statusFilter : undefined,
//                     bukidId: bukidFilter || undefined
//                 };
//                 response = await pitakAPI.exportPitaksToCSV(filters);
//             } else {
//                 // For PDF, you would need to implement or use a different endpoint
//                 showError('PDF export not yet implemented');
//                 return;
//             }

//             if (response.status) {
//                 // Create download link
//                 const link = document.createElement('a');
//                 const blob = new Blob([response.data.csv], { type: 'text/csv' });
//                 const url = URL.createObjectURL(blob);
//                 link.href = url;
//                 link.download = response.data.filename;
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//                 URL.revokeObjectURL(url);

//                 showSuccess(`Exported ${response.data.count} records`);
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to export data');
//         }
//     };

//     // View assignments for pitak
//     const handleViewAssignments = async (pitakId: number) => {
//         try {
//             showToast('Loading assignments...', 'info');
//             const response = await pitakAPI.getPitakWithAssignments(pitakId);

//             if (response.status && response.data.assignments) {
//                 const assignments = response.data.assignments;
//                 if (assignments.length === 0) {
//                     dialogs.info('No assignments found for this pitak');
//                 } else {
//                     // Navigate to assignments page or show in modal
//                     navigate(`/assignments?pitakId=${pitakId}`);
//                 }
//             } else {
//                 throw new Error(response.message || 'Failed to load assignments');
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to load assignments');
//         }
//     };

//     // View pitak report
//     const handleViewReport = async (pitakId: number) => {
//         try {
//             const today = new Date();
//             const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
//                 .toISOString().split('T')[0];
//             const endDate = today.toISOString().split('T')[0];

//             showToast('Generating report...', 'info');
//             const response = await pitakAPI.getPitakReport(
//                 { startDate, endDate },
//                 { bukidId: pitakId }
//             );

//             if (response.status) {
//                 // Navigate to report view or open in new tab
//                 navigate(`/reports/pitak/${pitakId}`, {
//                     state: { reportData: response.data }
//                 });
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to generate report');
//         }
//     };

//     // Check pitak capacity
//     const handleCheckCapacity = async (pitakId: number) => {
//         try {
//             const response = await pitakAPI.validateLuWangCapacity(pitakId, 0);

//             if (response.status) {
//                 const capacity = response.data;
//                 const message = `
//                     Total Capacity: ${formatNumber(capacity.totalCapacity)} luwang
//                     Currently Assigned: ${formatNumber(capacity.currentlyAssigned)} luwang
//                     Remaining: ${formatNumber(capacity.remainingCapacity)} luwang
//                     Utilization: ${capacity.utilizationRate.toFixed(1)}%
                    
//                     ${capacity.recommendations?.map(r => `• ${r.message}`).join('\n')}
//                 `;

//                 dialogs.info(message.trim(), 'Capacity Information');
//             }
//         } catch (err) {
//             console.error('Error checking capacity:', err);
//             showError('Failed to check capacity');
//         }
//     };

//     // Transfer pitak to different bukid
//     const handleTransferBukid = async (pitakId: number) => {
//         // This would open a dialog to select new bukid
//         // For now, just show a message
//         dialogs.info('This feature is under development. Please use the edit form to change bukid.', 'Transfer Bukid');
//     };

//     // Toggle dropdown
//     const toggleDropdown = (pitakId: number) => {
//         setActiveDropdown(activeDropdown === pitakId ? null : pitakId);
//     };

//     // Get status badge
//     const getStatusBadge = (status: string = 'active') => {
//         const statusConfig = {
//             active: {
//                 text: 'Active',
//                 bg: 'var(--status-planted-bg)',
//                 color: 'var(--status-planted)',
//                 border: 'rgba(56, 161, 105, 0.3)',
//                 icon: CheckCircle
//             },
//             inactive: {
//                 text: 'Inactive',
//                 bg: 'var(--status-fallow-bg)',
//                 color: 'var(--status-fallow)',
//                 border: 'rgba(113, 128, 150, 0.3)',
//                 icon: XCircle
//             },
//             harvested: {
//                 text: 'Harvested',
//                 bg: 'var(--accent-gold-light)',
//                 color: 'var(--accent-gold)',
//                 border: 'rgba(214, 158, 46, 0.3)',
//                 icon: Crop
//             }
//         };

//         const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
//         const Icon = config.icon;

//         return (
//             <span
//                 className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
//                 style={{
//                     background: config.bg,
//                     color: config.color,
//                     border: `1px solid ${config.border}`
//                 }}
//             >
//                 <Icon className="w-3 h-3" />
//                 {config.text}
//             </span>
//         );
//     };

//     // Loading state
//     if (loading && !refreshing) {
//         return (
//             <div className="flex items-center justify-center h-96">
//                 <div className="text-center">
//                     <div
//                         className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-3 transition-colors duration-300"
//                         style={{ borderColor: 'var(--primary-color)' }}
//                     ></div>
//                     <p className="text-sm transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
//                         Loading pitak data...
//                     </p>
//                 </div>
//             </div>
//         );
//     }

//     // Error state
//     if (error && !pitaks.length) {
//         return (
//             <div className="text-center p-8">
//                 <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
//                 <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
//                     Error Loading Pitak Data
//                 </p>
//                 <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{error}</p>
//                 <button
//                     onClick={handleRefresh}
//                     className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center mx-auto"
//                     style={{
//                         background: 'var(--primary-color)',
//                         color: 'var(--sidebar-text)'
//                     }}
//                 >
//                     <RefreshCw className="w-4 h-4 mr-2" />
//                     Retry
//                 </button>
//             </div>
//         );
//     }

//     // function toggleExpandPitak(id: number): void {
//     //     throw new Error('Function not implemented.');
//     // }

//     // function handleMarkAsHarvested(id: number) {
//     //     throw new Error('Function not implemented.');
//     // }

//     // function handleUpdatePitakStatus(id: number, status: string) {
//     //     throw new Error('Function not implemented.');
//     // }

//     // function handleBulkDelete(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
//     //     throw new Error('Function not implemented.');
//     // }



//     // Toggle pitak expansion
//     const toggleExpandPitak = (id: number): void => {
//         setExpandedPitak(prev => prev === id ? null : id);
//     };

//     // Mark pitak as harvested
//     const handleMarkAsHarvested = async (id: number) => {
//         const pitak = pitaks.find(p => p.id === id);
//         if (!pitak) return;

//         const confirmed = await showConfirm({
//             title: 'Mark as Harvested',
//             message: `Are you sure you want to mark "${pitak.location || 'this pitak'}" as harvested? This will change its status and may affect assignments.`,
//             icon: 'warning',
//             confirmText: 'Mark as Harvested',
//             cancelText: 'Cancel'
//         });

//         if (!confirmed) return;

//         try {
//             showToast('Marking pitak as harvested...', 'info');

//             // Check if there are active assignments
//             if (pitak.stats && pitak.stats.assignments.active > 0) {
//                 const resolveAssignments = await showConfirm({
//                     title: 'Active Assignments Found',
//                     message: `This pitak has ${pitak.stats.assignments.active} active assignment(s). Do you want to cancel them before marking as harvested?`,
//                     icon: 'question',
//                     confirmText: 'Cancel & Mark as Harvested',
//                     cancelText: 'Just Mark as Harvested'
//                 });

//                 if (resolveAssignments) {
//                     // Cancel active assignments
//                     const cancelPromises = pitak.assignments
//                         ?.filter(a => a.status === 'active')
//                         .map(assignment =>
//                             assignmentAPI.cancelAssignment(assignment.id, 'Pitak marked as harvested')
//                         ) || [];

//                     await Promise.all(cancelPromises);
//                 }
//             }

//             // Mark pitak as harvested
//             const response = await pitakAPI.markPitakAsHarvested(id, `Marked as harvested on ${new Date().toLocaleDateString()}`);

//             if (response.status) {
//                 showSuccess('Pitak marked as harvested successfully');

//                 // Update local state
//                 setPitaks(prev => prev.map(p =>
//                     p.id === id
//                         ? { ...p, status: 'harvested', updatedAt: new Date().toISOString() }
//                         : p
//                 ));

//                 // Refresh stats
//                 fetchStats();

//                 // Close expanded view if open
//                 if (expandedPitak === id) {
//                     setExpandedPitak(null);
//                 }
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to mark pitak as harvested');
//         }
//     };

//     // Update pitak status (active/inactive)
//     const handleUpdatePitakStatus = async (id: number, currentStatus: string) => {
//         const pitak = pitaks.find(p => p.id === id);
//         if (!pitak) return;

//         const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
//         const action = newStatus === 'active' ? 'activate' : 'deactivate';
//         const actionPast = newStatus === 'active' ? 'activated' : 'deactivated';

//         const confirmed = await showConfirm({
//             title: `${action.charAt(0).toUpperCase() + action.slice(1)} Pitak`,
//             message: `Are you sure you want to ${action} "${pitak.location || 'this pitak'}"?`,
//             icon: 'warning',
//             confirmText: action.charAt(0).toUpperCase() + action.slice(1),
//             cancelText: 'Cancel'
//         });

//         if (!confirmed) return;

//         try {
//             showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing pitak...`, 'info');

//             // If deactivating, check for active assignments
//             if (newStatus === 'inactive' && pitak.stats && pitak.stats.assignments.active > 0) {
//                 const resolveAssignments = await showConfirm({
//                     title: 'Active Assignments Found',
//                     message: `This pitak has ${pitak.stats.assignments.active} active assignment(s). Do you want to handle them before deactivating?`,
//                     icon: 'question',
//                     confirmText: 'Cancel Assignments',
//                     cancelText: 'Keep Assignments Active'
//                 });

//                 if (resolveAssignments) {
//                     // Cancel active assignments
//                     const cancelPromises = pitak.assignments
//                         ?.filter(a => a.status === 'active')
//                         .map(assignment =>
//                             assignmentAPI.cancelAssignment(assignment.id, 'Pitak deactivated')
//                         ) || [];

//                     await Promise.all(cancelPromises);
//                 }
//             }

//             // Update pitak status
//             const response = await pitakAPI.updatePitakStatus(
//                 id,
//                 newStatus,
//                 `Status changed from ${currentStatus} to ${newStatus} on ${new Date().toLocaleDateString()}`
//             );

//             if (response.status) {
//                 showSuccess(`Pitak ${actionPast} successfully`);

//                 // Update local state
//                 setPitaks(prev => prev.map(p =>
//                     p.id === id
//                         ? {
//                             ...p,
//                             status: newStatus,
//                             updatedAt: new Date().toISOString(),
//                             stats: p.stats ? {
//                                 ...p.stats,
//                                 assignments: {
//                                     ...p.stats.assignments,
//                                     active: newStatus === 'inactive' ? 0 : p.stats.assignments.active
//                                 }
//                             } : p.stats
//                         }
//                         : p
//                 ));

//                 // Refresh stats
//                 fetchStats();

//                 // Close expanded view if open
//                 if (expandedPitak === id) {
//                     setExpandedPitak(null);
//                 }
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || `Failed to ${action} pitak`);
//         }
//     };

//     // Bulk delete pitaks
//     const handleBulkDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
//         event.preventDefault();

//         if (selectedPitaks.length === 0) {
//             showError('Please select at least one pitak to delete');
//             return;
//         }

//         // Get selected pitak details for confirmation message
//         const selectedPitakDetails = pitaks
//             .filter(p => selectedPitaks.includes(p.id))
//             .map(p => p.location || `Pitak #${p.id}`);

//         const confirmed = await showConfirm({
//             title: 'Bulk Delete Confirmation',
//             message: `Are you sure you want to delete ${selectedPitaks.length} selected pitak(s)?\n\nSelected: ${selectedPitakDetails.join(', ')}\n\nThis action cannot be undone and will also delete all associated assignments.`,
//             icon: 'danger',
//             confirmText: 'Delete All',
//             cancelText: 'Cancel',
//             persistent: true
//         });

//         if (!confirmed) return;

//         try {
//             showToast(`Deleting ${selectedPitaks.length} pitaks...`, 'info');

//             // Check for pitaks with active assignments first
//             const pitaksWithActiveAssignments = pitaks.filter(p =>
//                 selectedPitaks.includes(p.id) &&
//                 p.stats &&
//                 p.stats.assignments.active > 0
//             );

//             if (pitaksWithActiveAssignments.length > 0) {
//                 const resolveAssignments = await showConfirm({
//                     title: 'Active Assignments Found',
//                     message: `${pitaksWithActiveAssignments.length} selected pitak(s) have active assignments. Do you want to cancel them before deleting?`,
//                     icon: 'warning',
//                     confirmText: 'Cancel & Delete',
//                     cancelText: 'Delete Anyway'
//                 });

//                 if (resolveAssignments) {
//                     // Cancel all active assignments for selected pitaks
//                     for (const pitak of pitaksWithActiveAssignments) {
//                         if (pitak.assignments) {
//                             const activeAssignments = pitak.assignments.filter(a => a.status === 'active');
//                             for (const assignment of activeAssignments) {
//                                 try {
//                                     await assignmentAPI.cancelAssignment(
//                                         assignment.id,
//                                         'Pitak deleted'
//                                     );
//                                 } catch (err) {
//                                     console.error(`Failed to cancel assignment ${assignment.id}:`, err);
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }

//             // Delete pitaks in batches to avoid overwhelming the API
//             const batchSize = 5;
//             const results = {
//                 successful: [] as number[],
//                 failed: [] as Array<{ id: number, error: string }>
//             };

//             for (let i = 0; i < selectedPitaks.length; i += batchSize) {
//                 const batch = selectedPitaks.slice(i, i + batchSize);

//                 const batchResults = await Promise.allSettled(
//                     batch.map(async (id) => {
//                         try {
//                             const response = await pitakAPI.deletePitak(id, true); // force delete
//                             if (response.status) {
//                                 results.successful.push(id);
//                             } else {
//                                 throw new Error(response.message || 'Delete failed');
//                             }
//                         } catch (error: any) {
//                             results.failed.push({
//                                 id,
//                                 error: error.message || 'Unknown error'
//                             });
//                         }
//                     })
//                 );

//                 // Show progress
//                 showToast(`Processed ${Math.min(i + batchSize, selectedPitaks.length)} of ${selectedPitaks.length} pitaks...`, 'info');
//             }

//             // Show results
//             if (results.failed.length === 0) {
//                 showSuccess(`Successfully deleted ${results.successful.length} pitak(s)`);
//             } else {
//                 showError(
//                     `Deleted ${results.successful.length} pitak(s), failed to delete ${results.failed.length} pitak(s)\n\n` +
//                     `Failures:\n${results.failed.map(f => `• Pitak #${f.id}: ${f.error}`).join('\n')}`
//                 );
//             }

//             // Refresh data
//             await Promise.all([fetchPitaks(), fetchStats()]);

//             // Clear selection
//             setSelectedPitaks([]);

//             // Clear any expanded pitak that was deleted
//             if (expandedPitak && selectedPitaks.includes(expandedPitak)) {
//                 setExpandedPitak(null);
//             }

//         } catch (err: any) {
//             showError(err.message || 'Failed to delete pitaks');
//         }
//     };

//     return (
//         <div className="space-y-6 p-6">
//             {/* Header */}
//             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                 <div>
//                     <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
//                         <MapPin className="w-6 h-6" />
//                         Pitak Management
//                     </h1>
//                     <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
//                         Manage planting areas, track luwang capacity, and monitor utilization
//                     </p>
//                 </div>

//                 <div className="flex flex-wrap gap-3">
//                     <button
//                         onClick={() => setShowExportDialog(true)}
//                         className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
//                         style={{
//                             background: 'var(--card-secondary-bg)',
//                             color: 'var(--text-secondary)',
//                             border: '1px solid var(--border-color)'
//                         }}
//                     >
//                         <Download className="w-4 h-4 mr-2" />
//                         Export
//                     </button>

//                     <button
//                         onClick={handleCreatePitak}
//                         className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
//                         style={{
//                             background: 'var(--primary-color)',
//                             color: 'var(--sidebar-text)'
//                         }}
//                     >
//                         <Plus className="w-4 h-4 mr-2" />
//                         New Pitak
//                     </button>
//                 </div>
//             </div>

//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                 <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                     style={{
//                         background: 'var(--card-bg)',
//                         border: '1px solid var(--border-color)'
//                     }}
//                 >
//                     <div className="flex justify-between items-start mb-4">
//                         <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
//                             <MapPin className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
//                         </div>
//                         <span className="px-3 py-1 rounded-full text-xs font-medium"
//                             style={{
//                                 background: 'var(--accent-green-light)',
//                                 color: 'var(--accent-green)'
//                             }}
//                         >
//                             Total
//                         </span>
//                     </div>
//                     <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                         {stats?.totalPitaks || 0}
//                     </h3>
//                     <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Pitak</p>
//                 </div>

//                 <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                     style={{
//                         background: 'var(--card-bg)',
//                         border: '1px solid var(--border-color)'
//                     }}
//                 >
//                     <div className="flex justify-between items-start mb-4">
//                         <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
//                             <CheckCircle className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
//                         </div>
//                         <span className="px-3 py-1 rounded-full text-xs font-medium"
//                             style={{
//                                 background: 'var(--accent-green-light)',
//                                 color: 'var(--accent-green)'
//                             }}
//                         >
//                             Active
//                         </span>
//                     </div>
//                     <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                         {stats?.activePitaks || 0}
//                     </h3>
//                     <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Pitak</p>
//                 </div>

//                 <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                     style={{
//                         background: 'var(--card-bg)',
//                         border: '1px solid var(--border-color)'
//                     }}
//                 >
//                     <div className="flex justify-between items-start mb-4">
//                         <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
//                             <Hash className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
//                         </div>
//                         <span className="px-3 py-1 rounded-full text-xs font-medium"
//                             style={{
//                                 background: 'var(--accent-purple-light)',
//                                 color: 'var(--accent-purple)'
//                             }}
//                         >
//                             Capacity
//                         </span>
//                     </div>
//                     <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                         {formatNumber(stats?.totalLuWangCapacity || 0)}
//                     </h3>
//                     <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Luwang Capacity</p>
//                 </div>

//                 <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                     style={{
//                         background: 'var(--card-bg)',
//                         border: '1px solid var(--border-color)'
//                     }}
//                 >
//                     <div className="flex justify-between items-start mb-4">
//                         <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
//                             <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
//                         </div>
//                         <span className="px-3 py-1 rounded-full text-xs font-medium"
//                             style={{
//                                 background: 'var(--accent-sky-light)',
//                                 color: 'var(--accent-sky)'
//                             }}
//                         >
//                             Utilization
//                         </span>
//                     </div>
//                     <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                         {stats?.utilizationRate ? `${stats.utilizationRate.toFixed(1)}%` : '0%'}
//                     </h3>
//                     <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Average Utilization Rate</p>
//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-5 rounded-xl"
//                 style={{
//                     background: 'var(--card-bg)',
//                     border: '1px solid var(--border-color)'
//                 }}
//             >
//                 <div className="flex flex-col sm:flex-row gap-3 flex-1">
//                     {/* Search */}
//                     <div className="relative flex-1 sm:max-w-xs">
//                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
//                         <input
//                             type="text"
//                             placeholder="Search pitak by location, bukid..."
//                             value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                             className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
//                             style={{
//                                 background: 'var(--input-bg)',
//                                 border: '1px solid var(--input-border)',
//                                 color: 'var(--text-primary)'
//                             }}
//                         />
//                     </div>

//                     {/* Status Filter */}
//                     <div className="flex gap-2 flex-wrap">
//                         {['all', 'active', 'inactive', 'harvested'].map((status) => (
//                             <button
//                                 key={status}
//                                 onClick={() => handleStatusFilterChange(status)}
//                                 className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === status ? '' : 'opacity-70 hover:opacity-100'}`}
//                                 style={{
//                                     background: statusFilter === status ? 'var(--primary-color)' : 'var(--card-secondary-bg)',
//                                     color: statusFilter === status ? 'var(--sidebar-text)' : 'var(--text-secondary)',
//                                     border: '1px solid var(--border-color)'
//                                 }}
//                             >
//                                 {status.charAt(0).toUpperCase() + status.slice(1)}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                     {/* View Toggle */}
//                     <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
//                         <button
//                             onClick={() => setViewMode('table')}
//                             className={`p-2 ${viewMode === 'table' ? 'bg-gray-100' : 'bg-white'}`}
//                             style={{ color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
//                         >
//                             <List className="w-4 h-4" />
//                         </button>
//                         <button
//                             onClick={() => setViewMode('grid')}
//                             className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
//                             style={{ color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
//                         >
//                             <Grid className="w-4 h-4" />
//                         </button>
//                     </div>

//                     {/* Filters Button */}
//                     <button
//                         onClick={() => setShowFiltersDialog(true)}
//                         className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
//                         style={{
//                             background: 'var(--card-secondary-bg)',
//                             color: 'var(--text-secondary)',
//                             border: '1px solid var(--border-color)'
//                         }}
//                     >
//                         <Filter className="w-4 h-4" />
//                     </button>

//                     {/* Refresh */}
//                     <button
//                         onClick={handleRefresh}
//                         disabled={refreshing}
//                         className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
//                         style={{
//                             background: 'var(--card-secondary-bg)',
//                             color: 'var(--text-secondary)',
//                             border: '1px solid var(--border-color)'
//                         }}
//                     >
//                         <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                     </button>
//                 </div>
//             </div>

//             {/* Bulk Actions */}
//             {selectedPitaks.length > 0 && (
//                 <div className="p-4 rounded-xl flex items-center justify-between"
//                     style={{
//                         background: 'var(--card-hover-bg)',
//                         border: '1px solid var(--border-color)'
//                     }}
//                 >
//                     <div className="flex items-center gap-3">
//                         <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
//                             {selectedPitaks.length} pitak(s) selected
//                         </span>
//                     </div>
//                     <div className="flex flex-wrap gap-2">
//                         <button
//                             onClick={handleBulkAssign}
//                             className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
//                             style={{
//                                 background: 'var(--accent-sky)',
//                                 color: 'white'
//                             }}
//                         >
//                             <User className="w-4 h-4 mr-2" />
//                             Assign Workers
//                         </button>
//                         <button
//                             onClick={() => handleBulkStatusChange('active')}
//                             className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
//                             style={{
//                                 background: 'var(--accent-green)',
//                                 color: 'white'
//                             }}
//                         >
//                             <CheckCircle className="w-4 h-4 mr-2" />
//                             Activate All
//                         </button>
//                         <button
//                             onClick={() => handleBulkStatusChange('inactive')}
//                             className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
//                             style={{
//                                 background: 'var(--accent-gold)',
//                                 color: 'white'
//                             }}
//                         >
//                             <XCircle className="w-4 h-4 mr-2" />
//                             Deactivate All
//                         </button>
//                         <button
//                             onClick={handleBulkDelete}
//                             className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
//                             style={{
//                                 background: 'var(--accent-rust)',
//                                 color: 'white'
//                             }}
//                         >
//                             <Trash2 className="w-4 h-4 mr-2" />
//                             Delete Selected
//                         </button>
//                         <button
//                             onClick={() => setSelectedPitaks([])}
//                             className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
//                             style={{
//                                 background: 'var(--card-secondary-bg)',
//                                 color: 'var(--text-secondary)',
//                                 border: '1px solid var(--border-color)'
//                             }}
//                         >
//                             Clear Selection
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* Table View */}
//             {viewMode === 'table' ? (
//                 <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
//                     <div className="overflow-x-auto">
//                         <table className="w-full">
//                             <thead>
//                                 <tr style={{ background: 'var(--table-header-bg)' }}>
//                                     <th className="p-4 text-left">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedPitaks.length === pitaks.length && pitaks.length > 0}
//                                             onChange={toggleSelectAll}
//                                             className="rounded"
//                                             style={{ borderColor: 'var(--border-color)' }}
//                                         />
//                                     </th>
//                                     <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
//                                         <button
//                                             onClick={() => handleSort('location')}
//                                             className="flex items-center gap-1 hover:text-primary"
//                                         >
//                                             Location
//                                             {sortBy === 'location' && (
//                                                 <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
//                                             )}
//                                         </button>
//                                     </th>
//                                     <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
//                                         Bukid
//                                     </th>
//                                     <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
//                                         <button
//                                             onClick={() => handleSort('totalLuwang')}
//                                             className="flex items-center gap-1 hover:text-primary"
//                                         >
//                                             Luwang Capacity
//                                             {sortBy === 'totalLuwang' && (
//                                                 <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
//                                             )}
//                                         </button>
//                                     </th>
//                                     <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
//                                         Status
//                                     </th>
//                                     <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
//                                         <button
//                                             onClick={() => handleSort('createdAt')}
//                                             className="flex items-center gap-1 hover:text-primary"
//                                         >
//                                             Created
//                                             {sortBy === 'createdAt' && (
//                                                 <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
//                                             )}
//                                         </button>
//                                     </th>
//                                     <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
//                                         Actions
//                                     </th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {pitaks.map((pitak) => (
//                                     <React.Fragment key={pitak.id}>
//                                         <tr className="hover:bg-gray-50 transition-colors"
//                                             style={{ borderBottom: '1px solid var(--border-color)' }}
//                                         >
//                                             <td className="p-4">
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={selectedPitaks.includes(pitak.id)}
//                                                     onChange={() => toggleSelectPitak(pitak.id)}
//                                                     className="rounded"
//                                                     style={{ borderColor: 'var(--border-color)' }}
//                                                 />
//                                             </td>
//                                             <td className="p-4">
//                                                 <div className="flex items-center gap-3">
//                                                     <div className="p-2 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
//                                                         <MapPin className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
//                                                     </div>
//                                                     <div>
//                                                         <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
//                                                             {pitak.location || 'No location'}
//                                                         </div>
//                                                         {pitak.stats && (
//                                                             <div className="flex items-center gap-2 mt-1">
//                                                                 <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                                                     <Package className="w-3 h-3 inline mr-1" />
//                                                                     {pitak.stats.assignments.total} assignments
//                                                                 </span>
//                                                                 <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                                                     <Users className="w-3 h-3 inline mr-1" />
//                                                                     {pitak.stats.assignments.active} active
//                                                                 </span>
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                             <td className="p-4">
//                                                 <div className="flex items-center gap-2">
//                                                     <Home className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
//                                                     <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
//                                                         {pitak.bukid?.name || `Bukid #${pitak.bukidId}`}
//                                                     </span>
//                                                 </div>
//                                             </td>
//                                             <td className="p-4">
//                                                 <div className="flex items-center gap-2">
//                                                     <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
//                                                     <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
//                                                         {formatNumber(pitak.totalLuwang)}
//                                                     </span>
//                                                 </div>
//                                                 {pitak.stats && (
//                                                     <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
//                                                         Used: {formatNumber(pitak.stats.assignments.totalLuWangAssigned)} ({pitak.stats.utilizationRate.toFixed(1)}%)
//                                                     </div>
//                                                 )}
//                                             </td>
//                                             <td className="p-4">
//                                                 {getStatusBadge(pitak.status)}
//                                             </td>
//                                             <td className="p-4">
//                                                 <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
//                                                     {formatDate(pitak.createdAt, 'MMM dd, yyyy')}
//                                                 </div>
//                                             </td>
//                                             <td className="p-4">
//                                                 <div className="flex items-center gap-2 relative" ref={dropdownRef}>
//                                                     <button
//                                                         onClick={() => handleViewPitak(pitak.id)}
//                                                         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                                         title="View Details"
//                                                     >
//                                                         <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
//                                                     </button>
//                                                     <button
//                                                         onClick={() => handleEditPitak(pitak.id)}
//                                                         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                                         title="Edit"
//                                                     >
//                                                         <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
//                                                     </button>
//                                                     <div className="relative">
//                                                         <button
//                                                             onClick={() => toggleDropdown(pitak.id)}
//                                                             className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                                             title="More Actions"
//                                                         >
//                                                             <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
//                                                         </button>

//                                                         {activeDropdown === pitak.id && (
//                                                             <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
//                                                                 <div className="py-1">
//                                                                     <button
//                                                                         onClick={() => {
//                                                                             handleAssignWorker(pitak.id);
//                                                                             setActiveDropdown(null);
//                                                                         }}
//                                                                         className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                     >
//                                                                         <User className="w-4 h-4" />
//                                                                         Assign Worker
//                                                                     </button>
//                                                                     <button
//                                                                         onClick={() => {
//                                                                             handleViewAssignments(pitak.id);
//                                                                             setActiveDropdown(null);
//                                                                         }}
//                                                                         className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                     >
//                                                                         <BookOpen className="w-4 h-4" />
//                                                                         View Assignments
//                                                                     </button>
//                                                                     <button
//                                                                         onClick={() => {
//                                                                             handleUpdateLuWang(pitak.id);
//                                                                             setActiveDropdown(null);
//                                                                         }}
//                                                                         className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                     >
//                                                                         <Layers className="w-4 h-4" />
//                                                                         Update LuWang
//                                                                     </button>
//                                                                     <button
//                                                                         onClick={() => {
//                                                                             handleCheckCapacity(pitak.id);
//                                                                             setActiveDropdown(null);
//                                                                         }}
//                                                                         className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                     >
//                                                                         <Target className="w-4 h-4" />
//                                                                         Check Capacity
//                                                                     </button>
//                                                                     <button
//                                                                         onClick={() => {
//                                                                             handleViewReport(pitak.id);
//                                                                             setActiveDropdown(null);
//                                                                         }}
//                                                                         className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                     >
//                                                                         <FileText className="w-4 h-4" />
//                                                                         Generate Report
//                                                                     </button>
//                                                                     <div className="border-t my-1"></div>
//                                                                     {pitak.status !== 'harvested' && (
//                                                                         <>
//                                                                             <button
//                                                                                 onClick={() => {
//                                                                                     handleUpdatePitakStatus(pitak.id, pitak.status);
//                                                                                     setActiveDropdown(null);
//                                                                                 }}
//                                                                                 className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                             >
//                                                                                 {pitak.status === 'active' ? (
//                                                                                     <>
//                                                                                         <XCircle className="w-4 h-4" />
//                                                                                         Deactivate
//                                                                                     </>
//                                                                                 ) : (
//                                                                                     <>
//                                                                                         <CheckCircle className="w-4 h-4" />
//                                                                                         Activate
//                                                                                     </>
//                                                                                 )}
//                                                                             </button>
//                                                                             <button
//                                                                                 onClick={() => {
//                                                                                     handleMarkAsHarvested(pitak.id);
//                                                                                     setActiveDropdown(null);
//                                                                                 }}
//                                                                                 className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
//                                                                             >
//                                                                                 <Crop className="w-4 h-4" />
//                                                                                 Mark as Harvested
//                                                                             </button>
//                                                                         </>
//                                                                     )}
//                                                                     <div className="border-t my-1"></div>
//                                                                     <button
//                                                                         onClick={() => {
//                                                                             handleDeletePitak(pitak.id, pitak.location || undefined);
//                                                                             setActiveDropdown(null);
//                                                                         }}
//                                                                         className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-red-50 text-red-600 text-left"
//                                                                     >
//                                                                         <Trash2 className="w-4 h-4" />
//                                                                         Delete
//                                                                     </button>
//                                                                 </div>
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                     <button
//                                                         onClick={() => toggleExpandPitak(pitak.id)}
//                                                         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                                         title="More Details"
//                                                     >
//                                                         <ChevronRight className={`w-4 h-4 transition-transform ${expandedPitak === pitak.id ? 'rotate-90' : ''}`} />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>

//                                         {/* Expanded Row */}
//                                         {expandedPitak === pitak.id && pitak.stats && (
//                                             <tr>
//                                                 <td colSpan={7} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
//                                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                                                         <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
//                                                             <div className="flex items-center gap-2 mb-2">
//                                                                 <Package className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
//                                                                 <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
//                                                                     Assignments
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {pitak.stats.assignments.total}
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {pitak.stats.assignments.active}
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {pitak.stats.assignments.completed}
//                                                                 </span>
//                                                             </div>
//                                                         </div>

//                                                         <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
//                                                             <div className="flex items-center gap-2 mb-2">
//                                                                 <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
//                                                                 <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
//                                                                     Luwang
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Capacity:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {formatNumber(pitak.totalLuwang)}
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assigned:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {formatNumber(pitak.stats.assignments.totalLuWangAssigned)}
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Utilization:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {pitak.stats.utilizationRate.toFixed(1)}%
//                                                                 </span>
//                                                             </div>
//                                                         </div>

//                                                         <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
//                                                             <div className="flex items-center gap-2 mb-2">
//                                                                 <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
//                                                                 <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
//                                                                     Payments
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     {pitak.stats.payments.total}
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gross Pay:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     ₱{formatNumber(pitak.stats.payments.totalGrossPay)}
//                                                                 </span>
//                                                             </div>
//                                                             <div className="flex justify-between">
//                                                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Net Pay:</span>
//                                                                 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                                                     ₱{formatNumber(pitak.stats.payments.totalNetPay)}
//                                                                 </span>
//                                                             </div>
//                                                         </div>

//                                                         <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
//                                                             <div className="flex items-center gap-2 mb-2">
//                                                                 <Clock className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
//                                                                 <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
//                                                                     Last Updated
//                                                                 </span>
//                                                             </div>
//                                                             <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
//                                                                 {formatDate(pitak.updatedAt, 'MMM dd, yyyy HH:mm')}
//                                                             </div>
//                                                             <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
//                                                                 ID: {pitak.id}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <div className="mt-4 flex gap-2">
//                                                         <button
//                                                             onClick={() => handleAssignWorker(pitak.id)}
//                                                             className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-2"
//                                                             style={{
//                                                                 background: 'var(--accent-sky)',
//                                                                 color: 'white'
//                                                             }}
//                                                         >
//                                                             <User className="w-3 h-3" />
//                                                             Assign Worker
//                                                         </button>
//                                                         <button
//                                                             onClick={() => handleViewAssignments(pitak.id)}
//                                                             className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-2"
//                                                             style={{
//                                                                 background: 'var(--card-secondary-bg)',
//                                                                 color: 'var(--text-secondary)',
//                                                                 border: '1px solid var(--border-color)'
//                                                             }}
//                                                         >
//                                                             <BookOpen className="w-3 h-3" />
//                                                             View Assignments
//                                                         </button>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </React.Fragment>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             ) : (
//                 /* Grid View */
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {pitaks.map((pitak) => (
//                         <div
//                             key={pitak.id}
//                             className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative"
//                             style={{
//                                 background: 'var(--card-bg)',
//                                 border: '1px solid var(--border-color)'
//                             }}
//                         >
//                             {/* Selection checkbox */}
//                             <div className="absolute top-3 right-3">
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedPitaks.includes(pitak.id)}
//                                     onChange={() => toggleSelectPitak(pitak.id)}
//                                     className="rounded"
//                                     style={{ borderColor: 'var(--border-color)' }}
//                                 />
//                             </div>

//                             {/* Header */}
//                             <div className="flex items-start gap-3 mb-4">
//                                 <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
//                                     <MapPin className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
//                                 </div>
//                                 <div className="flex-1">
//                                     <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
//                                         {pitak.location || 'No location'}
//                                     </h3>
//                                     <div className="flex items-center gap-2 mb-2">
//                                         <Home className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
//                                         <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
//                                             {pitak.bukid?.name || `Bukid #${pitak.bukidId}`}
//                                         </span>
//                                     </div>
//                                     {getStatusBadge(pitak.status)}
//                                 </div>
//                             </div>

//                             {/* Stats */}
//                             {pitak.stats && (
//                                 <div className="grid grid-cols-2 gap-3 mb-4">
//                                     <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                         <Package className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-sky)' }} />
//                                         <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
//                                             {pitak.stats.assignments.total}
//                                         </div>
//                                         <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assignments</div>
//                                     </div>
//                                     <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                         <Hash className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-gold)' }} />
//                                         <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
//                                             {formatNumber(pitak.totalLuwang)}
//                                         </div>
//                                         <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Capacity</div>
//                                     </div>
//                                     <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                         <BarChart3 className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-purple)' }} />
//                                         <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
//                                             {pitak.stats.utilizationRate.toFixed(1)}%
//                                         </div>
//                                         <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Utilization</div>
//                                     </div>
//                                     <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                         <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-earth)' }} />
//                                         <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
//                                             ₱{formatNumber(pitak.stats.payments.totalNetPay)}
//                                         </div>
//                                         <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Net Pay</div>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Bukid Info */}
//                             <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
//                                 <div className="flex items-center justify-between">
//                                     <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
//                                         Bukid: {pitak.bukid?.name}
//                                     </div>
//                                     {pitak.bukid?.kabisilya && (
//                                         <div className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
//                                             Kab: {pitak.bukid.kabisilya.name}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Footer */}
//                             <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
//                                 <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
//                                     Created {formatDate(pitak.createdAt, 'MMM dd, yyyy')}
//                                 </div>
//                                 <div className="flex items-center gap-1">
//                                     <button
//                                         onClick={() => handleViewPitak(pitak.id)}
//                                         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                         title="View"
//                                     >
//                                         <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
//                                     </button>
//                                     <button
//                                         onClick={() => handleEditPitak(pitak.id)}
//                                         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                         title="Edit"
//                                     >
//                                         <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
//                                     </button>
//                                     <button
//                                         onClick={() => handleAssignWorker(pitak.id)}
//                                         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//                                         title="Assign Worker"
//                                     >
//                                         <User className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {/* Empty State */}
//             {pitaks.length === 0 && !loading && (
//                 <div className="text-center py-12">
//                     <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
//                     <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
//                         No Pitak Found
//                     </h3>
//                     <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
//                         {searchQuery
//                             ? `No results found for "${searchQuery}". Try a different search term.`
//                             : 'No pitak have been created yet. Get started by creating your first pitak.'}
//                     </p>
//                     {!searchQuery && (
//                         <button
//                             onClick={handleCreatePitak}
//                             className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
//                             style={{
//                                 background: 'var(--primary-color)',
//                                 color: 'var(--sidebar-text)'
//                             }}
//                         >
//                             <Plus className="w-4 h-4 mr-2" />
//                             Create First Pitak
//                         </button>
//                     )}
//                 </div>
//             )}

//             {/* Pagination */}
//             {pitaks.length > 0 && totalPages > 1 && (
//                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
//                     style={{
//                         background: 'var(--card-bg)',
//                         border: '1px solid var(--border-color)'
//                     }}
//                 >
//                     <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
//                         Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} pitak
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button
//                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                             disabled={currentPage === 1}
//                             className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
//                             style={{
//                                 background: currentPage === 1 ? 'var(--card-secondary-bg)' : 'var(--card-bg)',
//                                 border: '1px solid var(--border-color)',
//                                 color: 'var(--text-primary)'
//                             }}
//                         >
//                             <ChevronLeft className="w-4 h-4" />
//                         </button>

//                         {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                             let pageNum;
//                             if (totalPages <= 5) {
//                                 pageNum = i + 1;
//                             } else if (currentPage <= 3) {
//                                 pageNum = i + 1;
//                             } else if (currentPage >= totalPages - 2) {
//                                 pageNum = totalPages - 4 + i;
//                             } else {
//                                 pageNum = currentPage - 2 + i;
//                             }

//                             return (
//                                 <button
//                                     key={pageNum}
//                                     onClick={() => setCurrentPage(pageNum)}
//                                     className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === pageNum ? '' : 'hover:shadow-md'}`}
//                                     style={{
//                                         background: currentPage === pageNum ? 'var(--primary-color)' : 'var(--card-bg)',
//                                         color: currentPage === pageNum ? 'var(--sidebar-text)' : 'var(--text-primary)',
//                                         border: `1px solid ${currentPage === pageNum ? 'var(--primary-color)' : 'var(--border-color)'}`
//                                     }}
//                                 >
//                                     {pageNum}
//                                 </button>
//                             );
//                         })}

//                         <button
//                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                             disabled={currentPage === totalPages}
//                             className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
//                             style={{
//                                 background: currentPage === totalPages ? 'var(--card-secondary-bg)' : 'var(--card-bg)',
//                                 border: '1px solid var(--border-color)',
//                                 color: 'var(--text-primary)'
//                             }}
//                         >
//                             <ChevronRightIcon className="w-4 h-4" />
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* Assignment Dialog */}
//             {showAssignmentDialog && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl w-full max-w-md">
//                         <div className="p-6 border-b">
//                             <h3 className="text-lg font-semibold">Assign Worker to Pitak</h3>
//                         </div>
//                         <div className="p-6 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Select Worker</label>
//                                 <WorkerSelect
//                                     value={assignmentData.workerId}
//                                     onChange={(workerId) => setAssignmentData({ ...assignmentData, workerId })}
//                                     placeholder="Choose a worker"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Assignment Date</label>
//                                 <input
//                                     type="date"
//                                     value={assignmentData.assignmentDate}
//                                     onChange={(e) => setAssignmentData({ ...assignmentData, assignmentDate: e.target.value })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">LuWang Count</label>
//                                 <input
//                                     type="number"
//                                     value={assignmentData.luwangCount}
//                                     onChange={(e) => setAssignmentData({ ...assignmentData, luwangCount: parseInt(e.target.value) || 0 })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                     min="1"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
//                                 <textarea
//                                     value={assignmentData.notes}
//                                     onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                     rows={3}
//                                 />
//                             </div>
//                         </div>
//                         <div className="p-6 border-t flex justify-end gap-3">
//                             <button
//                                 onClick={() => setShowAssignmentDialog(false)}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium"
//                                 style={{
//                                     background: 'var(--card-secondary-bg)',
//                                     color: 'var(--text-secondary)',
//                                     border: '1px solid var(--border-color)'
//                                 }}
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleSubmitAssignment}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium text-white"
//                                 style={{
//                                     background: 'var(--primary-color)'
//                                 }}
//                             >
//                                 Assign Worker
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Bulk Assignment Dialog */}
//             {showBulkAssignDialog && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl w-full max-w-md">
//                         <div className="p-6 border-b">
//                             <h3 className="text-lg font-semibold">Bulk Assign Workers</h3>
//                             <p className="text-sm text-gray-600 mt-1">
//                                 Assign the same worker to {bulkOperation.selectedPitaks.length} selected pitaks
//                             </p>
//                         </div>
//                         <div className="p-6 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Select Worker</label>
//                                 <WorkerSelect
//                                     value={bulkOperation.data.workerId}
//                                     onChange={(workerId) => setBulkOperation({
//                                         ...bulkOperation,
//                                         data: { ...bulkOperation.data, workerId }
//                                     })}
//                                     placeholder="Choose a worker"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Assignment Date</label>
//                                 <input
//                                     type="date"
//                                     value={bulkOperation.data.assignmentDate}
//                                     onChange={(e) => setBulkOperation({
//                                         ...bulkOperation,
//                                         data: { ...bulkOperation.data, assignmentDate: e.target.value }
//                                     })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">LuWang Count per Pitak</label>
//                                 <input
//                                     type="number"
//                                     value={bulkOperation.data.luwangCount}
//                                     onChange={(e) => setBulkOperation({
//                                         ...bulkOperation,
//                                         data: { ...bulkOperation.data, luwangCount: parseInt(e.target.value) || 0 }
//                                     })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                     min="1"
//                                 />
//                             </div>
//                         </div>
//                         <div className="p-6 border-t flex justify-end gap-3">
//                             <button
//                                 onClick={() => setShowBulkAssignDialog(false)}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium"
//                                 style={{
//                                     background: 'var(--card-secondary-bg)',
//                                     color: 'var(--text-secondary)',
//                                     border: '1px solid var(--border-color)'
//                                 }}
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleSubmitBulkAssign}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium text-white"
//                                 style={{
//                                     background: 'var(--primary-color)'
//                                 }}
//                             >
//                                 Assign to All Selected
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* LuWang Update Dialog */}
//             {showLuWangUpdateDialog && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl w-full max-w-md">
//                         <div className="p-6 border-b">
//                             <h3 className="text-lg font-semibold">Update LuWang Capacity</h3>
//                         </div>
//                         <div className="p-6 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Adjustment Type</label>
//                                 <select
//                                     value={luwangUpdateData.adjustmentType}
//                                     onChange={(e) => setLuWangUpdateData({
//                                         ...luwangUpdateData,
//                                         adjustmentType: e.target.value as 'add' | 'subtract' | 'set'
//                                     })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                 >
//                                     <option value="set">Set to Value</option>
//                                     <option value="add">Add to Current</option>
//                                     <option value="subtract">Subtract from Current</option>
//                                 </select>
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">
//                                     {luwangUpdateData.adjustmentType === 'set' ? 'New LuWang Capacity' :
//                                         luwangUpdateData.adjustmentType === 'add' ? 'Amount to Add' : 'Amount to Subtract'}
//                                 </label>
//                                 <input
//                                     type="number"
//                                     value={luwangUpdateData.totalLuwang}
//                                     onChange={(e) => setLuWangUpdateData({
//                                         ...luwangUpdateData,
//                                         totalLuwang: parseInt(e.target.value) || 0
//                                     })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                     min="0"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
//                                 <textarea
//                                     value={luwangUpdateData.notes}
//                                     onChange={(e) => setLuWangUpdateData({
//                                         ...luwangUpdateData,
//                                         notes: e.target.value
//                                     })}
//                                     className="w-full p-3 rounded-lg text-sm"
//                                     style={{
//                                         background: 'var(--input-bg)',
//                                         border: '1px solid var(--input-border)',
//                                         color: 'var(--text-primary)'
//                                     }}
//                                     rows={3}
//                                 />
//                             </div>
//                         </div>
//                         <div className="p-6 border-t flex justify-end gap-3">
//                             <button
//                                 onClick={() => setShowLuWangUpdateDialog(false)}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium"
//                                 style={{
//                                     background: 'var(--card-secondary-bg)',
//                                     color: 'var(--text-secondary)',
//                                     border: '1px solid var(--border-color)'
//                                 }}
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleSubmitLuWangUpdate}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium text-white"
//                                 style={{
//                                     background: 'var(--primary-color)'
//                                 }}
//                             >
//                                 Update Capacity
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Export Dialog */}
//             {showExportDialog && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl w-full max-w-md">
//                         <div className="p-6 border-b">
//                             <h3 className="text-lg font-semibold">Export Pitak Data</h3>
//                         </div>
//                         <div className="p-6 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-2">Export Format</label>
//                                 <div className="flex gap-3">
//                                     <button
//                                         onClick={() => handleExport('csv')}
//                                         className="flex-1 p-4 rounded-lg border text-center hover:shadow-md transition-all"
//                                         style={{
//                                             background: 'var(--card-bg)',
//                                             border: '2px solid var(--primary-color)',
//                                             color: 'var(--text-primary)'
//                                         }}
//                                     >
//                                         <Download className="w-8 h-8 mx-auto mb-2" />
//                                         <div className="font-medium">CSV</div>
//                                         <div className="text-xs text-gray-600">Excel compatible</div>
//                                     </button>
//                                     <button
//                                         onClick={() => handleExport('pdf')}
//                                         className="flex-1 p-4 rounded-lg border text-center hover:shadow-md transition-all"
//                                         style={{
//                                             background: 'var(--card-bg)',
//                                             border: '1px solid var(--border-color)',
//                                             color: 'var(--text-primary)'
//                                         }}
//                                     >
//                                         <FileText className="w-8 h-8 mx-auto mb-2" />
//                                         <div className="font-medium">PDF</div>
//                                         <div className="text-xs text-gray-600">Printable report</div>
//                                     </button>
//                                 </div>
//                             </div>
//                             <div className="text-sm text-gray-600">
//                                 <p>Export will include:</p>
//                                 <ul className="list-disc pl-5 mt-2 space-y-1">
//                                     <li>Pitak basic information</li>
//                                     <li>LuWang capacity and utilization</li>
//                                     <li>Assignment statistics</li>
//                                     <li>Payment information</li>
//                                 </ul>
//                             </div>
//                         </div>
//                         <div className="p-6 border-t flex justify-end gap-3">
//                             <button
//                                 onClick={() => setShowExportDialog(false)}
//                                 className="px-4 py-2 rounded-lg text-sm font-medium"
//                                 style={{
//                                     background: 'var(--card-secondary-bg)',
//                                     color: 'var(--text-secondary)',
//                                     border: '1px solid var(--border-color)'
//                                 }}
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default PitakTablePage;