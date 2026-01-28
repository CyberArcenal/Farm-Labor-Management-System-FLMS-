// components/Kabisilya/components/KabisilyaGridView.tsx
import React from 'react';
import type { KabisilyaListData } from '../../../../apis/kabisilya';
import KabisilyaGridCard from './KabisilyaGridCard';

interface KabisilyaGridViewProps {
    kabisilyas: KabisilyaListData[];
    selectedKabisilyas: number[];
    toggleSelectKabisilya: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAssignWorkers: (id: number) => void;
    onAssignBukids: (id: number) => void;
}

const KabisilyaGridView: React.FC<KabisilyaGridViewProps> = ({
    kabisilyas,
    selectedKabisilyas,
    toggleSelectKabisilya,
    onView,
    onEdit,
    onDelete,
    onAssignWorkers,
    onAssignBukids
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kabisilyas.map((kabisilya) => (
                <KabisilyaGridCard
                    key={kabisilya.id}
                    kabisilya={kabisilya}
                    isSelected={selectedKabisilyas.includes(kabisilya.id)}
                    onSelect={() => toggleSelectKabisilya(kabisilya.id)}
                    onView={() => onView(kabisilya.id)}
                    onEdit={() => onEdit(kabisilya.id)}
                    onDelete={() => onDelete(kabisilya.id)}
                    onAssignWorkers={() => onAssignWorkers(kabisilya.id)}
                    onAssignBukids={() => onAssignBukids(kabisilya.id)}
                />
            ))}
        </div>
    );
};

export default KabisilyaGridView;