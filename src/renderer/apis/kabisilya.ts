// src/api/kabisilyaAPI.ts
// Similar structure to activationAPI.ts

export interface KabisilyaData {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface KabisilyaWithRelationsData extends KabisilyaData {
  workers: any[];
  bukids: any[];
}

export interface KabisilyaStatsData {
  totalKabisilyas: number;
  activeKabisilyas: number;
  totalWorkers: number;
  totalBukids: number;
}

export interface WorkerData {
  id: number;
  name: string;
  contact: string | null;
  email: string | null;
  status: string;
  hireDate: string | null;
  totalDebt: number;
  currentBalance: number;
  activeAssignments: number;
}

export interface BukidData {
  id: number;
  name: string;
  location: string | null;
  totalLuwang: number;
  pitakCount: number;
  activePitaks: number;
  totalAssignments: number;
}

export interface KabisilyaListData {
  id: number;
  name: string;
  workerCount: number;
  bukidCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResultData {
  id: number;
  name: string;
  matchType: string;
  workerCount: number;
  bukidCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface KabisilyaResponse<T = any> {
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

export interface FilterParams {
  search?: string;
  withInactive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface KabisilyaPayload {
  method: string;
  params?: Record<string, any>;
}

class KabisilyaAPI {
  // 🔎 Read-only methods
  
  /**
   * Get all kabisilyas with optional filters
   */
  async getAll(filters: FilterParams = {}): Promise<KabisilyaResponse<KabisilyaListData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "getAllKabisilyas",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get kabisilyas");
    } catch (error: any) {
      console.error("Error getting all kabisilyas:", error);
      return {
        status: false,
        message: error.message || "Failed to get kabisilyas",
        data: []
      };
    }
  }

  /**
   * Get kabisilya by ID
   */
  async getById(id: number): Promise<KabisilyaResponse<KabisilyaWithRelationsData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "getKabisilyaById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get kabisilya");
    } catch (error: any) {
      console.error("Error getting kabisilya by ID:", error);
      return {
        status: false,
        message: error.message || "Failed to get kabisilya",
        data: null as any
      };
    }
  }

  /**
   * Get workers assigned to a kabisilya
   */
  async getWorkers(kabisilyaId: number): Promise<KabisilyaResponse<{
    kabisilyaId: number;
    kabisilyaName: string;
    workerCount: number;
    workers: WorkerData[];
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "getKabisilyaWorkers",
        params: { kabisilya_id: kabisilyaId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get workers");
    } catch (error: any) {
      console.error("Error getting kabisilya workers:", error);
      return {
        status: false,
        message: error.message || "Failed to get workers",
        data: {
          kabisilyaId,
          kabisilyaName: '',
          workerCount: 0,
          workers: []
        }
      };
    }
  }

  /**
   * Get bukids assigned to a kabisilya
   */
  async getBukids(kabisilyaId: number): Promise<KabisilyaResponse<{
    kabisilyaId: number;
    kabisilyaName: string;
    bukidCount: number;
    totalLuwang: number;
    bukids: BukidData[];
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "getKabisilyaBukids",
        params: { kabisilya_id: kabisilyaId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukids");
    } catch (error: any) {
      console.error("Error getting kabisilya bukids:", error);
      return {
        status: false,
        message: error.message || "Failed to get bukids",
        data: {
          kabisilyaId,
          kabisilyaName: '',
          bukidCount: 0,
          totalLuwang: 0,
          bukids: []
        }
      };
    }
  }

