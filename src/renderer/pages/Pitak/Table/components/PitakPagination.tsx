import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PitakPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const PitakPagination: React.FC<PitakPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} pitak
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

        {getPageNumbers().map((pageNum) => (
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
        ))}

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
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PitakPagination;