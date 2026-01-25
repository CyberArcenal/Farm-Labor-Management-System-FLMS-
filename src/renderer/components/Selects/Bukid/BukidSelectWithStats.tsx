// components/BukidSelectWithStats.tsx (optional advanced version)
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, MapPin, Users, TreePalm, BarChart3, Layers } from 'lucide-react';
import type { BukidData, BukidSummaryData } from '../../../apis/bukid';
import bukidAPI from '../../../apis/bukid';


interface BukidSelectWithStatsProps {
  value: number | null;
  onChange: (bukidId: number, bukidName: string, bukidData?: BukidData) => void;
  disabled?: boolean;
  showStats?: boolean;
  placeholder?: string;
}

const BukidSelectWithStats: React.FC<BukidSelectWithStatsProps> = ({
  value,
  onChange,
  disabled = false,
  showStats = true,
  placeholder = 'Select a farm (bukid)'
}) => {
  const [bukids, setBukids] = useState<BukidData[]>([]);
  const [filteredBukids, setFilteredBukids] = useState<BukidData[]>([]);
  const [summaries, setSummaries] = useState<Record<number, BukidSummaryData>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBukids();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBukids(bukids);
    } else {
      const filtered = bukids.filter(bukid =>
        bukid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bukid.location && bukid.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBukids(filtered);
    }
  }, [searchTerm, bukids]);

  const fetchBukids = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bukidAPI.getAll({ limit: 1000 });
      if (response.status && response.data?.bukids) {
        const bukidList = response.data.bukids;
        setBukids(bukidList);
        setFilteredBukids(bukidList);
        
        // Fetch summaries for each bukid if showStats is true
        if (showStats) {
          const summaryPromises = bukidList.map(async (bukid: { id?: any; }) => {
            if (bukid.id) {
              try {
                const summaryResponse = await bukidAPI.getSummary(bukid.id);
                if (summaryResponse.status && summaryResponse.data?.summary) {
                  return { id: bukid.id, summary: summaryResponse.data.summary };
                }
              } catch (err) {
                console.error(`Error fetching summary for bukid ${bukid.id}:`, err);
              }
            }
            return null;
          });
          
          const summariesArray = await Promise.all(summaryPromises);
          const summariesMap: Record<number, BukidSummaryData> = {};
          summariesArray.forEach((item?: { id: string | number; summary: any; } | null) => {
            if (item) {
              summariesMap[item.id as number] = item.summary;
            }
          });
          setSummaries(summariesMap);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch farms');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch farms');
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleBukidSelect = (bukid: BukidData) => {
    onChange(bukid.id!, bukid.name, bukid);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedBukid = bukids.find(b => b.id === value);

  return (
    <div className="relative">
      {/* Selected Bukid Display */}
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
          {selectedBukid ? (
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <TreePalm className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                <span className="truncate text-sm font-medium" style={{ color: 'var(--sidebar-text)' }}>
                  {selectedBukid.name}
                </span>
              </div>
              {selectedBukid.location && (
                <span className="text-xs truncate ml-5" style={{ color: 'var(--text-secondary)' }}>
                  {selectedBukid.location}
                </span>
              )}
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
                placeholder="Search farms by name or location..."
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
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader className="icon-sm animate-spin" style={{ color: 'var(--accent-green)' }} />
              <span className="ml-xs text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading farms...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="compact-card text-center">
              <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
              <button
                onClick={fetchBukids}
                className="text-sm compact-button"
                style={{
                  backgroundColor: 'var(--accent-green)',
                  color: 'white',
                  padding: 'var(--size-xs) var(--size-sm)'
                }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Bukids List */}
          {!loading && !error && (
            <div className="max-h-60 overflow-y-auto kabisilya-scrollbar">
              {filteredBukids.length === 0 ? (
                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No farms found
                </div>
              ) : (
                filteredBukids.map((bukid) => {
                  const summary = summaries[bukid.id!];
                  return (
                    <button
                      key={bukid.id}
                      type="button"
                      onClick={() => handleBukidSelect(bukid)}
                      className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${bukid.id === value
                          ? 'border-l-2 border-green-600'
                          : ''
                        }`}
                      style={{
                        backgroundColor: bukid.id === value ? 'var(--card-hover-bg)' : 'transparent',
                        borderBottom: '1px solid var(--border-light)'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <TreePalm className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                            <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                              {bukid.name}
                            </div>
                          </div>
                          
                          {bukid.location && (
                            <div className="flex items-center text-xs mt-xs" style={{ color: 'var(--text-secondary)' }}>
                              <MapPin className="icon-xs mr-1" />
                              {bukid.location}
                            </div>
                          )}

                          {bukid.status && (
                            <div className="mt-xs">
                              <span
                                className={`inline-flex items-center px-xs py-xs rounded-full text-xs font-medium ${bukid.status === 'active'
                                    ? 'status-badge-planted'
                                    : bukid.status === 'inactive'
                                    ? 'status-badge-fallow'
                                    : 'status-badge-growing'
                                  }`}
                              >
                                {bukid.status === 'active' ? 'Active' : 
                                 bukid.status === 'inactive' ? 'Inactive' : 
                                 bukid.status.charAt(0).toUpperCase() + bukid.status.slice(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {showStats && summary && (
                          <div className="text-right ml-xs">
                            <div className="flex items-center justify-end gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <Layers className="icon-xs" />
                              <span>{summary.pitakCount} plots</span>
                            </div>
                            <div className="text-xs mt-xs" style={{ color: 'var(--text-secondary)' }}>
                              {summary.assignmentCount} workers
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes preview */}
                      {bukid.notes && (
                        <div className="mt-xs text-xs text-gray-500 truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {bukid.notes.length > 60 ? `${bukid.notes.substring(0, 60)}...` : bukid.notes}
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

export default BukidSelectWithStats;