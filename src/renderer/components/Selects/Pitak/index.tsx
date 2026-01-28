// components/PitakSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader, Layers } from 'lucide-react';
import type { PitakData } from '../../../apis/pitak';
import pitakAPI from '../../../apis/pitak';

interface PitakSelectProps {
  value: number | null;
  onChange: (pitakId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const PitakSelect: React.FC<PitakSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a plot'
}) => {
  const [pitaks, setPitaks] = useState<PitakData[]>([]);
  const [filteredPitaks, setFilteredPitaks] = useState<PitakData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPitaks = async () => {
      try {
        setLoading(true);
        const response = await pitakAPI.getAllPitaks({});

        if (response.status && response.data) {
          const pitakList = Array.isArray(response.data) ? response.data : response.data || [];
          setPitaks(pitakList);
          setFilteredPitaks(pitakList);
        }
      } catch (err) {
        console.error('Error fetching plots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPitaks();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPitaks(pitaks);
    } else {
      const filtered = pitaks.filter(pitak =>
        pitak.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitak.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPitaks(filtered);
    }
  }, [searchTerm, pitaks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelect = (pitakId: number) => {
    onChange(pitakId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
  };

  const selectedPitak = pitaks.find(p => p.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 rounded-lg text-left flex justify-between items-center text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text-primary)',
          minHeight: '44px'
        }}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedPitak ? (
            <>
              <Layers className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate">{selectedPitak.location || `Plot #${selectedPitak.id}`}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedPitak && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-100 rounded"
              style={{ color: 'var(--accent-rust)' }}
            >
              ×
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            maxHeight: '300px',
            overflow: 'hidden'
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search plots..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
            </div>
          </div>

          {loading && (
            <div className="p-4 text-center">
              <Loader className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--accent-green)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Loading plots...
              </p>
            </div>
          )}

          {!loading && (
            <div className="max-h-60 overflow-y-auto">
              {filteredPitaks.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {searchTerm ? 'No plots found' : 'No plots available'}
                </div>
              ) : (
                filteredPitaks.map((pitak) => (
                  <button
                    key={pitak.id}
                    type="button"
                    onClick={() => handleSelect(pitak.id)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${pitak.id === value ? 'bg-gray-50' : ''
                      }`}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pitak.id === value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                      {pitak.id === value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <Layers className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{pitak.location || `Plot #${pitak.id}`}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Farm #{pitak.bukidId} • {pitak.status || 'No status'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PitakSelect;