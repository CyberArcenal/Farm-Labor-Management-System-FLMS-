// // components/Kabisilya/components/KabisilyaStats.tsx
// import React from 'react';
// import { Network, UserCheck, Home, BarChart3 } from 'lucide-react';
// import type { KabisilyaStatsData } from '../../../../apis/kabisilya';

// interface KabisilyaStatsProps {
//     stats: KabisilyaStatsData | null;
// }

// const KabisilyaStats: React.FC<KabisilyaStatsProps> = ({ stats }) => {
//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                 style={{
//                     background: 'var(--card-bg)',
//                     border: '1px solid var(--border-color)'
//                 }}
//             >
//                 <div className="flex justify-between items-start mb-4">
//                     <div className="p-3 rounded-lg" style={{ background: 'var(--accent-purple-light)' }}>
//                         <Network className="w-6 h-6" style={{ color: 'var(--accent-purple)' }} />
//                     </div>
//                     <span className="px-3 py-1 rounded-full text-xs font-medium"
//                         style={{
//                             background: 'var(--accent-purple-light)',
//                             color: 'var(--accent-purple)'
//                         }}
//                     >
//                         Total
//                     </span>
//                 </div>
//                 <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                     {stats?.totalKabisilyas || 0}
//                 </h3>
//                 <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Kabisilyas</p>
//             </div>

//             <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                 style={{
//                     background: 'var(--card-bg)',
//                     border: '1px solid var(--border-color)'
//                 }}
//             >
//                 <div className="flex justify-between items-start mb-4">
//                     <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
//                         <UserCheck className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
//                     </div>
//                     <span className="px-3 py-1 rounded-full text-xs font-medium"
//                         style={{
//                             background: 'var(--accent-sky-light)',
//                             color: 'var(--accent-sky)'
//                         }}
//                     >
//                         Workers
//                     </span>
//                 </div>
//                 <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                     {stats?.totalWorkers || 0}
//                 </h3>
//                 <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Workers</p>
//             </div>

//             <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                 style={{
//                     background: 'var(--card-bg)',
//                     border: '1px solid var(--border-color)'
//                 }}
//             >
//                 <div className="flex justify-between items-start mb-4">
//                     <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
//                         <Home className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
//                     </div>
//                     <span className="px-3 py-1 rounded-full text-xs font-medium"
//                         style={{
//                             background: 'var(--accent-earth-light)',
//                             color: 'var(--accent-earth)'
//                         }}
//                     >
//                         Bukids
//                     </span>
//                 </div>
//                 <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                     {stats?.totalBukids || 0}
//                 </h3>
//                 <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Bukids</p>
//             </div>

//             <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
//                 style={{
//                     background: 'var(--card-bg)',
//                     border: '1px solid var(--border-color)'
//                 }}
//             >
//                 <div className="flex justify-between items-start mb-4">
//                     <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
//                         <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
//                     </div>
//                     <span className="px-3 py-1 rounded-full text-xs font-medium"
//                         style={{
//                             background: 'var(--accent-gold-light)',
//                             color: 'var(--accent-gold)'
//                         }}
//                     >
//                         Average
//                     </span>
//                 </div>
//                 <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
//                     {stats?.totalKabisilyas ? Math.round((stats.totalWorkers + stats.totalBukids) / stats.totalKabisilyas) : 0}
//                 </h3>
//                 <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Avg Resources per Kabisilya</p>
//             </div>
//         </div>
//     );
// };

// export default KabisilyaStats;