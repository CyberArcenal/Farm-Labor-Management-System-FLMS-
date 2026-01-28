// components/Bukid/components/BukidGridView.tsx
import React from 'react';
import type { BukidData, BukidSummaryData } from '../../../../apis/bukid';
import BukidGridCard from './BukidGridCard';

interface BukidGridViewProps {
  bukids: BukidData[];
  summary: BukidSummaryData[];
  selectedBukids: number[];
  toggleSelectBukid: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onUpdateStatus: (id: number, currentStatus: string) => void;
  onDelete: (id: number, name: string) => void;
}

const BukidGridView: React.FC<BukidGridViewProps> = ({
  bukids,
  summary,
  selectedBukids,
  toggleSelectBukid,
  onView,
  onEdit,
  onUpdateStatus,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bukids.map((bukid) => {
        const bukidSummary = summary.find(s => s.id === bukid.id);
        return (
          <BukidGridCard
            key={bukid.id}
            bukid={bukid}
            bukidSummary={bukidSummary}
            isSelected={selectedBukids.includes(bukid.id!)}
            onSelect={() => toggleSelectBukid(bukid.id!)}
            onView={onView}
            onEdit={onEdit}
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};

export default BukidGridView;