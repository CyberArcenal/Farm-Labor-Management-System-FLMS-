// // src/components/Dialogs/KabisilyaViewDialog.tsx
// import React, { useState, useEffect } from 'react';
// import {
//     X, User, LandPlot, Calendar, Hash, Edit, Trash2,
//     Users, MapPin, Clock, AlertCircle, BarChart3,
//     ChevronRight, FileText, CheckCircle, XCircle
// } from 'lucide-react';
// import kabisilyaAPI from '../../../../apis/kabisilya';
// import { showError } from '../../../../utils/notification';

// interface KabisilyaViewDialogProps {
//     id: number;
//     onClose: () => void;
//     onEdit?: (id: number) => void;
//     onDelete?: () => void;
//     onAssignWorker?: () => void;
//     onAssignBukid?: () => void;
// }

// const KabisilyaViewDialog: React.FC<KabisilyaViewDialogProps> = ({
//     id,
//     onClose,
//     onEdit,
//     onDelete,
//     onAssignWorker,
//     onAssignBukid
// }) => {
//     const [loading, setLoading] = useState(true);
//     const [kabisilya, setKabisilya] = useState<any>(null);
//     const [workers, setWorkers] = useState<any[]>([]);
//     const [bukids, setBukids] = useState<any[]>([]);
//     const [stats, setStats] = useState<any>(null);
//     const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'bukids'>('overview');
//     const [error, setError] = useState<string | null>(null);

//     // Fetch kabisilya data
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);

//                 // Fetch kabisilya details
//                 const kabisilyaResponse = await kabisilyaAPI.getById(id);
//                 if (!kabisilyaResponse.status) {
//                     throw new Error(kabisilyaResponse.message || 'Failed to load kabisilya');
//                 }
//                 setKabisilya(kabisilyaResponse.data);

//                 // Fetch workers
//                 const workersResponse = await kabisilyaAPI.getWorkers(id);
//                 if (workersResponse.status) {
//                     setWorkers(workersResponse.data.workers || []);
//                 }

//                 // Fetch bukids
//                 const bukidsResponse = await kabisilyaAPI.getBukids(id);
//                 if (bukidsResponse.status) {
//                     setBukids(bukidsResponse.data.bukids || []);
//                 }

//                 // Fetch stats
//                 const statsResponse = await kabisilyaAPI.getStats();
//                 if (statsResponse.status) {
//                     setStats(statsResponse.data);
//                 }

//             } catch (error: any) {
//                 console.error('Error fetching kabisilya data:', error);
//                 setError(error.message || 'Failed to load kabisilya data');
//                 showError('Failed to load kabisilya details');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (id) {
//             fetchData();
//         }
//     }, [id]);

//     // Format date
//     const formatDate = (dateString: string) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit'
//         });
//     };

//     // Get worker status color
//     const getWorkerStatusColor = (status: string) => {
//         switch (status?.toLowerCase()) {
//             case 'active': return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
//             case 'inactive': return { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle };
//             default: return { bg: 'bg-blue-100', text: 'text-blue-800', icon: User };
//         }
//     };

//     if (loading) {
//         return (
//             <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
//                 <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200">
//                     <div className="p-8 text-center">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
//                         <p className="text-sm text-gray-600">Loading kabisilya details...</p>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
//                 <div className="bg-white rounded-lg w-full max-w-md shadow-lg border border-gray-200">
//                     <div className="p-6 text-center">
//                         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
//                         <h3 className="text-base font-semibold text-gray-900 mb-1">Error Loading Kabisilya</h3>
//                         <p className="text-sm text-gray-600 mb-4">{error}</p>
//                         <button
//                             onClick={onClose}
//                             className="px-3 py-1.5 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
//             <div className="bg-white rounded-lg w-full max-w-6xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
//                 {/* Header */}
//                 <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
//                     <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
//                             <Users className="w-5 h-5 text-white" />
//                         </div>
//                         <div>
//                             <h3 className="text-lg font-semibold text-gray-900">{kabisilya?.name || 'Kabisilya'}</h3>
//                             <div className="text-xs text-gray-600 flex items-center gap-2">
//                                 <span>ID: #{kabisilya?.id}</span>
//                                 <span>•</span>
//                                 <span>Created: {kabisilya ? formatDate(kabisilya.createdAt) : 'N/A'}</span>
//                             </div>
//                         </div>
//                     </div>
//                     <button
//                         onClick={onClose}
//                         className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
//                         title="Close"
//                     >
//                         <X className="w-4 h-4 text-gray-500" />
//                     </button>
//                 </div>

