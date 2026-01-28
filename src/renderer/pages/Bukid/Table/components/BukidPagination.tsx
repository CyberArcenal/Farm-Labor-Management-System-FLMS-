// components/Bukid/components/BukidPagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface BukidPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const BukidPagination: React.FC<BukidPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} bukid
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          style={{
            background: currentPage === 1 ? 'var(--card-secondary-bg)' : 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === pageNum ? '' : 'hover:shadow-md'}`}
              style={{
                background: currentPage === pageNum ? 'var(--primary-color)' : 'var(--card-bg)',
                color: currentPage === pageNum ? 'var(--sidebar-text)' : 'var(--text-primary)',
                border: `1px solid ${currentPage === pageNum ? 'var(--primary-color)' : 'var(--border-color)'}`
              }}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          style={{
            background: currentPage === totalPages ? 'var(--card-secondary-bg)' : 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BukidPagination;