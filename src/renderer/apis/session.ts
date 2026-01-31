// src/api/sessionAPI.ts
// Similar structure to kabisilyaAPI.ts

import { kabAuthStore } from "../lib/kabAuthStore";

export interface SessionData {
  id: number;
  name: string;
  seasonType: string | null;
  year: number;
  startDate: string;
  endDate: string | null;
  status: "active" | "closed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface SessionWithRelationsData extends SessionData {
  bukids: BukidData[];
  assignments: AssignmentData[];
  payments: PaymentData[];
  debts: DebtData[];
}

export interface BukidData {
  id: number;
  name: string;
  status: string;
  location: string | null;
  pitaks: PitakData[];
  createdAt: string;
  updatedAt: string;
}

export interface PitakData {
  id: number;
  location: string | null;
  totalLuwang: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentData {
  id: number;
  luwangCount: number;
  assignmentDate: string;
  status: string;
  notes: string | null;
  worker: WorkerData;
  pitak: PitakData;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerData {
  id: number;
  name: string;
  contact: string | null;
  email: string | null;
  status: string;
  hireDate: string | null;
}

export interface PaymentData {
  id: number;
  grossPay: number;
  netPay: number;
  status: string;
  paymentDate: string | null;
  worker: WorkerData;
  createdAt: string;
  updatedAt: string;
}

export interface DebtData {
  id: number;
  amount: number;
  reason: string | null;
  balance: number;
  status: string;
  dateIncurred: string;
  worker: WorkerData;
  createdAt: string;
  updatedAt: string;
}

export interface SessionStatsData {
  totalSessions: number;
  activeSessions: number;
  closedSessions: number;
  archivedSessions: number;
  totalBukids: number;
  totalAssignments: number;
  totalPayments: number;
  totalDebts: number;
}

export interface SessionListData {
  id: number;
  name: string;
  year: number;
  seasonType: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  bukidCount: number;
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateSessionData {
  sessionId: number;
  newName: string;
  newYear?: number;
}

export interface FilterParams {
  status?: "active" | "closed" | "archived";
  year?: number;
  search?: string;
  includeBukids?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface SessionResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: {
    successCount: number;
    failedCount: number;
    failures: Array<{
      id: number;
      reason: string;
    }>;
  };
}

class SessionAPI {
  // Helper method to get current user ID from localStorage
  private getCurrentUserId(): number | null {
    try {
      const user = kabAuthStore.getUser();
      if (user && user.id) {
        const userId = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
        return isNaN(userId) ? null : userId;
      }
      return null;
    } catch (error) {
      console.error("Error getting current user ID:", error);
      return null;
    }
  }

  // Helper method to enrich params with currentUserId
  private enrichParams(params: any = {}): any {
    const userId = this.getCurrentUserId();
    return { ...params, userId: userId !== null ? userId : 0 };
  }

  // 🔎 Read-only methods

  /**
   * Get all sessions with optional filters
   */
  async getAll(filters: FilterParams = {}): Promise<SessionResponse<SessionListData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "getAllSessions",
        params: this.enrichParams({ filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sessions");
    } catch (error: any) {
      console.error("Error getting all sessions:", error);
      return {
        status: false,
        message: error.message || "Failed to get sessions",
        data: [],
      };
    }
  }

  /**
   * Get session by ID
   */
  async getById(id: number): Promise<SessionResponse<SessionWithRelationsData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "getSessionById",
        params: this.enrichParams({ id }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get session");
    } catch (error: any) {
      console.error("Error getting session by ID:", error);
      return {
        status: false,
        message: error.message || "Failed to get session",
        data: null as any,
      };
    }
  }

  /**
   * Get only active sessions
   */
  async getActive(includeBukids = false): Promise<SessionResponse<SessionListData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "getActiveSessions",
        params: this.enrichParams({ includeBukids }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active sessions");
    } catch (error: any) {
      console.error("Error getting active sessions:", error);
      return {
        status: false,
        message: error.message || "Failed to get active sessions",
        data: [],
      };
    }
  }

  // ✏️ Write operations

  /**
   * Create a new session
   */
  async create(
    name: string,
    year: number,
    startDate: Date | string,
    seasonType?: string,
    endDate?: Date | string,
    status: "active" | "closed" | "archived" = "active"
  ): Promise<SessionResponse<SessionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "createSession",
        params: this.enrichParams({
          name,
          seasonType,
          year,
          startDate: typeof startDate === "string" ? startDate : startDate.toISOString(),
          endDate: endDate ? (typeof endDate === "string" ? endDate : endDate.toISOString()) : null,
          status,
        }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create session");
    } catch (error: any) {
      console.error("Error creating session:", error);
      return {
        status: false,
        message: error.message || "Failed to create session",
        data: null as any,
      };
    }
  }