//                 {/* Tabs */}
//                 <div className="border-b border-gray-200">
//                     <div className="flex">
//                         <button
//                             onClick={() => setActiveTab('overview')}
//                             className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'overview'
//                                     ? 'border-green-500 text-green-600'
//                                     : 'border-transparent text-gray-500 hover:text-gray-700'
//                                 }`}
//                         >
//                             Overview
//                         </button>
//                         <button
//                             onClick={() => setActiveTab('workers')}
//                             className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'workers'
//                                     ? 'border-green-500 text-green-600'
//                                     : 'border-transparent text-gray-500 hover:text-gray-700'
//                                 }`}
//                         >
//                             Workers ({workers.length})
//                         </button>
//                         <button
//                             onClick={() => setActiveTab('bukids')}
//                             className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'bukids'
//                                     ? 'border-green-500 text-green-600'
//                                     : 'border-transparent text-gray-500 hover:text-gray-700'
//                                 }`}
//                         >
//                             Bukids ({bukids.length})
//                         </button>
//                     </div>
//                 </div>

//                 {/* Content */}
//                 <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
//                     {activeTab === 'overview' ? (
//                         <div className="space-y-6">
//                             {/* Stats Cards */}
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 <div className="bg-green-50 rounded-lg border border-green-200 p-4">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
//                                             <Users className="w-5 h-5 text-green-600" />
//                                         </div>
//                                         <div>
//                                             <div className="text-2xl font-bold text-gray-900">{workers.length}</div>
//                                             <div className="text-sm text-gray-600">Total Workers</div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
//                                             <LandPlot className="w-5 h-5 text-blue-600" />
//                                         </div>
//                                         <div>
//                                             <div className="text-2xl font-bold text-gray-900">{bukids.length}</div>
//                                             <div className="text-sm text-gray-600">Total Bukids</div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
//                                             <BarChart3 className="w-5 h-5 text-amber-600" />
//                                         </div>
//                                         <div>
//                                             <div className="text-2xl font-bold text-gray-900">
//                                                 {bukids.reduce((total, bukid) => total + (bukid.totalLuwang || 0), 0)}
//                                             </div>
//                                             <div className="text-sm text-gray-600">Total LuWang</div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Details */}
//                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                 {/* Basic Information */}
//                                 <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
//                                     <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                                         <FileText className="w-4 h-4" />
//                                         Basic Information
//                                     </h4>
//                                     <div className="space-y-2">
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Kabisilya ID:</span>
//                                             <span className="text-sm font-medium text-gray-900">#{kabisilya?.id}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Name:</span>
//                                             <span className="text-sm font-medium text-gray-900">{kabisilya?.name}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Created:</span>
//                                             <span className="text-sm text-gray-900">{kabisilya ? formatDate(kabisilya.createdAt) : 'N/A'}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Last Updated:</span>
//                                             <span className="text-sm text-gray-900">{kabisilya ? formatDate(kabisilya.updatedAt) : 'N/A'}</span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Quick Actions */}
//                                 <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
//                                     <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
//                                     <div className="space-y-2">
//                                         {onAssignWorker && (
//                                             <button
//                                                 onClick={onAssignWorker}
//                                                 className="w-full flex items-center justify-between p-2 rounded border border-gray-300 hover:bg-white transition-colors"
//                                             >
//                                                 <div className="flex items-center gap-2">
//                                                     <User className="w-4 h-4 text-gray-600" />
//                                                     <span className="text-sm text-gray-700">Assign New Worker</span>
//                                                 </div>
//                                                 <ChevronRight className="w-4 h-4 text-gray-400" />
//                                             </button>
//                                         )}
//                                         {onAssignBukid && (
//                                             <button
//                                                 onClick={onAssignBukid}
//                                                 className="w-full flex items-center justify-between p-2 rounded border border-gray-300 hover:bg-white transition-colors"
//                                             >
//                                                 <div className="flex items-center gap-2">
//                                                     <LandPlot className="w-4 h-4 text-gray-600" />
//                                                     <span className="text-sm text-gray-700">Assign New Bukid</span>
//                                                 </div>
//                                                 <ChevronRight className="w-4 h-4 text-gray-400" />
//                                             </button>
//                                         )}
//                                         {onEdit && (
//                                             <button
//                                                 onClick={() => { if (kabisilya?.id) { onEdit(kabisilya?.id) } }}
//                                                 className="w-full flex items-center justify-between p-2 rounded border border-gray-300 hover:bg-white transition-colors"
//                                             >
//                                                 <div className="flex items-center gap-2">
//                                                     <Edit className="w-4 h-4 text-gray-600" />
//                                                     <span className="text-sm text-gray-700">Edit Kabisilya Details</span>
//                                                 </div>
//                                                 <ChevronRight className="w-4 h-4 text-gray-400" />
//                                             </button>
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Recent Activity (Placeholder) */}
//                             <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
//                                 <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                                     <Clock className="w-4 h-4" />
//                                     Recent Activity
//                                 </h4>
//                                 <div className="text-sm text-gray-600 italic">
//                                     Activity tracking will be available in future updates
//                                 </div>
//                             </div>
//                         </div>
//                     ) : activeTab === 'workers' ? (
//                         <div className="space-y-4">
//                             <div className="flex justify-between items-center mb-4">
//                                 <h4 className="text-sm font-semibold text-gray-900">Assigned Workers ({workers.length})</h4>
//                                 {onAssignWorker && (
//                                     <button
//                                         onClick={onAssignWorker}
//                                         className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
//                                     >
//                                         <User className="w-3.5 h-3.5" />
//                                         Assign Worker
//                                     </button>
//                                 )}
//                             </div>

