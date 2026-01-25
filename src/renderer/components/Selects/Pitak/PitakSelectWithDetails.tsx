// components/PitakSelectWithDetails.tsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, MapPin, TreePalm, Layers, BarChart3, Users, Calendar, AlertCircle } from 'lucide-react';
import type { PitakData, PitakWithDetails } from '../../../apis/pitak';
import pitakAPI from '../../../apis/pitak';

interface PitakSelectWithDetailsProps {
  value: number | null;
  onChange: (pitakId: number, pitakData?: PitakData) => void;
  disabled?: boolean;
  bukidId?: number;
  dateFilter?: string; // For checking availability on specific date
  showDetails?: boolean;
  placeholder?: string;
  showOnlyAvailable?: boolean;
}

const PitakSelectWithDetails: React.FC<PitakSelectWithDetailsProps> = ({
  value,
  onChange,
  disabled = false,
  bukidId,
  dateFilter,
  showDetails = true,
  placeholder = 'Select a plot (pitak)',
  showOnlyAvailable = false
}) => {
  const [pitaks, setPitaks] = useState<PitakWithDetails[]>([]);
  const [filteredPitaks, setFilteredPitaks] = useState<PitakWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityChecks, setAvailabilityChecks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchPitaks();
  }, [bukidId, dateFilter]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPitaks(pitaks);
    } else {
      const filtered = pitaks.filter(pitak => {
        const locationMatch = pitak.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const bukidMatch = pitak.bukid?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const statusMatch = pitak.status?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        
        return locationMatch || bukidMatch || statusMatch;
      });
      setFilteredPitaks(filtered);
    }
  }, [searchTerm, pitaks]);

  const fetchPitaks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (bukidId) filters.bukidId = bukidId;
      
      const response = await pitakAPI.getAllPitaks(filters);
      
      if (response.status && response.data) {
        let pitakList = Array.isArray(response.data) ? response.data : response.data.pitaks || [];
        
        // If showOnlyAvailable is true, filter only available pitaks
        if (showOnlyAvailable && dateFilter) {
          const availabilityPromises = pitakList.map(async (pitak: { id: number; }) => {
            try {
              const available = await pitakAPI.isPitakAvailable(pitak.id, dateFilter);
              return { pitak, available };
            } catch {
              return { pitak, available: false };
            }
          });
          
          const results = await Promise.all(availabilityPromises);
          pitakList = results.filter((result: { available: any; }) => result.available).map((result: { pitak: any; }) => result.pitak);
        }
        
        setPitaks(pitakList as PitakWithDetails[]);
        setFilteredPitaks(pitakList as PitakWithDetails[]);
        
        // Check availability for all pitaks if dateFilter is provided
        if (dateFilter) {
          checkAllAvailabilities(pitakList);
        }
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

  const checkAllAvailabilities = async (pitakList: any[]) => {
    const checks: Record<number, boolean> = {};
    
    for (const pitak of pitakList) {
      try {
        const available = await pitakAPI.isPitakAvailable(pitak.id, dateFilter);
        checks[pitak.id] = available;
      } catch {
        checks[pitak.id] = false;
      }
    }
    
    setAvailabilityChecks(checks);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePitakSelect = (pitak: PitakWithDetails) => {
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

  const getUtilizationRate = (pitak: PitakWithDetails) => {
    if (!pitak.stats || !pitak.totalLuwang || pitak.totalLuwang === 0) return 0;
    const assigned = pitak.stats.assignments?.totalLuWangAssigned || 0;
    return Math.round((assigned / pitak.totalLuwang) * 100);
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
          borderColor: isOpen ? 'var(--accent-earth)' : 'var(--border-color)',
          borderWidth: '1px',
          minHeight: '42px'
        }}
      >
        <div className="flex items-center truncate">
          {selectedPitak ? (
            <div className="flex flex-col flex-1">
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
                <span>{selectedPitak.bukid?.name || `Farm #${selectedPitak.bukidId}`}</span>
                <span className="mx-2">•</span>
                <BarChart3 className="icon-xs mr-1" />
                <span>{selectedPitak.totalLuwang} LuWang</span>
                {dateFilter && (
                  <>
                    <span className="mx-2">•</span>
                    <Calendar className="icon-xs mr-1" />
                    <span>{dateFilter}</span>
                  </>
                )}
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
                placeholder="Search plots by location, farm, or status..."
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
              <div className="text-xs px-3 py-1 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                <TreePalm className="icon-xs mr-1" />
                Filtered by Farm #{bukidId}
              </div>
            )}
            {dateFilter && (
              <div className="text-xs px-3 py-1 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="icon-xs mr-1" />
                Availability for {dateFilter}
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
                  {showOnlyAvailable && dateFilter
                    ? `No available plots found for ${dateFilter}`
                    : 'No plots found'}
                </div>
              ) : (
                filteredPitaks.map((pitak) => {
                  const utilizationRate = getUtilizationRate(pitak);
                  const isAvailable = dateFilter ? availabilityChecks[pitak.id] : true;
                  
                  return (
                    <button
                      key={pitak.id}
                      type="button"
                      onClick={() => handlePitakSelect(pitak)}
                      disabled={dateFilter !== "" && !isAvailable}
                      className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${pitak.id === value
                          ? 'border-l-2 border-green-600'
                          : ''
                        } ${dateFilter && !isAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                            {dateFilter && (
                              <span className={`text-xs px-2 py-1 rounded-full ${isAvailable ? 'status-badge-planted' : 'status-badge-fallow'}`}>
                                {isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs mt-xs" style={{ color: 'var(--text-secondary)' }}>
                            <TreePalm className="icon-xs mr-1" />
                            <span>{pitak.bukid?.name || `Farm #${pitak.bukidId}`}</span>
                            {pitak.bukid?.kabisilya && (
                              <>
                                <span className="mx-1">•</span>
                                <Users className="icon-xs mr-1" />
                                <span>{pitak.bukid.kabisilya.name}</span>
                              </>
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
                            Total Capacity
                          </div>
                        </div>
                      </div>

                      {/* Stats and utilization */}
                      {showDetails && (
                        <div className="mt-xs grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            <div className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                              {pitak.stats?.assignments?.total || 0}
                            </div>
                            <div>Assignments</div>
                          </div>
                          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            <div className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                              {utilizationRate}%
                            </div>
                            <div>Utilization</div>
                          </div>
                          <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            <div className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                              {pitak.stats?.payments?.total || 0}
                            </div>
                            <div>Payments</div>
                          </div>
                        </div>
                      )}

                      {/* Warning for unavailable pitaks */}
                      {dateFilter && !isAvailable && (
                        <div className="mt-xs flex items-center text-xs" style={{ color: 'var(--accent-rust)' }}>
                          <AlertCircle className="icon-xs mr-1" />
                          <span>Not available for {dateFilter}</span>
                        </div>
                      )}
                    </button>
                  );
                })
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

export default PitakSelectWithDetails;