// components/KabisilyaSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader, Users } from 'lucide-react';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';

interface KabisilyaSelectProps {
  value: number | null;
  onChange: (kabisilyaId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const KabisilyaSelect: React.FC<KabisilyaSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a kabisilya'
}) => {
  const [kabisilyas, setKabisilyas] = useState<KabisilyaData[]>([]);
  const [filteredKabisilyas, setFilteredKabisilyas] = useState<KabisilyaData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch kabisilyas on mount
  useEffect(() => {
    const fetchKabisilyas = async () => {
      try {
        setLoading(true);
        const response = await kabisilyaAPI.getAll();
        
        if (response.status && response.data) {
          setKabisilyas(response.data);
          setFilteredKabisilyas(response.data);
        }
      } catch (err) {
        console.error('Error fetching kabisilyas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKabisilyas();
  }, []);

  // Filter kabisilyas based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredKabisilyas(kabisilyas);
    } else {
      const filtered = kabisilyas.filter(kabisilya =>
        kabisilya.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredKabisilyas(filtered);
    }
  }, [searchTerm, kabisilyas]);

  // Handle click outside to close dropdown
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

  const handleSelect = (kabisilyaId: number) => {
    onChange(kabisilyaId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
  };

  const selectedKabisilya = kabisilyas.find(k => k.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 rounded-lg text-left flex justify-between items-center text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text-primary)',
          minHeight: '44px'
        }}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedKabisilya ? (
            <>
              <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate">{selectedKabisilya.name}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedKabisilya && (
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
          {/* Search input */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                     style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search kabisilyas..."
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

          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center">
              <Loader className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--accent-green)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Loading kabisilyas...
              </p>
            </div>
          )}

          {/* Kabisilyas list */}
          {!loading && (
            <div className="max-h-60 overflow-y-auto">
              {filteredKabisilyas.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {searchTerm ? 'No kabisilyas found' : 'No kabisilyas available'}
                </div>
              ) : (
                filteredKabisilyas.map((kabisilya) => (
                  <button
                    key={kabisilya.id}
                    type="button"
                    onClick={() => handleSelect(kabisilya.id)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      kabisilya.id === value ? 'bg-gray-50' : ''
                    }`}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      kabisilya.id === value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {kabisilya.id === value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{kabisilya.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Kabisilya #{kabisilya.id}
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

export default KabisilyaSelect;