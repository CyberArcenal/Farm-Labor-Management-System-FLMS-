// src/components/Shared/PageNotFound.tsx - UPDATED FOR KABISILYA
import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Home,
  Search,
  RefreshCw,
  ArrowLeft,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Sprout,
  Leaf,
  MapPin,
  DollarSign,
  Calendar,
  Warehouse,
  Truck,
  Droplets,
  Sun,
  CloudRain
} from 'lucide-react';
import { kabAuthStore } from '../../lib/kabAuthStore';

const PageNotFound: React.FC = () => {
  const userInfo = kabAuthStore.getUserDisplayInfo();

  // Common navigation paths for Kabisilya Management
  const quickLinks = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      color: 'var(--accent-green)',
      permission: () => kabAuthStore.canAccessModule('dashboard')
    },
    {
      path: '/workers',
      label: 'Workers',
      icon: Users,
      color: 'var(--accent-sky)',
      permission: () => kabAuthStore.canAccessModule('workers')
    },
    {
      path: '/assignments',
      label: 'Assignments',
      icon: Package,
      color: 'var(--accent-purple)',
      permission: () => kabAuthStore.canAccessModule('assignments')
    },
    {
      path: '/pitaks',
      label: 'Pitaks',
      icon: MapPin,
      color: 'var(--accent-earth)',
      permission: () => kabAuthStore.canAccessModule('pitaks')
    },
    {
      path: '/kabisilyas',
      label: 'Kabisilyas',
      icon: Sprout,
      color: 'var(--accent-green)',
      permission: () => kabAuthStore.canAccessModule('kabisilyas')
    },
    {
      path: '/debts',
      label: 'Debts',
      icon: DollarSign,
      color: 'var(--accent-gold)',
      permission: () => kabAuthStore.canAccessModule('debts')
    },
    {
      path: '/payments',
      label: 'Payments',
      icon: DollarSign,
      color: 'var(--accent-success)',
      permission: () => kabAuthStore.canAccessModule('payments')
    },
    {
      path: '/inventory',
      label: 'Inventory',
      icon: Warehouse,
      color: 'var(--accent-rust)',
      permission: () => kabAuthStore.canAccessModule('inventory')
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: BarChart3,
      color: 'var(--accent-sky)',
      permission: () => kabAuthStore.canAccessModule('reports')
    },
    {
      path: '/calendar',
      label: 'Calendar',
      icon: Calendar,
      color: 'var(--accent-purple)',
      permission: () => kabAuthStore.canAccessModule('calendar')
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      color: 'var(--accent-rust)',
      permission: () => kabAuthStore.canAccessModule('settings')
    }
  ];

  // Filter links based on user permissions
  const filteredLinks = quickLinks.filter(link => link.permission());

  const handleGoBack = () => {
    window.history.back();
  };

  // Get user role for personalized message
  const getUserRoleMessage = () => {
    if (kabAuthStore.isAdmin()) return 'administrator';
    if (kabAuthStore.isManagerOrAdmin()) return 'farm manager';
    return 'farm worker';
  };

  // Get season indicator (same as dashboard)
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 10) return { name: 'Rainy Season', icon: CloudRain, color: 'var(--accent-sky)' };
    return { name: 'Dry Season', icon: Sun, color: 'var(--accent-gold)' };
  };

  const currentSeason = getCurrentSeason();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-field-pattern">
      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* Error Code Display */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="text-9xl font-bold tracking-tighter" style={{ color: 'var(--primary-color)' }}>
              4<span className="relative">
                0
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-gold)' }}></div>
              </span>4
            </div>
            <div className="absolute -top-6 -right-6 animate-bounce">
              <AlertTriangle className="w-12 h-12" style={{ color: 'var(--accent-gold)' }} />
            </div>
          </div>
          <div className="mt-2 text-lg font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Page Not Found
          </div>
        </div>

        {/* Error Message Card */}
        <div className="farm-card rounded-xl p-8 mb-8 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-green-light)' }}>
            <Leaf className="w-10 h-10" style={{ color: 'var(--accent-green)' }} />
          </div>

          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Field Path Not Found
          </h1>

          <p className="text-base mb-6 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            The farm route you're looking for could not be found in our Kabisilya Management System.
            It might have been moved, harvested, or you might have entered an incorrect path.
            As a {getUserRoleMessage()}, you can try one of the available farm sections below.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{
            background: 'var(--card-secondary-bg)',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace'
          }}>
            <Search className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <code className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
              {window.location.pathname}
            </code>
          </div>

          {/* Season Indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{
            backgroundColor: 'var(--card-secondary-bg)',
            border: '1px solid var(--border-color)'
          }}>
            {React.createElement(currentSeason.icon, {
              className: "w-4 h-4",
              style: { color: currentSeason.color }
            })}
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {currentSeason.name}
            </span>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="farm-card rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Quick Farm Navigation
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.path}
                  className="group flex flex-col items-center p-4 rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    background: 'var(--card-secondary-bg)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div className="p-3 rounded-full mb-3 transition-all duration-200 group-hover:scale-110" style={{ 
                    backgroundColor: link.color + '20',
                    border: `2px solid ${link.color}40`
                  }}>
                    <Icon className="w-6 h-6" style={{ color: link.color }} />
                  </div>
                  <span className="text-sm font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Info Card (if logged in) */}
        {userInfo && (
          <div className="farm-card rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold shadow-md"
                  style={{
                    background: userInfo.colorScheme.bg,
                    color: userInfo.colorScheme.text
                  }}
                >
                  {userInfo.initials || 'FW'}
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {userInfo.name || 'Farm Worker'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {userInfo.role || 'Worker'}
                  </div>
                  <div className="text-xs mt-1 px-2 py-1 rounded-full inline-block" style={{
                    background: 'var(--card-hover-bg)',
                    color: 'var(--text-secondary)'
                  }}>
                    Kabisilya Management System
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Session Status</div>
                <div className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse"></div>
                  Active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
            style={{
              background: 'var(--card-secondary-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md hover:scale-105"
            style={{
              background: 'var(--gradient-primary)',
              color: 'var(--sidebar-text)'
            }}
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
            style={{
              background: 'var(--card-secondary-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>

          {kabAuthStore.isAuthenticated() && (
            <button
              onClick={() => kabAuthStore.logout()}
              className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md hover:scale-105"
              style={{
                background: 'var(--accent-rust)',
                color: 'white'
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Need assistance? Contact your farm administrator if you believe this is an error.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }}></div>
              Kabisilya Management System
            </span>
            <span>•</span>
            <span>Error Code: 404</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
            background: 'var(--card-secondary-bg)',
            border: '1px solid var(--border-color)'
          }}>
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse"></div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Kabisilya Management System • v1.0 • {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* Decorative farm elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-16 h-16 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }}></div>
        <div className="absolute bottom-4 left-3/4 w-12 h-12 rounded-full" style={{ backgroundColor: 'var(--accent-earth)' }}></div>
        <div className="absolute bottom-8 left-1/2 w-20 h-20 rounded-full" style={{ backgroundColor: 'var(--accent-sky)' }}></div>
        <div className="absolute bottom-16 left-10 w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--accent-gold)' }}></div>
      </div>
    </div>
  );
};

export default PageNotFound;