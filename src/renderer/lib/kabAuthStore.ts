// Kabisilya Management Auth Store

import type { UserData } from "../apis/user";

export interface KabUser extends UserData {
  permissions: string[];
  department?: string;
  employeeId?: string;
  displayName?: string;
  shiftStatus?: 'active' | 'inactive';
}

export interface KabAuthData {
  user: KabUser;
  token: string;
  expiresIn: number; // in seconds
}

export interface KabAuthState {
  user: KabUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

type KabAuthChangeCallback = (isAuthenticated: boolean) => void;

export class KabAuthStore {
  private readonly APP_NAME = "KABISILYA_MANAGEMENT";
  private readonly ACCESS_TOKEN_KEY = `${this.APP_NAME}_token`;
  private readonly USER_DATA_KEY = `${this.APP_NAME}_user`;
  private readonly TOKEN_EXPIRATION_KEY = `${this.APP_NAME}_expiration`;
  private notifying = false;

  // Set auth data for Kabisilya
  setAuthData(data: KabAuthData): boolean {
    try {
      const expirationTime = Date.now() + data.expiresIn * 1000;
      localStorage.setItem(this.ACCESS_TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data.user));
      localStorage.setItem(this.TOKEN_EXPIRATION_KEY, expirationTime.toString());

      this.notifyAuthChange();
      console.log("Kab Auth saved for user:", data.user.username);
      return true;
    } catch (err: any) {
      console.error("Error saving Kab auth data:", err);
      return false;
    }
  }

  // Get current auth state
  getState(): KabAuthState {
    return {
      user: this.getUser(),
      token: this.getToken(),
      isAuthenticated: this.isAuthenticated(),
    };
  }

  // Get stored token if not expired
  getToken(): string | null {
    if (this.isTokenExpired()) {
      console.warn("Kab Token expired");
      return null;
    }
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Get current user
  getUser(): KabUser | null {
    const raw = localStorage.getItem(this.USER_DATA_KEY);
    if (!raw) return null;

    try {
      const userData = JSON.parse(raw) as KabUser;
      // Validate required fields
      if (!userData.id || !userData.username) {
        console.warn("Invalid user data in storage");
        this.clearAuth();
        return null;
      }
      return userData;
    } catch (err: any) {
      console.error("Error parsing Kab user data:", err);
      return null;
    }
  }

  // Check user permissions
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  }

  // Get user role
  getRole(): 'admin' | 'manager' | 'user' | '' {
    const user = this.getUser();
    return user?.role || '';
  }

  // Check if user is admin
  isAdmin(): boolean {
    const role = this.getRole();
    return role === 'admin';
  }

  // Check if user is manager or admin
  isManagerOrAdmin(): boolean {
    const role = this.getRole();
    return role === 'admin' || role === 'manager';
  }

  // Check if user is regular user
  isUser(): boolean {
    const role = this.getRole();
    return role === 'user';
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user && !this.isTokenExpired();
  }

  // Check token expiration
  isTokenExpired(): boolean {
    const exp = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
    if (!exp) return true;
    
    try {
      const expirationTime = parseInt(exp, 10);
      if (isNaN(expirationTime)) return true;
      return Date.now() >= expirationTime;
    } catch {
      return true;
    }
  }

