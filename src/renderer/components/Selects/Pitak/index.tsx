// components/PitakSelect.tsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, MapPin, TreePalm, Layers, BarChart3, AlertCircle } from 'lucide-react';
import type { PitakData } from '../../../apis/pitak';
import pitakAPI from '../../../apis/pitak';


interface PitakSelectProps {
  value: number | null;
  onChange: (pitakId: number, pitakData?: PitakData) => void;
  disabled?: boolean;
  bukidId?: number; // Optional filter by bukid
  showStats?: boolean;
  placeholder?: string;
  showOnlyAvailable?: boolean; // Show only available pitaks for assignment
}

const PitakSelect: React.FC<PitakSelectProps> = ({
  value,
  onChange,
  disabled = false,
  bukidId,
  showStats = true,
  placeholder = 'Select a plot (pitak)',
  showOnlyAvailable = false
}) => {
  const [pitaks, setPitaks] = useState<PitakData[]>([]);
  const [filteredPitaks, setFilteredPitaks] = useState<PitakData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bukidNames, setBukidNames] = useState<Record<number, string>>({});

  // Fetch pitaks on component mount or when bukidId changes
  useEffect(() => {
    fetchPitaks();
  }, [bukidId]);

  // Filter pitaks based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPitaks(pitaks);
    } else {
      const filtered = pitaks.filter(pitak => {
        const locationMatch = pitak.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const bukidName = bukidNames[pitak.bukidId]?.toLowerCase() || '';
        const bukidMatch = bukidName.includes(searchTerm.toLowerCase());
        const statusMatch = pitak.status?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        
        return locationMatch || bukidMatch || statusMatch;
      });
      setFilteredPitaks(filtered);
    }
  }, [searchTerm, pitaks, bukidNames]);

  const fetchPitaks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters based on props
      const filters: any = {};
      if (bukidId) filters.bukidId = bukidId;
      if (showOnlyAvailable) filters.status = 'active';
      
      const response = await pitakAPI.getAllPitaks(filters);
      
      if (response.status && response.data) {
        const pitakList = Array.isArray(response.data) ? response.data : response.data || [];
        setPitaks(pitakList);
        setFilteredPitaks(pitakList);
        
        // Extract unique bukid IDs and fetch their names
        const uniqueBukidIds = Array.from(new Set(pitakList.map((p: { bukidId: any; }) => p.bukidId))) as number[];
        await fetchBukidNames(uniqueBukidIds);
      } else {
        throw new Error(response.message || 'Failed to fetch plots');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plots');
      console.error('Error fetching plots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBukidNames = async (bukidIds: number[]) => {
    try {
      // This would need a bukidAPI to get bukid names
      // For now, we'll create a mock object or use existing data
      const names: Record<number, string> = {};
      // You would typically fetch bukid names here
      setBukidNames(names);
    } catch (error) {
      console.error('Error fetching bukid names:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePitakSelect = (pitak: PitakData) => {
    onChange(pitak.id, pitak);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-badge-planted';
      case 'inactive':
        return 'status-badge-fallow';
      case 'harvested':
        return 'status-badge-harvested';
      default:
        return 'status-badge-growing';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'harvested':
        return 'Harvested';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const selectedPitak = pitaks.find(p => p.id === value);

  return (
    <div className="relative">
      {/* Selected Pitak Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`compact-input w-full rounded-md text-left flex justify-between items-center transition-all duration-200 ${disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'text-gray-900 dark:text-[#9ED9EC] hover:border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
          }`}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: isOpen ? 'var(--accent-green)' : 'var(--border-color)',
          borderWidth: '1px',
          minHeight: '42px'
        }}
      >
        <div className="flex items-center truncate">
          {selectedPitak ? (
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Layers className="icon-sm" style={{ color: 'var(--accent-earth)' }} />
                <span className="truncate text-sm font-medium" style={{ color: 'var(--sidebar-text)' }}>
                  {selectedPitak.location || `Plot #${selectedPitak.id}`}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(selectedPitak.status)}`}>
                  {getStatusText(selectedPitak.status)}
                </span>
              </div>
              <div className="flex items-center text-xs ml-5 mt-xs" style={{ color: 'var(--text-secondary)' }}>
                <TreePalm className="icon-xs mr-1" />
                <span>Farm #{selectedPitak.bukidId}</span>
                <span className="mx-2">•</span>
                <span>{selectedPitak.totalLuwang} LuWang capacity</span>
              </div>
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

      {/* Dropdown Menu */}
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
          {/* Search Input */}
          <div className="compact-card border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 icon-sm" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search plots by location or farm..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="compact-input w-full pl-8 rounded-md focus:ring-1 focus:ring-green-500"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--sidebar-text)'
                }}
                autoFocus
              />
            </div>
            {bukidId && (
              <div className="text-xs px-3 py-1" style={{ color: 'var(--text-secondary)' }}>
                Filtered by Farm #{bukidId}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader className="icon-sm animate-spin" style={{ color: 'var(--accent-earth)' }} />
              <span className="ml-xs text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading plots...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="compact-card text-center">
              <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
              <button
                onClick={fetchPitaks}
                className="text-sm compact-button"
                style={{
                  backgroundColor: 'var(--accent-earth)',
                  color: 'white',
                  padding: 'var(--size-xs) var(--size-sm)'
                }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Pitaks List */}
          {!loading && !error && (
            <div className="max-h-60 overflow-y-auto kabisilya-scrollbar">
              {filteredPitaks.length === 0 ? (
                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {showOnlyAvailable 
                    ? 'No available plots found' 
                    : 'No plots found'}
                </div>
              ) : (
                filteredPitaks.map((pitak) => (
                  <button
                    key={pitak.id}
                    type="button"
                    onClick={() => handlePitakSelect(pitak)}
                    className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${pitak.id === value
                        ? 'border-l-2 border-green-600'
                        : ''
                      }`}
                    style={{
                      backgroundColor: pitak.id === value ? 'var(--card-hover-bg)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Layers className="icon-sm" style={{ color: 'var(--accent-earth)' }} />
                          <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                            {pitak.location || `Plot #${pitak.id}`}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(pitak.status)}`}>
                            {getStatusText(pitak.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs mt-xs" style={{ color: 'var(--text-secondary)' }}>
                          <TreePalm className="icon-xs mr-1" />
                          <span>Farm #{pitak.bukidId}</span>
                          {bukidNames[pitak.bukidId] && (
                            <span className="ml-1">({bukidNames[pitak.bukidId]})</span>
                          )}
                        </div>

                        {pitak.location && (
                          <div className="flex items-center text-xs mt-xs" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin className="icon-xs mr-1" />
                            {pitak.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-xs">
                        <div className="font-semibold text-sm" style={{ color: 'var(--sidebar-text)' }}>
                          {pitak.totalLuwang} LuWang
                        </div>
                        <div className="text-xs mt-xs" style={{ color: 'var(--text-secondary)' }}>
                          Capacity
                        </div>
                      </div>
                    </div>

                    {/* Capacity utilization indicator */}
                    {showStats && (
                      <div className="mt-xs flex items-center">
                        <div className="flex-1">
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Utilization
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-xs">
                            <div 
                              className={`h-1.5 rounded-full ${pitak.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                              style={{ width: pitak.status === 'active' ? '75%' : '0%' }}
                            ></div>
                          </div>
                        </div>
                        {pitak.status === 'inactive' && (
                          <AlertCircle className="icon-xs ml-xs" style={{ color: 'var(--accent-rust)' }} />
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PitakSelect;