// // components/Kabisilya/components/KabisilyaFilters.tsx
// import React from 'react';
// import {
//     Filter,
//     RefreshCw,
//     XCircle,
//     List,
//     Grid
// } from 'lucide-react';
// import SearchInput from './SearchInput';

// interface KabisilyaFiltersProps {
//     searchQuery: string;
//     setSearchQuery: (query: string) => void;
//     statusFilter: string;
//     setStatusFilter: (status: string) => void;
//     viewMode: 'grid' | 'table';
//     setViewMode: (mode: 'grid' | 'table') => void;
//     handleRefresh: () => void;
//     refreshing: boolean;
//     handleStatusFilterChange: (status: string) => void;
//     sortBy: string;
//     setSortBy: (sortBy: string) => void;
//     sortOrder: 'ASC' | 'DESC';
//     setSortOrder: (order: 'ASC' | 'DESC') => void;
//     setCurrentPage: (page: number) => void;
//     showAdvancedFilters?: boolean;
//     setShowAdvancedFilters?: (show: boolean) => void;
// }

// const KabisilyaFilters: React.FC<KabisilyaFiltersProps> = ({
//     searchQuery,
//     setSearchQuery,
//     statusFilter,
//     setStatusFilter,
//     viewMode,
//     setViewMode,
//     handleRefresh,
//     refreshing,
//     handleStatusFilterChange,
//     sortBy,
//     setSortBy,
//     sortOrder,
//     setSortOrder,
//     setCurrentPage,
//     showAdvancedFilters = false,
//     setShowAdvancedFilters
// }) => {
//     const clearFilters = () => {
//         setStatusFilter('all');
//         setSearchQuery('');
//         setSortBy('name');
//         setSortOrder('ASC');
//         setCurrentPage(1);
//         if (setShowAdvancedFilters) {
//             setShowAdvancedFilters(false);
//         }
//     };

//     return (
//         <div className="p-5 rounded-xl space-y-4"
//             style={{
//                 background: 'var(--card-bg)',
//                 border: '1px solid var(--border-color)'
//             }}
//         >
//             <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
//                 <div className="flex flex-col sm:flex-row gap-3 flex-1">
//                     {/* Search Input Component */}
//                     <SearchInput
//                         value={searchQuery}
//                         onChange={setSearchQuery}
//                         placeholder="Search kabisilyas..."
//                     />

//                     {/* Status Filter */}
//                     <div className="flex gap-2 flex-wrap">
//                         {['all', 'active', 'inactive'].map((status) => (
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
//                             className={`p-2 transition-colors duration-200 ${viewMode === 'table' ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
//                             style={{ 
//                                 color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-secondary)',
//                                 borderRight: '1px solid var(--border-color)'
//                             }}
//                         >
//                             <List className="w-4 h-4" />
//                         </button>
//                         <button
//                             onClick={() => setViewMode('grid')}
//                             className={`p-2 transition-colors duration-200 ${viewMode === 'grid' ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
//                             style={{ color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
//                         >
//                             <Grid className="w-4 h-4" />
//                         </button>
//                     </div>

//                     {/* Advanced Filters Toggle */}
//                     {setShowAdvancedFilters && (
//                         <button
//                             onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
//                             className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
//                             style={{
//                                 background: showAdvancedFilters ? 'var(--primary-color)' : 'var(--card-secondary-bg)',
//                                 color: showAdvancedFilters ? 'var(--sidebar-text)' : 'var(--text-secondary)',
//                                 border: '1px solid var(--border-color)'
//                             }}
//                         >
//                             <Filter className="w-4 h-4" />
//                         </button>
//                     )}

//                     {/* Refresh */}
//                     <button
//                         onClick={handleRefresh}
//                         disabled={refreshing}
//                         className="p-2 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
//                         style={{
//                             background: 'var(--card-secondary-bg)',
//                             color: 'var(--text-secondary)',
//                             border: '1px solid var(--border-color)'
//                         }}
//                     >
//                         <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                     </button>

//                     {/* Clear Filters */}
//                     <button
//                         onClick={clearFilters}
//                         className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
//                         style={{
//                             background: 'var(--card-secondary-bg)',
//                             color: 'var(--text-secondary)',
//                             border: '1px solid var(--border-color)'
//                         }}
//                     >
//                         <XCircle className="w-4 h-4" />
//                     </button>
//                 </div>
//             </div>

//             {/* Advanced Filters */}
//             {showAdvancedFilters && setShowAdvancedFilters && (
//                 <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--border-color)' }}>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         <div>
//                             <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
//                                 Sort By
//                             </label>
//                             <select
//                                 value={sortBy}
//                                 onChange={(e) => {
//                                     setSortBy(e.target.value);
//                                     setCurrentPage(1);
//                                 }}
//                                 className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
//                                 style={{
//                                     background: 'var(--input-bg)',
//                                     border: '1px solid var(--input-border)',
//                                     color: 'var(--text-primary)'
//                                 }}
//                             >
//                                 <option value="name">Name</option>
//                                 <option value="workerCount">Worker Count</option>
//                                 <option value="bukidCount">Bukid Count</option>
//                                 <option value="createdAt">Created Date</option>
//                                 <option value="updatedAt">Updated Date</option>
//                             </select>
//                         </div>
//                         <div>
//                             <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
//                                 Sort Order
//                             </label>
//                             <select
//                                 value={sortOrder}
//                                 onChange={(e) => {
//                                     setSortOrder(e.target.value as 'ASC' | 'DESC');
//                                     setCurrentPage(1);
//                                 }}
//                                 className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
//                                 style={{
//                                     background: 'var(--input-bg)',
//                                     border: '1px solid var(--input-border)',
//                                     color: 'var(--text-primary)'
//                                 }}
//                             >
//                                 <option value="ASC">Ascending</option>
//                                 <option value="DESC">Descending</option>
//                             </select>
//                         </div>
//                         <div>
//                             <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
//                                 Show Inactive
//                             </label>
//                             <div className="flex items-center">
//                                 <input
//                                     type="checkbox"
//                                     checked={statusFilter === 'inactive'}
//                                     onChange={(e) => handleStatusFilterChange(e.target.checked ? 'inactive' : 'all')}
//                                     className="rounded mr-2 focus:ring-2 focus:ring-blue-500"
//                                     style={{ borderColor: 'var(--border-color)' }}
//                                 />
//                                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Include inactive kabisilyas</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default KabisilyaFilters;