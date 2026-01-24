// userAPI.ts - SIMILAR STRUCTURE TO activation.ts
export interface UserData {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  contact?: string | null;
  address?: string | null;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string | null;
}

export interface UserPaginationData {
  users: UserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{ role: string; count: number }>;
  recentRegistrations: number;
  usersWithLastLogin: number;
  usersNeverLoggedIn: number;
}

export interface UserActivityData {
  id: number;
  user_id: number;
  action: string;
  entity?: string | null;
  entity_id?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: string | null;
  created_at: string;
}

export interface UserActivityPaginationData {
  activities: UserActivityData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkOperationResult {
  created: UserData[];
  updated: UserData[];
  errors: Array<{
    user: any;
    error: string;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export interface CSVExportData {
  csv: string;
  filename: string;
  count: number;
  fields: string[];
  generatedAt: string;
}

export interface LoginResponseData {
  user: UserData;
  token: string;
  expiresIn: number;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  id: number;
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateRequest {
  userId: number;
  name?: string;
  email?: string;
  contact?: string;
  address?: string;
}

export interface ProfilePictureUploadResponse {
  user: UserData;
  imageUrl: string;
  filename: string;
}

export interface UserPayload {
  method: string;
  params?: Record<string, any>;
}

// Base Response Interfaces
export interface UserResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface UserListResponse extends UserResponse<UserPaginationData> {}
export interface UserSingleResponse extends UserResponse<{ user: UserData }> {}
export interface UserStatsResponse extends UserResponse<UserStatsData> {}
export interface UserActivityResponse extends UserResponse<UserActivityPaginationData> {}
export interface UserBulkResponse extends UserResponse<BulkOperationResult> {}
export interface CSVExportResponse extends UserResponse<CSVExportData> {}
export interface LoginResponse extends UserResponse<LoginResponseData> {}
export interface ValidationResponse extends UserResponse<boolean> {}
export interface SimpleResponse extends UserResponse<null> {}
export interface FileOperationResponse extends UserResponse<{ filePath: string }> {}
export interface ProfilePictureResponse extends UserResponse<ProfilePictureUploadResponse> {}

class UserAPI {
  // 🔎 Read-only methods
  
  /**
   * Get all users with pagination
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    includeInactive: boolean = false
  ): Promise<UserListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getAllUsers",
        params: { page, limit, sortBy, sortOrder, includeInactive },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get users");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user");
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserByUsername",
        params: { username },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user by username");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user by username");
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserByEmail",
        params: { email },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user by email");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user by email");
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(
    role: string,
    page: number = 1,
    limit: number = 50
  ): Promise<UserListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUsersByRole",
        params: { role, page, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get users by role");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get users by role");
    }
  }

  /**
   * Get active users
   */
  async getActiveUsers(
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<UserListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getActiveUsers",
        params: { page, limit, sortBy, sortOrder },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get active users");
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user stats");
    }
  }

  /**
   * Search users
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 50,
    role?: string,
    isActive?: boolean
  ): Promise<UserListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "searchUsers",
        params: { query, page, limit, role, isActive },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search users");
    }
  }

  // ✏️ Write operation methods

  /**
   * Create a new user
   */
  async createUser(
    username: string,
    email: string,
    password: string,
    role: 'admin' | 'manager' | 'user' = 'user',
    isActive: boolean = true
  ): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "createUser",
        params: { username, email, password, role, isActive },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create user");
    }
  }

  /**
   * Update user
   */
  async updateUser(
    id: number,
    updates: {
      username?: string;
      email?: string;
      role?: 'admin' | 'manager' | 'user';
      isActive?: boolean;
    }
  ): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUser",
        params: { id, ...updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user");
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<SimpleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "deleteUser",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete user");
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(id: number, isActive: boolean): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUserStatus",
        params: { id, isActive },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update user status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user status");
    }
  }

