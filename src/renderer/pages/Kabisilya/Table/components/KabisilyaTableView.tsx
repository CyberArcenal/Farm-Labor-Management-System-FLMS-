// components/Kabisilya/components/KabisilyaTableView.tsx
import React, { useState } from 'react';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import type { KabisilyaListData } from '../../../../apis/kabisilya';
import KabisilyaTableRow from './KabisilyaTableRow';

interface KabisilyaTableViewProps {
    kabisilyas: KabisilyaListData[];
    selectedKabisilyas: number[];
    toggleSelectAll: () => void;
    toggleSelectKabisilya: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAssignWorkers: (id: number) => void;
    onAssignBukids: (id: number) => void;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSort: (field: string) => void;
}

const KabisilyaTableView: React.FC<KabisilyaTableViewProps> = ({
    kabisilyas,
    selectedKabisilyas,
    toggleSelectAll,
    toggleSelectKabisilya,
    onView,
    onEdit,
    onDelete,
    onAssignWorkers,
    onAssignBukids,
    sortBy,
    sortOrder,
    onSort
}) => {
    const [expandedKabisilya, setExpandedKabisilya] = useState<number | null>(null);

    const toggleExpandKabisilya = (id: number) => {
        setExpandedKabisilya(prev => prev === id ? null : id);
    };

    return (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: 'var(--table-header-bg)' }}>
                            <th className="p-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedKabisilyas.length === kabisilyas.length && kabisilyas.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('name')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Name
                                    {sortBy === 'name' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('workerCount')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Workers
                                    {sortBy === 'workerCount' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('bukidCount')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Bukids
                                    {sortBy === 'bukidCount' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('createdAt')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Created
                                    {sortBy === 'createdAt' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Status
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {kabisilyas.map((kabisilya) => (
                            <KabisilyaTableRow
                                key={kabisilya.id}
                                kabisilya={kabisilya}
                                isSelected={selectedKabisilyas.includes(kabisilya.id)}
                                isExpanded={expandedKabisilya === kabisilya.id}
                                onSelect={() => toggleSelectKabisilya(kabisilya.id)}
                                onToggleExpand={() => toggleExpandKabisilya(kabisilya.id)}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onAssignWorkers={onAssignWorkers}
                                onAssignBukids={onAssignBukids}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default KabisilyaTableView;