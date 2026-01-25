// components/UserSelect.tsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, User, Mail, Shield, ShieldCheck, ShieldOff, Phone } from 'lucide-react';
import type { UserData } from '../../../apis/user';
import userAPI from '../../../apis/user';

interface UserSelectProps {
  value: number | null;
  onChange: (userId: number, userData?: UserData) => void;
  disabled?: boolean;
  showDetails?: boolean;
  placeholder?: string;
  roleFilter?: 'admin' | 'manager' | 'user' | 'all';
  activeOnly?: boolean;
  includeInactive?: boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  disabled = false,
  showDetails = true,
  placeholder = 'Select a user',
  roleFilter = 'all',
  activeOnly = true,
  includeInactive = false
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.getAllUsers(1, 1000, 'name', 'ASC', !activeOnly);
      
      if (response.status && response.data?.users) {
        let filtered = response.data.users;
        
        if (roleFilter !== 'all') {
          filtered = filtered.filter(user => user.role === roleFilter);
        }
        
        if (!includeInactive && activeOnly) {
          filtered = filtered.filter(user => user.isActive);
        }
        
        setUsers(filtered);
        setFilteredUsers(filtered);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, activeOnly, includeInactive]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.contact && user.contact.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleUserSelect = (user: UserData) => {
    onChange(user.id, user);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'status-badge-admin';
      case 'manager': return 'status-badge-manager';
      case 'user': return 'status-badge-user';
      default: return 'status-badge-inactive';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="icon-xs" />;
      case 'manager': return <ShieldCheck className="icon-xs" />;
      case 'user': return <ShieldOff className="icon-xs" />;
      default: return null;
    }
  };

  const getRoleText = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const selectedUser = users.find(u => u.id === value);

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
          {selectedUser ? (
            <div className="flex items-center space-x-2">
              <User className="icon-sm" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
                {selectedUser.name || selectedUser.username}
                {showDetails && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                    • {selectedUser.role}
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
                placeholder="Search users by name, username, or email..."
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
                Loading users...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="compact-card text-center">
              <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
              <button
                onClick={fetchUsers}
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
              {filteredUsers.length === 0 ? (
                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${
                      user.id === value
                        ? 'border-l-2 border-green-600'
                        : ''
                    }`}
                    style={{
                      backgroundColor: user.id === value ? 'var(--card-hover-bg)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                          <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                            {user.name || user.username}
                          </div>
                          <div className={`px-xs py-xs rounded-full text-xs font-medium flex items-center gap-1 ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {getRoleText(user.role)}
                          </div>
                          {!user.isActive && (
                            <div className="px-xs py-xs rounded-full text-xs font-medium status-badge-inactive">
                              Inactive
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-xs">
                          <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <Mail className="icon-xs mr-1" />
                            {user.email}
                          </div>
                          
                          {user.contact && (
                            <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <Phone className="icon-xs mr-1" />
                              {user.contact}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-xs text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Username: {user.username}
                        </div>
                      </div>
                      
                      <div className="text-right ml-xs">
                        {user.lastLogin && (
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {user.address && (
                      <div className="mt-xs text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {user.address.length > 80 ? `${user.address.substring(0, 80)}...` : user.address}
                      </div>
                    )}
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

export default UserSelect;