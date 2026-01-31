// components/TopBar.tsx
import {
  Menu,
  Search,
  User,
  Bell,
  Calendar,
  RefreshCw,
  Sun,
  Thermometer,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import systemConfigAPI from '../../apis/system_config';

interface TopBarProps {
  toggleSidebar: () => void;
}

interface DefaultSessionData {
  id: number;
  seasonType: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultSession, setDefaultSession] = useState<DefaultSessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Weather data
  const weatherData = {
    temperature: 28,
    condition: 'Sunny',
    icon: Sun,
    color: 'var(--accent-gold)'
  };

  // Fetch default session data
  const fetchDefaultSession = async () => {
    try {
      setLoadingSession(true);
      const response = await systemConfigAPI.getDefaultSessionData();
      if (response.status && response.data) {
        setDefaultSession(response.data);
      } else {
        console.warn("No default session found or error fetching session data");
      }
    } catch (error) {
      console.error("Error fetching default session:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchDefaultSession();
    
    // Refresh session data every 5 minutes
    const interval = setInterval(fetchDefaultSession, 300000);
    return () => clearInterval(interval);
  }, []);

  // Define searchable routes
  const allRoutes = useMemo(() => [
    // Dashboard
    { path: '/', name: 'Dashboard', category: 'Main' },
    { path: '/dashboard', name: 'Dashboard', category: 'Main' },
    // Farm Management
    { path: '/farms/bukid', name: 'Mga Bukid', category: 'Farm' },
    { path: '/farms/pitak', name: 'Mga Pitak', category: 'Farm' },
    { path: '/farms/assignments', name: 'Assignments', category: 'Farm' },
    // Workers
    { path: '/workers/list', name: 'Worker Directory', category: 'Workers' },
    { path: '/workers/attendance', name: 'Attendance', category: 'Workers' },
    // Finance
    { path: '/finance/payments', name: 'Payments', category: 'Finance' },
    { path: '/finance/debts', name: 'Debt Management', category: 'Finance' },
    // Reports
    { path: '/analytics/bukid', name: 'Bukid Reports', category: 'Reports' },
    { path: '/analytics/pitak', name: 'Pitak Reports', category: 'Reports' },
    { path: '/analytics/finance', name: 'Financial Reports', category: 'Reports' },
    // System
    { path: '/system/users', name: 'User Management', category: 'System' },
    { path: '/system/audit', name: 'Audit Trail', category: 'System' },
    { path: '/system/sessions', name: 'Session Management', category: 'System' },
    { path: '/system/settings', name: 'Farm Settings', category: 'System' },
  ], []);

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return allRoutes.filter(route =>
      route.name.toLowerCase().includes(query) ||
      route.path.toLowerCase().includes(query.replace(/\s+/g, '-')) ||
      route.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allRoutes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredRoutes.length > 0) {
      navigate(filteredRoutes[0].path);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleRouteSelect = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDefaultSession();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Get session status color
  const getSessionStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'var(--accent-green)';
      case 'closed': return 'var(--accent-orange)';
      case 'archived': return 'var(--text-tertiary)';
      default: return 'var(--border-color)';
    }
  };

  // Get session status icon
  const getSessionStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '🟢';
      case 'closed': return '🟡';
      case 'archived': return '⚫';
      default: return '⚪';
    }
  };

  // Format season type for display
  const formatSeasonType = (seasonType: string) => {
    switch (seasonType?.toLowerCase()) {
      case 'tag-ulan': return 'Tag-ulan';
      case 'tag-araw': return 'Tag-araw';
      default: return seasonType || 'Custom';
    }
  };

  // Today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header 
      className="sticky top-0 z-40 windows-card border-b"
      style={{ 
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
        borderRadius: '0'
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            className="windows-btn windows-btn-secondary p-2 md:hidden"
            style={{ 
              background: 'var(--accent-green-light)',
              borderColor: 'var(--accent-green)',
              color: 'var(--accent-green)'
            }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'var(--accent-green)',
                color: 'white'
              }}
            >
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold windows-title" style={{ color: 'white' }}>
                Kabisilya
              </h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Farm Management
              </p>
            </div>
          </div>

          {/* Default Session Display */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              minWidth: '220px'
            }}
          >
            <CalendarDays className="w-4 h-4 flex-shrink-0" style={{ color: 'white' }} />
            <div className="min-w-0">
              {loadingSession ? (
                <div className="flex items-center gap-2">
                  <div className="animate-pulse h-3 w-24 bg-white/20 rounded"></div>
                </div>
              ) : defaultSession ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate" style={{ color: 'white' }}>
                      {formatSeasonType(defaultSession.seasonType)} {defaultSession.year}
                    </span>
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                      style={{ 
                        background: getSessionStatusColor(defaultSession.status),
                        color: 'white'
                      }}
                    >
                      {defaultSession.status}
                    </span>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    ID: {defaultSession.id} • {defaultSession.startDate 
                      ? new Date(defaultSession.startDate).toLocaleDateString()
                      : 'No start date'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" style={{ color: 'var(--accent-red)' }} />
                    <span className="text-xs font-medium" style={{ color: 'white' }}>
                      No Active Session
                    </span>
                  </div>
                  <div 
                    className="text-xs cursor-pointer hover:underline"
                    style={{ color: 'var(--accent-green-light)' }}
                    onClick={() => navigate('/system/sessions')}
                  >
                    Click to set default session
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: 'white' }} />
            <div className="flex flex-col">
              <div className="text-sm font-medium" style={{ color: 'white' }}>
                {today.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{formattedDate}</div>
            </div>
          </div>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3! pointer-events-none">
                  <Search className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <input
                  type="text"
                  placeholder="Search farms, workers, assignments..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="windows-input pl-10! pr-4 py-2.5 text-sm w-full"
                  style={{ 
                    background: 'white',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ 
                        background: 'var(--border-color)', 
                        color: 'var(--text-tertiary)' 
                      }}
                    >
                      <span className="text-xs">×</span>
                    </div>
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && filteredRoutes.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-50"
                style={{ 
                  background: 'white',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Quick Navigation
                  </div>
                </div>
                <div className="max-h-80 overflow-auto">
                  {filteredRoutes.map((route, index) => (
                    <button
                      key={index}
                      onClick={() => handleRouteSelect(route.path)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 text-sm flex justify-between items-center"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span>{route.name}</span>
                      <span className="text-xs px-2 py-1 rounded"
                        style={{ 
                          background: 'var(--card-secondary-bg)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {route.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Weather Widget */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <weatherData.icon className="w-5 h-5" style={{ color: 'white' }} />
            <div className="flex flex-col">
              <div className="text-sm font-medium" style={{ color: 'white' }}>
                {weatherData.temperature}°C
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {weatherData.condition}
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="windows-btn flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ 
              background: 'var(--accent-green)',
              color: 'white',
              border: 'none'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline text-sm">Refresh</span>
          </button>

          {/* Notification Bell */}
          <button className="relative windows-btn p-2 rounded-lg"
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white'
            }}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--accent-red)' }}
            ></span>
          </button>

          {/* Profile */}
          <div className="flex items-center gap-2 p-1 rounded-lg cursor-pointer"
            onClick={() => navigate('/system/profile')}
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ 
                background: 'var(--accent-green)',
                color: 'white'
              }}
            >
              <User className="w-5 h-5" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-medium" style={{ color: 'white' }}>
                Farm Admin
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {defaultSession 
                  ? `Session: ${defaultSession.id}`
                  : 'Administrator'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;