//                             {workers.length === 0 ? (
//                                 <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
//                                     <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
//                                     <p className="text-sm text-gray-600">No workers assigned to this kabisilya</p>
//                                     <p className="text-xs text-gray-500 mt-1">Assign workers to start tracking their work</p>
//                                 </div>
//                             ) : (
//                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                     {workers.map(worker => {
//                                         const statusColor = getWorkerStatusColor(worker.status);
//                                         const StatusIcon = statusColor.icon;

//                                         return (
//                                             <div key={worker.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-green-300 transition-colors">
//                                                 <div className="flex items-start justify-between mb-2">
//                                                     <div className="flex items-center gap-2">
//                                                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
//                                                             <User className="w-4 h-4 text-blue-600" />
//                                                         </div>
//                                                         <div>
//                                                             <div className="text-sm font-medium text-gray-900">{worker.name}</div>
//                                                             <div className="text-xs text-gray-500">ID: {worker.code || `#${worker.id}`}</div>
//                                                         </div>
//                                                     </div>
//                                                     <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${statusColor.bg} ${statusColor.text}`}>
//                                                         <StatusIcon className="w-3 h-3" />
//                                                         {worker.status || 'Unknown'}
//                                                     </div>
//                                                 </div>

//                                                 <div className="space-y-1 text-xs text-gray-600">
//                                                     {worker.contact && (
//                                                         <div className="flex items-center gap-1">
//                                                             <span>Contact:</span>
//                                                             <span className="font-medium">{worker.contact}</span>
//                                                         </div>
//                                                     )}
//                                                     {worker.email && (
//                                                         <div className="flex items-center gap-1">
//                                                             <span>Email:</span>
//                                                             <span className="font-medium">{worker.email}</span>
//                                                         </div>
//                                                     )}
//                                                     {worker.hireDate && (
//                                                         <div className="flex items-center gap-1">
//                                                             <Calendar className="w-3 h-3" />
//                                                             <span>Hired: {new Date(worker.hireDate).toLocaleDateString()}</span>
//                                                         </div>
//                                                     )}
//                                                 </div>