  // Clear auth data
  clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
    this.notifyAuthChange();
    console.log("Kab Authentication data cleared");
  }

  // Logout and redirect
  logout(): void {
    this.clearAuth();
    window.location.href = '/login';
  }

  // Notify auth state changes
  private notifyAuthChange(): void {
    if (this.notifying) return;
    this.notifying = true;

    const event = new CustomEvent("kabAuthStateChanged", {
      detail: { authenticated: this.isAuthenticated() },
    });
    document.dispatchEvent(event);

    this.notifying = false;
  }

  // Subscribe to auth changes
  subscribe(callback: KabAuthChangeCallback): void {
    window.addEventListener("storage", (e: StorageEvent) => {
      if (
        e.key === this.ACCESS_TOKEN_KEY ||
        e.key === this.TOKEN_EXPIRATION_KEY ||
        e.key === this.USER_DATA_KEY
      ) {
        callback(this.isAuthenticated());
      }
    });
  }

  // Extended user info methods for Kabisilya dashboard
  getUserInitials(): string {
    const user = this.getUser();
    if (!user?.username) return 'U';
    
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return user.username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getUserColorScheme(): { bg: string; text: string } {
    const role = this.getRole();
    
    if (role === 'admin') {
      return { 
        bg: 'var(--gradient-primary)',
        text: 'white'
      };
    }
    
    if (role === 'manager') {
      return { 
        bg: 'var(--gradient-success)',
        text: 'white'
      };
    }
    
    if (role === 'user') {
      return { 
        bg: 'var(--gradient-earth)',
        text: 'white'
      };
    }
    
    return { 
      bg: 'var(--card-secondary-bg)',
      text: 'var(--text-primary)'
    };
  }

  // Get dashboard permissions based on user role for Kabisilya
  getDashboardPermissions(): {
    canManageWorkers: boolean;
    canManageAssignments: boolean;
    canManageDebts: boolean;
    canViewReports: boolean;
    canManagePitaks: boolean;
    canManageKabisilyas: boolean;
    canManagePayments: boolean;
    canManageInventory: boolean;
  } {
    const isAdmin = this.isAdmin();
    const isManager = this.isManagerOrAdmin();
    const isUser = this.isUser();
    
    return {
      canManageWorkers: isAdmin || isManager || this.hasPermission('can_manage_workers'),
      canManageAssignments: isAdmin || isManager || this.hasPermission('can_manage_assignments'),
      canManageDebts: isAdmin || isManager || this.hasPermission('can_manage_debts'),
      canViewReports: isAdmin || isManager || this.hasPermission('can_view_reports'),
      canManagePitaks: isAdmin || isManager || this.hasPermission('can_manage_pitaks'),
      canManageKabisilyas: isAdmin || isManager || this.hasPermission('can_manage_kabisilyas'),
      canManagePayments: isAdmin || isManager || this.hasPermission('can_manage_payments'),
      canManageInventory: isAdmin || isManager || this.hasPermission('can_manage_inventory')
    };
  }

  // Get user display info for UI
  getUserDisplayInfo() {
    const user = this.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.displayName || user.name || user.username,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      initials: this.getUserInitials(),
      colorScheme: this.getUserColorScheme(),
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      profilePicture: user.profilePicture
    };
  }

  // Check if user can access a specific Kabisilya module
  canAccessModule(module: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    // Admin can access everything
    if (this.isAdmin()) return true;
    
    const role = user.role;
    const permissions = user.permissions || [];
    
    // Kabisilya Module-based permission checks
    switch (module) {
      case 'dashboard':
        return true;
        
      case 'workers':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_workers') ||
               permissions.includes('can_view_workers');
               
      case 'assignments':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_assignments') ||
               permissions.includes('can_view_assignments');
               
      case 'debts':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_debts') ||
               permissions.includes('can_view_debts');
               
      case 'pitaks':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_pitaks') ||
               permissions.includes('can_view_pitaks');
               
      case 'kabisilyas':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_kabisilyas') ||
               permissions.includes('can_view_kabisilyas');
               
      case 'payments':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_payments') ||
               permissions.includes('can_view_payments');
               
      case 'reports':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_view_reports');
               
      case 'inventory':
        return this.isManagerOrAdmin() || 
               permissions.includes('can_manage_inventory') ||
               permissions.includes('can_view_inventory');
               
      case 'settings':
        return this.isAdmin() || permissions.includes('can_manage_users');
        
      case 'profile':
        return true; // Everyone can access their own profile
        
      default:
        return false;
    }
  }

  // Get employee ID if available
  getEmployeeId(): string | null {
    const user = this.getUser();
    return user?.employeeId || null;
  }

  // Validate session
  validateSession(): { isValid: boolean; user: KabUser | null; reason?: string } {
    if (!this.isAuthenticated()) {
      return { isValid: false, user: null, reason: 'Not authenticated' };
    }
    
    const user = this.getUser();
    if (!user) {
      return { isValid: false, user: null, reason: 'User data not found' };
    }
    
    // Check if user is active
    if (!user.isActive) {
      return { isValid: false, user: null, reason: 'User account is inactive' };
    }
    
    return { isValid: true, user };
  }

  // Get shift status for Kabisilya
  getShiftStatus(): 'active' | 'inactive' {
    const user = this.getUser();
    // If user has shiftStatus property, use it, otherwise assume active if authenticated
    return user?.shiftStatus || (this.isAuthenticated() ? 'active' : 'inactive');
  }

  // Check if user can perform specific Kabisilya actions
  canPerformAction(action: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    const isAdmin = this.isAdmin();
    const isManager = this.isManagerOrAdmin();

    switch (action) {
      // Worker Management
      case 'create_worker':
        return isAdmin || isManager || this.hasPermission('can_create_workers');
      
      case 'edit_worker':
        return isAdmin || isManager || this.hasPermission('can_edit_workers');
      
      case 'delete_worker':
        return isAdmin || this.hasPermission('can_delete_workers');
      
      // Assignment Management
      case 'create_assignment':
        return isAdmin || isManager || this.hasPermission('can_create_assignments');
      
      case 'edit_assignment':
        return isAdmin || isManager || this.hasPermission('can_edit_assignments');
      
      case 'delete_assignment':
        return isAdmin || this.hasPermission('can_delete_assignments');
      
      // Debt Management
      case 'create_debt':
        return isAdmin || isManager || this.hasPermission('can_create_debts');
      
      case 'adjust_debt':
        return isAdmin || isManager || this.hasPermission('can_adjust_debts');
      
      case 'forgive_debt':
        return isAdmin || this.hasPermission('can_forgive_debts');
      
      // Payment Management
      case 'record_payment':
        return isAdmin || isManager || this.hasPermission('can_record_payments');
      
      case 'edit_payment':
        return isAdmin || isManager || this.hasPermission('can_edit_payments');
      
      case 'delete_payment':
        return isAdmin || this.hasPermission('can_delete_payments');
      
      // Reports
      case 'generate_reports':
        return isAdmin || isManager || this.hasPermission('can_generate_reports');
      
      case 'export_data':
        return isAdmin || isManager || this.hasPermission('can_export_data');
      
      // System Actions
      case 'manage_users':
        return isAdmin || this.hasPermission('can_manage_users');
      
      case 'change_settings':
        return isAdmin || this.hasPermission('can_change_settings');
      
      case 'backup_database':
        return isAdmin || this.hasPermission('can_backup_database');
      
      default:
        return false;
    }
  }

  // Update user profile
  updateUserProfile(updates: Partial<KabUser>): boolean {
    try {
      const currentUser = this.getUser();
      if (!currentUser) return false;

      const updatedUser: KabUser = {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(updatedUser));
      this.notifyAuthChange();
      
      console.log("User profile updated");
      return true;
    } catch (err: any) {
      console.error("Error updating user profile:", err);
      return false;
    }
  }

  // Refresh token
  refreshToken(newToken: string, expiresIn: number): boolean {
    try {
      const expirationTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.ACCESS_TOKEN_KEY, newToken);
      localStorage.setItem(this.TOKEN_EXPIRATION_KEY, expirationTime.toString());
      
      this.notifyAuthChange();
      console.log("Token refreshed");
      return true;
    } catch (err: any) {
      console.error("Error refreshing token:", err);
      return false;
    }
  }

  // Check if user needs to change password (based on last password change)
  needsPasswordChange(daysThreshold: number = 90): boolean {
    const user = this.getUser();
    if (!user || !user.updatedAt) return false;
    
    const lastUpdate = new Date(user.updatedAt);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceUpdate >= daysThreshold;
  }

  // Get user's permissions list
  getPermissions(): string[] {
    const user = this.getUser();
    return user?.permissions || [];
  }

  // Check if user has any of the given permissions
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all of the given permissions
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.every(permission => userPermissions.includes(permission));
  }
}

// Export singleton instance for Kabisilya
export const kabAuthStore = new KabAuthStore();