  /**
   * Update an existing session
   */
  async update(
    id: number,
    updates: Partial<{
      name: string;
      seasonType: string | null;
      year: number;
      startDate: Date | string;
      endDate: Date | string | null;
      status: "active" | "closed" | "archived";
    }>
  ): Promise<SessionResponse<SessionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      // Prepare update data
      const updateData: any = { id };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.seasonType !== undefined) updateData.seasonType = updates.seasonType;
      if (updates.year !== undefined) updateData.year = updates.year;
      if (updates.startDate !== undefined) {
        updateData.startDate = typeof updates.startDate === "string" 
          ? updates.startDate 
          : updates.startDate.toISOString();
      }
      if (updates.endDate !== undefined) {
        updateData.endDate = updates.endDate === null 
          ? null 
          : (typeof updates.endDate === "string" 
            ? updates.endDate 
            : updates.endDate.toISOString());
      }
      if (updates.status !== undefined) updateData.status = updates.status;

      const response = await window.backendAPI.session({
        method: "updateSession",
        params: this.enrichParams(updateData),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update session");
    } catch (error: any) {
      console.error("Error updating session:", error);
      return {
        status: false,
        message: error.message || "Failed to update session",
        data: null as any,
      };
    }
  }

  /**
   * Delete a session
   */
  async delete(
    id: number,
    force = false
  ): Promise<SessionResponse<{ id: number; name: string; bukidsDeleted: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "deleteSession",
        params: this.enrichParams({ id, force }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete session");
    } catch (error: any) {
      console.error("Error deleting session:", error);
      return {
        status: false,
        message: error.message || "Failed to delete session",
        data: { id, name: "", bukidsDeleted: 0 },
      };
    }
  }

  /**
   * Duplicate a session with bukids and pitaks
   */
  async duplicate(
    sessionId: number,
    newName: string,
    newYear?: number
  ): Promise<SessionResponse<SessionWithRelationsData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "duplicateSession",
        params: this.enrichParams({ sessionId, newName, newYear }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to duplicate session");
    } catch (error: any) {
      console.error("Error duplicating session:", error);
      return {
        status: false,
        message: error.message || "Failed to duplicate session",
        data: null as any,
      };
    }
  }

  /**
   * Close a session (set status to 'closed')
   */
  async close(id: number): Promise<SessionResponse<SessionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "closeSession",
        params: this.enrichParams({ id }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to close session");
    } catch (error: any) {
      console.error("Error closing session:", error);
      return {
        status: false,
        message: error.message || "Failed to close session",
        data: null as any,
      };
    }
  }

  /**
   * Archive a session (set status to 'archived')
   */
  async archive(id: number): Promise<SessionResponse<SessionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.session) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.session({
        method: "archiveSession",
        params: this.enrichParams({ id }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to archive session");
    } catch (error: any) {
      console.error("Error archiving session:", error);
      return {
        status: false,
        message: error.message || "Failed to archive session",
        data: null as any,
      };
    }
  }

  // 🛡️ Validation methods

  /**
   * Validate session name format
   */
  async validateName(name: string): Promise<ValidationResponse> {
    try {
      const isValid = name.trim().length >= 2 && name.trim().length <= 100;

      return {
        status: true,
        message: isValid ? "Name is valid" : "Name must be 2-100 characters",
        data: isValid,
      };
    } catch (error: any) {
      console.error("Error validating name:", error);
      return {
        status: false,
        message: error.message || "Failed to validate name",
        data: false,
      };
    }
  }

  /**
   * Check if session name already exists for a year
   */
  async checkNameExists(
    name: string,
    year: number,
    excludeId?: number
  ): Promise<ValidationResponse> {
    try {
      const allSessions = await this.getAll({ search: name, year });
      if (!allSessions.status) {
        throw new Error("Failed to check sessions");
      }

      const exists = allSessions.data.some(
        (s) =>
          s.name.toLowerCase() === name.toLowerCase() &&
          s.year === year &&
          (!excludeId || s.id !== excludeId)
      );

      return {
        status: true,
        message: exists ? "Session with this name and year already exists" : "Name is available",
        data: !exists, // Return true if name is available (doesn't exist)
      };
    } catch (error: any) {
      console.error("Error checking name existence:", error);
      return {
        status: false,
        message: error.message || "Failed to check name existence",
        data: false,
      };
    }
  }

  // 📊 Utility methods

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionResponse<SessionStatsData>> {
    try {
      const allSessions = await this.getAll();
      if (!allSessions.status) {
        throw new Error("Failed to get sessions for stats");
      }

      const sessions = allSessions.data;
      
      const activeSessions = sessions.filter(s => s.status === "active").length;
      const closedSessions = sessions.filter(s => s.status === "closed").length;
      const archivedSessions = sessions.filter(s => s.status === "archived").length;

      // For more detailed stats, we might need to fetch additional data
      // For now, we'll use summary data
      let totalBukids = 0;
      let totalAssignments = 0;
      
      for (const session of sessions) {
        totalBukids += session.bukidCount || 0;
        totalAssignments += session.assignmentCount || 0;
      }

      return {
        status: true,
        message: "Stats retrieved successfully",
        data: {
          totalSessions: sessions.length,
          activeSessions,
          closedSessions,
          archivedSessions,
          totalBukids,
          totalAssignments,
          totalPayments: 0, // Would need payment API
          totalDebts: 0, // Would need debt API
        },
      };
    } catch (error: any) {
      console.error("Error getting session stats:", error);
      return {
        status: false,
        message: error.message || "Failed to get stats",
        data: {
          totalSessions: 0,
          activeSessions: 0,
          closedSessions: 0,
          archivedSessions: 0,
          totalBukids: 0,
          totalAssignments: 0,
          totalPayments: 0,
          totalDebts: 0,
        },
      };
    }
  }

  /**
   * Get sessions by year
   */
  async getByYear(year: number, includeBukids = false): Promise<SessionResponse<SessionListData[]>> {
    try {
      const allSessions = await this.getAll({ year, includeBukids });
      return {
        status: true,
        message: "Sessions retrieved by year",
        data: allSessions.data.filter(s => s.year === year),
      };
    } catch (error: any) {
      console.error("Error getting sessions by year:", error);
      return {
        status: false,
        message: error.message || "Failed to get sessions by year",
        data: [],
      };
    }
  }

  /**
   * Get session list for dropdowns
   */
  async getList(
    status?: "active" | "closed" | "archived"
  ): Promise<SessionResponse<Array<{ id: number; name: string; year: number }>>> {
    try {
      const filters: FilterParams = {};
      if (status) filters.status = status;
      
      const allSessions = await this.getAll(filters);
      if (!allSessions.status) {
        throw new Error("Failed to get sessions");
      }

      return {
        status: true,
        message: "Session list retrieved",
        data: allSessions.data.map(s => ({
          id: s.id,
          name: s.name,
          year: s.year,
        })),
      };
    } catch (error: any) {
      console.error("Error getting session list:", error);
      return {
        status: false,
        message: error.message || "Failed to get session list",
        data: [],
      };
    }
  }

  /**
   * Check if a session exists by ID
   */
  async exists(id: number): Promise<ValidationResponse> {
    try {
      const session = await this.getById(id);
      return {
        status: true,
        message: session.status ? "Session exists" : "Session not found",
        data: session.status,
      };
    } catch (error: any) {
      console.error("Error checking session existence:", error);
      return {
        status: false,
        message: error.message || "Failed to check existence",
        data: false,
      };
    }
  }

  /**
   * Check if a session can be modified (not archived)
   */
  async canModify(id: number): Promise<ValidationResponse> {
    try {
      const session = await this.getById(id);
      if (!session.status) {
        return {
          status: false,
          message: "Session not found",
          data: false,
        };
      }

      const canModify = session.data.status !== "archived";
      return {
        status: true,
        message: canModify ? "Session can be modified" : "Session is archived and cannot be modified",
        data: canModify,
      };
    } catch (error: any) {
      console.error("Error checking if session can be modified:", error);
      return {
        status: false,
        message: error.message || "Failed to check modification status",
        data: false,
      };
    }
  }

  /**
   * Get current active session (most recent active session)
   */
  async getCurrentActive(): Promise<SessionResponse<SessionData | null>> {
    try {
      const activeSessions = await this.getActive();
      if (!activeSessions.status || activeSessions.data.length === 0) {
        return {
          status: true,
          message: "No active sessions",
          data: null,
        };
      }

      // Get the most recent active session (by start date)
      const sortedSessions = activeSessions.data.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      // Get full details of the most recent session
      return await this.getById(sortedSessions[0].id);
    } catch (error: any) {
      console.error("Error getting current active session:", error);
      return {
        status: false,
        message: error.message || "Failed to get current active session",
        data: null,
      };
    }
  }

  // 🔄 Batch operations

  /**
   * Bulk create sessions
   */
  async bulkCreate(
    sessions: Array<{
      name: string;
      year: number;
      startDate: string;
      seasonType?: string;
    }>
  ): Promise<SessionResponse<{
    successCount: number;
    failedCount: number;
    createdIds: number[];
    failures: Array<{ name: string; reason: string }>;
  }>> {
    try {
      const results = [];
      const createdIds = [];
      const failures = [];

      for (const session of sessions) {
        try {
          const result = await this.create(
            session.name,
            session.year,
            session.startDate,
            session.seasonType
          );
          if (result.status) {
            results.push(result);
            createdIds.push(result.data.id);
          } else {
            failures.push({ name: session.name, reason: result.message });
          }
        } catch (error: any) {
          failures.push({ name: session.name, reason: error.message });
        }
      }

      return {
        status: true,
        message: `Bulk create completed: ${results.length} success, ${failures.length} failed`,
        data: {
          successCount: results.length,
          failedCount: failures.length,
          createdIds,
          failures,
        },
      };
    } catch (error: any) {
      console.error("Error in bulk create:", error);
      return {
        status: false,
        message: error.message || "Failed to bulk create sessions",
        data: {
          successCount: 0,
          failedCount: sessions.length,
          createdIds: [],
          failures: sessions.map(session => ({ name: session.name, reason: "Bulk operation failed" })),
        },
      };
    }
  }

  /**
   * Activate a closed session (change status from closed to active)
   */
  async activate(id: number): Promise<SessionResponse<SessionData>> {
    try {
      return await this.update(id, { status: "active" });
    } catch (error: any) {
      console.error("Error activating session:", error);
      return {
        status: false,
        message: error.message || "Failed to activate session",
        data: null as any,
      };
    }
  }

  /**
   * Get seasons by type (tag-ulan or tag-araw)
   */
  async getBySeasonType(seasonType: "tag-ulan" | "tag-araw"): Promise<SessionResponse<SessionListData[]>> {
    try {
      const allSessions = await this.getAll();
      if (!allSessions.status) {
        throw new Error("Failed to get sessions");
      }

      const filtered = allSessions.data.filter(
        s => s.seasonType?.toLowerCase() === seasonType.toLowerCase()
      );

      return {
        status: true,
        message: `${seasonType} sessions retrieved`,
        data: filtered,
      };
    } catch (error: any) {
      console.error("Error getting sessions by season type:", error);
      return {
        status: false,
        message: error.message || "Failed to get sessions by season type",
        data: [],
      };
    }
  }

  // 📈 Convenience methods

  /**
   * Get session summary (for dashboard)
   */
  async getSummary(): Promise<SessionResponse<{
    active: SessionListData[];
    recent: SessionListData[];
    upcoming: SessionListData[];
    stats: {
      activeCount: number;
      totalBukids: number;
      totalAssignments: number;
    };
  }>> {
    try {
      const activeSessions = await this.getActive(true);
      const allSessions = await this.getAll({ sortBy: "startDate", sortOrder: "DESC", limit: 10 });

      if (!activeSessions.status || !allSessions.status) {
        throw new Error("Failed to get session data");
      }

      const now = new Date();
      const upcomingSessions = allSessions.data.filter(
        s => new Date(s.startDate) > now && s.status === "active"
      );

      // Calculate stats
      let totalBukids = 0;
      let totalAssignments = 0;

      for (const session of activeSessions.data) {
        totalBukids += session.bukidCount || 0;
        totalAssignments += session.assignmentCount || 0;
      }

      return {
        status: true,
        message: "Session summary retrieved",
        data: {
          active: activeSessions.data,
          recent: allSessions.data.slice(0, 5),
          upcoming: upcomingSessions.slice(0, 3),
          stats: {
            activeCount: activeSessions.data.length,
            totalBukids,
            totalAssignments,
          },
        },
      };
    } catch (error: any) {
      console.error("Error getting session summary:", error);
      return {
        status: false,
        message: error.message || "Failed to get session summary",
        data: {
          active: [],
          recent: [],
          upcoming: [],
          stats: {
            activeCount: 0,
            totalBukids: 0,
            totalAssignments: 0,
          },
        },
      };
    }
  }
}

const sessionAPI = new SessionAPI();

export default sessionAPI;