//                                                 <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
//                                                     <div>
//                                                         <div className="font-medium text-gray-900">₱{worker.totalDebt?.toFixed(2) || '0.00'}</div>
//                                                         <div className="text-gray-500">Total Debt</div>
//                                                     </div>
//                                                     <div>
//                                                         <div className="font-medium text-gray-900">{worker.activeAssignments || 0}</div>
//                                                         <div className="text-gray-500">Active Assignments</div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             )}
//                         </div>
//                     ) : (
//                         <div className="space-y-4">
//                             <div className="flex justify-between items-center mb-4">
//                                 <h4 className="text-sm font-semibold text-gray-900">Assigned Bukids ({bukids.length})</h4>
//                                 {onAssignBukid && (
//                                     <button
//                                         onClick={onAssignBukid}
//                                         className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
//                                     >
//                                         <LandPlot className="w-3.5 h-3.5" />
//                                         Assign Bukid
//                                     </button>
//                                 )}
//                             </div>

//                             {bukids.length === 0 ? (
//                                 <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
//                                     <LandPlot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
//                                     <p className="text-sm text-gray-600">No bukids assigned to this kabisilya</p>
//                                     <p className="text-xs text-gray-500 mt-1">Assign farm plots to organize work areas</p>
//                                 </div>
//                             ) : (
//                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                     {bukids.map(bukid => (
//                                         <div key={bukid.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-green-300 transition-colors">
//                                             <div className="flex items-start justify-between mb-2">
//                                                 <div className="flex items-center gap-2">
//                                                     <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
//                                                         <LandPlot className="w-4 h-4 text-emerald-600" />
//                                                     </div>
//                                                     <div>
//                                                         <div className="text-sm font-medium text-gray-900">{bukid.name}</div>
//                                                         <div className="text-xs text-gray-500">ID: {bukid.code || `#${bukid.id}`}</div>
//                                                     </div>
//                                                 </div>
//                                                 <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                                                     {bukid.activePitaks || 0} Active
//                                                 </div>
//                                             </div>

//                                             {bukid.location && (
//                                                 <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
//                                                     <MapPin className="w-3 h-3" />
//                                                     {bukid.location}
//                                                 </div>
//                                             )}

//                                             <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
//                                                 <div className="text-center">
//                                                     <div className="text-lg font-bold text-gray-900">{bukid.totalLuwang || 0}</div>
//                                                     <div className="text-xs text-gray-500">LuWang</div>
//                                                 </div>
//                                                 <div className="text-center">
//                                                     <div className="text-lg font-bold text-gray-900">{bukid.pitakCount || 0}</div>
//                                                     <div className="text-xs text-gray-500">Plots</div>
//                                                 </div>
//                                                 <div className="text-center">
//                                                     <div className="text-lg font-bold text-gray-900">{bukid.totalAssignments || 0}</div>
//                                                     <div className="text-xs text-gray-500">Assignments</div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 {/* Footer */}
//                 <div className="p-4 border-t border-gray-200 bg-gray-50">
//                     <div className="flex items-center justify-between">
//                         <div className="text-xs text-gray-600">
//                             Last updated: {kabisilya ? formatDate(kabisilya.updatedAt) : 'N/A'}
//                         </div>
//                         <div className="flex items-center gap-2">
//                             {onDelete && (
//                                 <button
//                                     onClick={onDelete}
//                                     className="px-3 py-1.5 rounded text-sm font-medium border border-red-300 hover:bg-red-50 text-red-600 flex items-center gap-1"
//                                 >
//                                     <Trash2 className="w-3.5 h-3.5" />
//                                     Delete
//                                 </button>
//                             )}
//                             {onEdit && (
//                                 <button
//                                     onClick={() => {if(kabisilya.id){onEdit(kabisilya?.id)}}}
//                                     className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
//                                 >
//                                     <Edit className="w-3.5 h-3.5" />
//                                     Edit
//                                 </button>
//                             )}
//                             <button
//                                 onClick={onClose}
//                                 className="px-3 py-1.5 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"
//                             >
//                                 Close
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default KabisilyaViewDialog;