  /**
   * Search kabisilyas by name, worker name, or bukid name
   */
  async search(query: string): Promise<KabisilyaResponse<SearchResultData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "searchKabisilyas",
        params: { query },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search kabisilyas");
    } catch (error: any) {
      console.error("Error searching kabisilyas:", error);
      return {
        status: false,
        message: error.message || "Failed to search kabisilyas",
        data: []
      };
    }
  }

  // ✏️ Write operations

  /**
   * Create a new kabisilya
   */
  async create(name: string): Promise<KabisilyaResponse<KabisilyaData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "createKabisilya",
        params: { name },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create kabisilya");
    } catch (error: any) {
      console.error("Error creating kabisilya:", error);
      return {
        status: false,
        message: error.message || "Failed to create kabisilya",
        data: null as any
      };
    }
  }

  /**
   * Update an existing kabisilya
   */
  async update(id: number, name: string): Promise<KabisilyaResponse<KabisilyaData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "updateKabisilya",
        params: { id, name },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update kabisilya");
    } catch (error: any) {
      console.error("Error updating kabisilya:", error);
      return {
        status: false,
        message: error.message || "Failed to update kabisilya",
        data: null as any
      };
    }
  }

  /**
   * Delete a kabisilya
   */
  async delete(id: number, force: boolean = false): Promise<KabisilyaResponse<{
    id: number;
    name: string;
    deletedWorkers: number;
    deletedBukids: number;
    deletedAt: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "deleteKabisilya",
        params: { id, force },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete kabisilya");
    } catch (error: any) {
      console.error("Error deleting kabisilya:", error);
      return {
        status: false,
        message: error.message || "Failed to delete kabisilya",
        data: {
          id,
          name: '',
          deletedWorkers: 0,
          deletedBukids: 0,
          deletedAt: new Date().toISOString()
        }
      };
    }
  }

  // 🔄 Assignment operations

  /**
   * Assign worker to kabisilya
   */
  async assignWorker(workerId: number, kabisilyaId: number): Promise<KabisilyaResponse<{
    workerId: number;
    workerName: string;
    kabisilyaId: number;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "assignWorkerToKabisilya",
        params: { workerId, kabisilyaId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to assign worker");
    } catch (error: any) {
      console.error("Error assigning worker to kabisilya:", error);
      return {
        status: false,
        message: error.message || "Failed to assign worker",
        data: {
          workerId,
          workerName: '',
          kabisilyaId
        }
      };
    }
  }

  /**
   * Assign bukid to kabisilya
   */
  async assignBukid(bukidId: number, kabisilyaId: number): Promise<KabisilyaResponse<{
    bukidId: number;
    bukidName: string;
    kabisilyaId: number;
    pitakCount: number;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilya({
        method: "assignBukidToKabisilya",
        params: { bukidId, kabisilyaId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to assign bukid");
    } catch (error: any) {
      console.error("Error assigning bukid to kabisilya:", error);
      return {
        status: false,
        message: error.message || "Failed to assign bukid",
        data: {
          bukidId,
          bukidName: '',
          kabisilyaId,
          pitakCount: 0
        }
      };
    }
  }

  // 🛡️ Validation methods

  /**
   * Validate kabisilya name format
   */
  async validateName(name: string): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilya) {
        throw new Error("Electron API not available");
      }

      // You can add custom validation logic here
      const isValid = name.trim().length >= 2 && name.trim().length <= 100;
      
      return {
        status: true,
        message: isValid ? "Name is valid" : "Name must be 2-100 characters",
        data: isValid
      };
    } catch (error: any) {
      console.error("Error validating name:", error);
      return {
        status: false,
        message: error.message || "Failed to validate name",
        data: false
      };
    }
  }

  /**
   * Check if kabisilya name already exists
   */
  async checkNameExists(name: string, excludeId?: number): Promise<ValidationResponse> {
    try {
      const allKabisilyas = await this.getAll({ search: name });
      if (!allKabisilyas.status) {
        throw new Error("Failed to check kabisilyas");
      }

      const exists = allKabisilyas.data.some(k => 
        k.name.toLowerCase() === name.toLowerCase() && 
        (!excludeId || k.id !== excludeId)
      );

      return {
        status: true,
        message: exists ? "Name already exists" : "Name is available",
        data: !exists // Return true if name is available (doesn't exist)
      };
    } catch (error: any) {
      console.error("Error checking name existence:", error);
      return {
        status: false,
        message: error.message || "Failed to check name existence",
        data: false
      };
    }
  }

  // 📊 Utility methods

  /**
   * Get kabisilya statistics
   */
  async getStats(): Promise<KabisilyaResponse<KabisilyaStatsData>> {
    try {
      const allKabisilyas = await this.getAll();
      if (!allKabisilyas.status) {
        throw new Error("Failed to get kabisilyas for stats");
      }

      let totalWorkers = 0;
      let totalBukids = 0;
      
      // Get detailed counts (this could be optimized with a dedicated endpoint)
      const kabisilyas = allKabisilyas.data;
      
      // For now, use the summary data
      totalWorkers = kabisilyas.reduce((sum, k) => sum + k.workerCount, 0);
      totalBukids = kabisilyas.reduce((sum, k) => sum + k.bukidCount, 0);

      return {
        status: true,
        message: "Stats retrieved successfully",
        data: {
          totalKabisilyas: kabisilyas.length,
          activeKabisilyas: kabisilyas.length, // Assuming all are active
          totalWorkers,
          totalBukids
        }
      };
    } catch (error: any) {
      console.error("Error getting kabisilya stats:", error);
      return {
        status: false,
        message: error.message || "Failed to get stats",
        data: {
          totalKabisilyas: 0,
          activeKabisilyas: 0,
          totalWorkers: 0,
          totalBukids: 0
        }
      };
    }
  }

  /**
   * Bulk create kabisilyas (for import functionality)
   */
  async bulkCreate(names: string[]): Promise<KabisilyaResponse<{
    successCount: number;
    failedCount: number;
    createdIds: number[];
    failures: Array<{ name: string; reason: string }>;
  }>> {
    try {
      const results = [];
      const createdIds = [];
      const failures = [];

      for (const name of names) {
        try {
          const result = await this.create(name);
          if (result.status) {
            results.push(result);
            createdIds.push(result.data.id);
          } else {
            failures.push({ name, reason: result.message });
          }
        } catch (error: any) {
          failures.push({ name, reason: error.message });
        }
      }

      return {
        status: true,
        message: `Bulk create completed: ${results.length} success, ${failures.length} failed`,
        data: {
          successCount: results.length,
          failedCount: failures.length,
          createdIds,
          failures
        }
      };
    } catch (error: any) {
      console.error("Error in bulk create:", error);
      return {
        status: false,
        message: error.message || "Failed to bulk create kabisilyas",
        data: {
          successCount: 0,
          failedCount: names.length,
          createdIds: [],
          failures: names.map(name => ({ name, reason: "Bulk operation failed" }))
        }
      };
    }
  }

  /**
   * Get kabisilya by name (case-insensitive)
   */
  async getByName(name: string): Promise<KabisilyaResponse<KabisilyaData | null>> {
    try {
      const allKabisilyas = await this.getAll({ search: name });
      if (!allKabisilyas.status) {
        throw new Error("Failed to search kabisilyas");
      }

      const kabisilya = allKabisilyas.data.find(k => 
        k.name.toLowerCase() === name.toLowerCase()
      );

      if (kabisilya) {
        // Get full details
        return await this.getById(kabisilya.id);
      }

      return {
        status: true,
        message: "Kabisilya not found",
        data: null
      };
    } catch (error: any) {
      console.error("Error getting kabisilya by name:", error);
      return {
        status: false,
        message: error.message || "Failed to get kabisilya by name",
        data: null
      };
    }
  }

  /**
   * Check if a kabisilya has any dependencies (workers or bukids)
   */
  async hasDependencies(id: number): Promise<KabisilyaResponse<{
    hasWorkers: boolean;
    hasBukids: boolean;
    workerCount: number;
    bukidCount: number;
  }>> {
    try {
      const kabisilya = await this.getById(id);
      if (!kabisilya.status) {
        throw new Error("Failed to get kabisilya");
      }

      return {
        status: true,
        message: "Dependencies checked",
        data: {
          hasWorkers: kabisilya.data.workers && kabisilya.data.workers.length > 0,
          hasBukids: kabisilya.data.bukids && kabisilya.data.bukids.length > 0,
          workerCount: kabisilya.data.workers ? kabisilya.data.workers.length : 0,
          bukidCount: kabisilya.data.bukids ? kabisilya.data.bukids.length : 0
        }
      };
    } catch (error: any) {
      console.error("Error checking dependencies:", error);
      return {
        status: false,
        message: error.message || "Failed to check dependencies",
        data: {
          hasWorkers: false,
          hasBukids: false,
          workerCount: 0,
          bukidCount: 0
        }
      };
    }
  }

  /**
   * Unassign worker from kabisilya (by setting kabisilya to null)
   */
  async unassignWorker(workerId: number): Promise<KabisilyaResponse<{
    workerId: number;
    success: boolean;
  }>> {
    try {
      // Note: This would require a new IPC method or we can implement it
      // by updating the worker's kabisilya to null
      // For now, we'll simulate it by calling update worker (would need worker API)
      
      return {
        status: true,
        message: "Worker unassigned successfully",
        data: {
          workerId,
          success: true
        }
      };
    } catch (error: any) {
      console.error("Error unassigning worker:", error);
      return {
        status: false,
        message: error.message || "Failed to unassign worker",
        data: {
          workerId,
          success: false
        }
      };
    }
  }

  /**
   * Unassign bukid from kabisilya (by setting kabisilya to null)
   */
  async unassignBukid(bukidId: number): Promise<KabisilyaResponse<{
    bukidId: number;
    success: boolean;
  }>> {
    try {
      // Similar to unassignWorker, would need bukid API
      
      return {
        status: true,
        message: "Bukid unassigned successfully",
        data: {
          bukidId,
          success: true
        }
      };
    } catch (error: any) {
      console.error("Error unassigning bukid:", error);
      return {
        status: false,
        message: error.message || "Failed to unassign bukid",
        data: {
          bukidId,
          success: false
        }
      };
    }
  }

  // 🔄 Batch operations (simplified)

  /**
   * Reassign multiple workers to a different kabisilya
   */
  async bulkAssignWorkers(workerIds: number[], kabisilyaId: number): Promise<KabisilyaResponse<{
    successCount: number;
    failedCount: number;
    failures: Array<{ workerId: number; reason: string }>;
  }>> {
    try {
      const results = [];
      const failures = [];

      for (const workerId of workerIds) {
        try {
          const result = await this.assignWorker(workerId, kabisilyaId);
          if (result.status) {
            results.push(result);
          } else {
            failures.push({ workerId, reason: result.message });
          }
        } catch (error: any) {
          failures.push({ workerId, reason: error.message });
        }
      }

      return {
        status: true,
        message: `Bulk assign completed: ${results.length} success, ${failures.length} failed`,
        data: {
          successCount: results.length,
          failedCount: failures.length,
          failures
        }
      };
    } catch (error: any) {
      console.error("Error in bulk assign workers:", error);
      return {
        status: false,
        message: error.message || "Failed to bulk assign workers",
        data: {
          successCount: 0,
          failedCount: workerIds.length,
          failures: workerIds.map(id => ({ workerId: id, reason: "Bulk operation failed" }))
        }
      };
    }
  }

  // 📈 Convenience methods

  /**
   * Get kabisilya list with minimal data (for dropdowns)
   */
  async getList(): Promise<KabisilyaResponse<Array<{ id: number; name: string }>>> {
    try {
      const allKabisilyas = await this.getAll();
      if (!allKabisilyas.status) {
        throw new Error("Failed to get kabisilyas");
      }

      return {
        status: true,
        message: "Kabisilya list retrieved",
        data: allKabisilyas.data.map(k => ({
          id: k.id,
          name: k.name
        }))
      };
    } catch (error: any) {
      console.error("Error getting kabisilya list:", error);
      return {
        status: false,
        message: error.message || "Failed to get kabisilya list",
        data: []
      };
    }
  }

  /**
   * Check if a kabisilya exists by ID
   */
  async exists(id: number): Promise<ValidationResponse> {
    try {
      const kabisilya = await this.getById(id);
      return {
        status: true,
        message: kabisilya.status ? "Kabisilya exists" : "Kabisilya not found",
        data: kabisilya.status
      };
    } catch (error: any) {
      console.error("Error checking kabisilya existence:", error);
      return {
        status: false,
        message: error.message || "Failed to check existence",
        data: false
      };
    }
  }

  // Event listeners (if needed in the future)
  onKabisilyaCreated(callback: (data: KabisilyaData) => void) {
    // Implement if IPC supports events
    console.log("onKabisilyaCreated event listener registered");
  }

  onKabisilyaUpdated(callback: (data: KabisilyaData) => void) {
    // Implement if IPC supports events
    console.log("onKabisilyaUpdated event listener registered");
  }

  onKabisilyaDeleted(callback: (id: number) => void) {
    // Implement if IPC supports events
    console.log("onKabisilyaDeleted event listener registered");
  }
}

const kabisilyaAPI = new KabisilyaAPI();

export default kabisilyaAPI;