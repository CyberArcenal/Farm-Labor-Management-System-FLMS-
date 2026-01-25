// components/KabisilyaSelect.tsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, Users, Building, User, TreePalm } from 'lucide-react';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';

interface KabisilyaSelectProps {
  value: number | null;
  onChange: (kabisilyaId: number, kabisilyaName: string, kabisilyaData?: KabisilyaData) => void;
  disabled?: boolean;
  showDetails?: boolean;
  placeholder?: string;
  withInactive?: boolean;
}

const KabisilyaSelect: React.FC<KabisilyaSelectProps> = ({
  value,
  onChange,
  disabled = false,
  showDetails = true,
  placeholder = 'Select a kabisilya',
  withInactive = false
}) => {
  const [kabisilyas, setKabisilyas] = useState<KabisilyaData[]>([]);
  const [filteredKabisilyas, setFilteredKabisilyas] = useState<KabisilyaData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKabisilyas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await kabisilyaAPI.getAll({ withInactive });
      
      if (response.status && response.data) {
        setKabisilyas(response.data);
        setFilteredKabisilyas(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch kabisilyas');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch kabisilyas');
      console.error('Error fetching kabisilyas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKabisilyas();
  }, [withInactive]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKabisilyaSelect = (kabisilya: KabisilyaData) => {
    onChange(kabisilya.id, kabisilya.name, kabisilya);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedKabisilya = kabisilyas.find(k => k.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`compact-input w-full rounded-md text-left flex justify-between items-center transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'text-gray-900 dark:text-[#9ED9EC] hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: isOpen ? 'var(--accent-green)' : 'var(--border-color)',
          borderWidth: '1px',
          minHeight: '42px'
        }}
      >
        <div className="flex items-center truncate">
          {selectedKabisilya ? (
            <div className="flex items-center space-x-2">
              <Users className="icon-sm" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
                {selectedKabisilya.name}
                {showDetails && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                    • Kabisilya #{selectedKabisilya.id}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`icon-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-xs rounded-md shadow-lg max-h-80 overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: 'var(--card-secondary-bg)',
            borderColor: 'var(--border-color)',
            borderWidth: '1px',
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          <div className="compact-card border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 icon-sm" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search kabisilyas by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="compact-input w-full pl-8 rounded-md focus:ring-1 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--sidebar-text)'
                }}
                autoFocus
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader className="icon-sm animate-spin" style={{ color: 'var(--accent-green)' }} />
              <span className="ml-xs text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading kabisilyas...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="compact-card text-center">
              <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
              <button
                onClick={fetchKabisilyas}
                className="text-sm compact-button"
                style={{
                  backgroundColor: 'var(--accent-green)',
                  color: 'var(--sidebar-text)',
                  padding: 'var(--size-xs) var(--size-sm)'
                }}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-60 overflow-y-auto kabisilya-scrollbar">
              {filteredKabisilyas.length === 0 ? (
                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No kabisilyas found
                </div>
              ) : (
                filteredKabisilyas.map((kabisilya) => (
                  <button
                    key={kabisilya.id}
                    type="button"
                    onClick={() => handleKabisilyaSelect(kabisilya)}
                    className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${
                      kabisilya.id === value
                        ? 'border-l-2 border-green-600'
                        : ''
                    }`}
                    style={{
                      backgroundColor: kabisilya.id === value ? 'var(--card-hover-bg)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                          <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                            {kabisilya.name}
                          </div>
                          <div className="px-xs py-xs rounded-full text-xs font-medium status-badge-active">
                            Kabisilya #{kabisilya.id}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-xs">
                          <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <User className="icon-xs mr-1" />
                            <span>Workers</span>
                          </div>
                          
                          <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <TreePalm className="icon-xs mr-1" />
                            <span>Bukids</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-xs">
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Created: {new Date(kabisilya.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Updated: {new Date(kabisilya.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default KabisilyaSelect;