  /**
   * Change password
   */
  async changePassword(
    id: number,
    newPassword: string,
    confirmPassword: string,
    currentPassword?: string
  ): Promise<SimpleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "changePassword",
        params: { id, newPassword, confirmPassword, currentPassword },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to change password");
    } catch (error: any) {
      throw new Error(error.message || "Failed to change password");
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id: number, role: 'admin' | 'manager' | 'user'): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUserRole",
        params: { id, role },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update user role");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user role");
    }
  }

  // 🔐 Authentication methods

  /**
   * User login
   */
  async loginUser(
    username: string,
    password: string,
    email?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "loginUser",
        params: { username, password, email, ipAddress, userAgent },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Login failed");
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  }

  /**
   * User logout
   */
  async logoutUser(
    userId: number,
    token?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SimpleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "logoutUser",
        params: { userId, token, ipAddress, userAgent },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Logout failed");
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken?: string, userId?: number): Promise<UserResponse<{ token: string; expiresIn: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "refreshToken",
        params: { refreshToken, userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to refresh token");
    } catch (error: any) {
      throw new Error(error.message || "Failed to refresh token");
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    token: string,
    email: string,
    newPassword: string,
    confirmPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SimpleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "resetPassword",
        params: { token, email, newPassword, confirmPassword, ipAddress, userAgent },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to reset password");
    } catch (error: any) {
      throw new Error(error.message || "Failed to reset password");
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SimpleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "forgotPassword",
        params: { email, ipAddress, userAgent },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to process password reset request");
    } catch (error: any) {
      throw new Error(error.message || "Failed to process password reset request");
    }
  }

  // 📊 Activity methods

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: number,
    page: number = 1,
    limit: number = 100,
    action?: string,
    startDate?: string,
    endDate?: string,
    sortBy: string = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<UserActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserActivity",
        params: { userId, page, limit, action, startDate, endDate, sortBy, sortOrder },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user activity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user activity");
    }
  }

  /**
   * Clear user activity
   */
  async clearUserActivity(
    userId: number,
    olderThanDays?: number
  ): Promise<SimpleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "clearUserActivity",
        params: { userId, olderThanDays },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to clear user activity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to clear user activity");
    }
  }

  // 🔄 Batch operations

  /**
   * Bulk create users
   */
  async bulkCreateUsers(
    users: Array<{
      username: string;
      email: string;
      role?: 'admin' | 'manager' | 'user';
      isActive?: boolean;
      password?: string;
    }>,
    defaultPassword?: string
  ): Promise<UserBulkResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "bulkCreateUsers",
        params: { users, defaultPassword },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create users");
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    updates: Array<{
      id: number;
      username?: string;
      email?: string;
      role?: 'admin' | 'manager' | 'user';
      isActive?: boolean;
    }>
  ): Promise<UserBulkResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "bulkUpdateUsers",
        params: { updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update users");
    }
  }

  /**
   * Import users from CSV
   */
  async importUsersFromCSV(
    csvData?: string,
    csvFile?: string,
    hasHeaders: boolean = true
  ): Promise<UserBulkResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "importUsersFromCSV",
        params: { csvData, csvFile, hasHeaders },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import users from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import users from CSV");
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsersToCSV(
    includeInactive: boolean = false,
    roles: string[] = [],
    startDate?: string,
    endDate?: string,
    fields: string[] = ['id', 'username', 'email', 'role', 'isActive', 'createdAt', 'lastLogin']
  ): Promise<CSVExportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "exportUsersToCSV",
        params: { includeInactive, roles, startDate, endDate, fields },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export users to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export users to CSV");
    }
  }

  // 👥 Profile methods

  /**
   * Update profile
   */
  async updateProfile(
    userId: number,
    updates: {
      name?: string;
      email?: string;
      contact?: string;
      address?: string;
    }
  ): Promise<UserSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateProfile",
        params: { userId, ...updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update profile");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile");
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    userId: number,
    imageData?: string,
    imagePath?: string,
    mimeType?: string
  ): Promise<ProfilePictureResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "uploadProfilePicture",
        params: { userId, imageData, imagePath, mimeType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to upload profile picture");
    } catch (error: any) {
      throw new Error(error.message || "Failed to upload profile picture");
    }
  }

  // Utility methods

  /**
   * Validate user data before creating/updating
   */
  async validateUserData(userData: Partial<UserData>): Promise<ValidationResult> {
    try {
      // Basic validation
      if (userData.username && userData.username.length < 3) {
        return { valid: false, message: "Username must be at least 3 characters" };
      }

      if (userData.email && !this.validateEmail(userData.email)) {
        return { valid: false, message: "Invalid email format" };
      }

      if (userData.role && !['admin', 'manager', 'user'].includes(userData.role)) {
        return { valid: false, message: "Invalid role" };
      }

      return { valid: true };
    } catch (error) {
      console.error("Error validating user data:", error);
      return { valid: false, message: "Validation error" };
    }
  }

  /**
   * Get current user from localStorage or session
   */
  getCurrentUser(): UserData | null {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Save current user to localStorage
   */
  setCurrentUser(user: UserData): void {
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error("Error setting current user:", error);
    }
  }

  /**
   * Clear current user from localStorage
   */
  clearCurrentUser(): void {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    } catch (error) {
      console.error("Error clearing current user:", error);
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: 'admin' | 'manager' | 'user'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user is manager or admin
   */
  isManagerOrAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'manager';
  }

  /**
   * Format user for display
   */
  formatUserForDisplay(user: UserData): string {
    if (user.name) {
      return `${user.name} (${user.username})`;
    }
    return user.username;
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: UserData): string {
    if (user.name) {
      return user.name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  }

  /**
   * Get user status badge class
   */
  getUserStatusClass(user: UserData): string {
    if (!user.isActive) return 'badge-danger';
    if (user.role === 'admin') return 'badge-primary';
    if (user.role === 'manager') return 'badge-warning';
    return 'badge-success';
  }

  // Helper methods

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Event listeners
  onUserLogin(callback: (user: UserData) => void) {
    if (window.backendAPI && window.backendAPI.onUserLogin) {
      window.backendAPI.onUserLogin(callback);
    }
  }

  onUserLogout(callback: () => void) {
    if (window.backendAPI && window.backendAPI.onUserLogout) {
      window.backendAPI.onUserLogout(callback);
    }
  }

  onUserUpdated(callback: (user: UserData) => void) {
    if (window.backendAPI && window.backendAPI.onUserUpdated) {
      window.backendAPI.onUserUpdated(callback);
    }
  }

  onUserCreated(callback: (user: UserData) => void) {
    if (window.backendAPI && window.backendAPI.onUserCreated) {
      window.backendAPI.onUserCreated(callback);
    }
  }

  onUserDeleted(callback: (userId: number) => void) {
    if (window.backendAPI && window.backendAPI.onUserDeleted) {
      window.backendAPI.onUserDeleted(callback);
    }
  }
}

// Create singleton instance
const userAPI = new UserAPI();

export default userAPI;