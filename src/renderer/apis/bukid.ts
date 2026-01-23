// bukidAPI.ts
export interface BukidData {
  id?: number;
  name: string;
  location?: string | null;
  kabisilyaId?: number | null;
  status?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BukidSummaryData {
  id: number;
  name: string;
  location: string | null;
  kabisilya: string | null;
  pitakCount: number;
  totalLuwang: number;
  assignmentCount: number;
  activeAssignments: number;
  createdAt: string;
  updatedAt: string;
}

export interface BukidStatsData {
  total: number;
  active: number;
  inactive: number;
  kabisilyaCount: number;
}

export interface PitakCountData {
  id: number;
  name: string;
  pitakCount: number;
  totalLuwang: number;
  averageLuwang: number;
}

export interface WorkerCountData {
  id: number;
  name: string;
  workerCount: number;
  assignmentCount: number;
}

export interface KabisilyaInfoData {
  kabisilya: any | null;
  workerCount: number;
  bukidCount: number;
}

export interface SearchResultData {
  bukids: BukidData[];
  query: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkOperationResult {
  successful: any[];
  failed: any[];
  total: number;
}

export interface CSVExportResult {
  filePath: string;
  filename: string;
  recordCount: number;
  downloadUrl: string;
}

export interface BukidResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface BukidPaginationResponse {
  bukids: BukidData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BukidFilters {
  kabisilyaId?: number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

class BukidAPI {
  // 📋 READ-ONLY METHODS

  async getAll(filters: BukidFilters = {}): Promise<BukidResponse<BukidPaginationResponse>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getAllBukid",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all bukid");
    }
  }

  async getById(id: number): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid by ID");
    }
  }

  async getByKabisilya(kabisilyaId: number, filters: BukidFilters = {}): Promise<BukidResponse<BukidPaginationResponse>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidByKabisilya",
        params: { kabisilyaId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid by kabisilya");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid by kabisilya");
    }
  }

  async getByName(name: string): Promise<BukidResponse<{ bukids: BukidData[] }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidByName",
        params: { name },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid by name");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid by name");
    }
  }

  async getByLocation(location: string): Promise<BukidResponse<{ bukids: BukidData[] }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidByLocation",
        params: { location },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid by location");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid by location");
    }
  }

  async getWithPitaks(id: number): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidWithPitaks",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid with pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid with pitaks");
    }
  }

  async getSummary(id: number): Promise<BukidResponse<{ summary: BukidSummaryData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidSummary",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid summary");
    }
  }

  async getActive(filters: BukidFilters = {}): Promise<BukidResponse<BukidPaginationResponse>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getActiveBukid",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get active bukid");
    }
  }

  async getStats(): Promise<BukidResponse<{ 
    summary: BukidStatsData;
    pitakDistribution: any[];
    recentBukid: BukidData[];
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getBukidStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get bukid stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get bukid stats");
    }
  }

  async search(query: string, filters: BukidFilters = {}): Promise<BukidResponse<SearchResultData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "searchBukid",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search bukid");
    }
  }

  // ✏️ WRITE OPERATIONS

  async create(bukidData: Omit<BukidData, 'id'>): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "createBukid",
        params: bukidData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create bukid");
    }
  }

  async update(id: number, bukidData: Partial<BukidData>): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "updateBukid",
        params: { id, ...bukidData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update bukid");
    }
  }

  async delete(id: number): Promise<BukidResponse<{ id: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "deleteBukid",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete bukid");
    }
  }

  async updateStatus(id: number, status: string): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "updateBukidStatus",
        params: { id, status },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update bukid status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update bukid status");
    }
  }

  async addNote(id: number, note: string): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "addBukidNote",
        params: { id, note },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add note");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add note");
    }
  }

  // 🔗 RELATIONSHIP OPERATIONS

  async assignToKabisilya(bukidId: number, kabisilyaId: number): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "assignToKabisilya",
        params: { bukidId, kabisilyaId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to assign bukid to kabisilya");
    } catch (error: any) {
      throw new Error(error.message || "Failed to assign bukid to kabisilya");
    }
  }

  async removeFromKabisilya(id: number): Promise<BukidResponse<{ bukid: BukidData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "removeFromKabisilya",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to remove bukid from kabisilya");
    } catch (error: any) {
      throw new Error(error.message || "Failed to remove bukid from kabisilya");
    }
  }

  async getKabisilyaInfo(id: number): Promise<BukidResponse<KabisilyaInfoData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getKabisilyaInfo",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get kabisilya info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get kabisilya info");
    }
  }

  // 📊 STATISTICS OPERATIONS

  async getPitakCounts(bukidId?: number): Promise<BukidResponse<{ pitakCounts: PitakCountData[] }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getPitakCounts",
        params: { bukidId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak counts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak counts");
    }
  }

  async getWorkerCounts(bukidId?: number): Promise<BukidResponse<{ workerCounts: WorkerCountData[] }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "getWorkerCounts",
        params: { bukidId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker counts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker counts");
    }
  }

  // 🔄 BATCH OPERATIONS

  async bulkCreate(bukids: Omit<BukidData, 'id'>[]): Promise<BukidResponse<{ results: BulkOperationResult }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "bulkCreateBukid",
        params: { bukids },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create bukid");
    }
  }

  async bulkUpdate(updates: Array<{ id: number } & Partial<BukidData>>): Promise<BukidResponse<{ results: BulkOperationResult }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "bulkUpdateBukid",
        params: { updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update bukid");
    }
  }

  async importFromCSV(filePath: string): Promise<BukidResponse<{ results: any }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "importBukidFromCSV",
        params: { filePath },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import bukid from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import bukid from CSV");
    }
  }

  async exportToCSV(filters: BukidFilters = {}): Promise<BukidResponse<CSVExportResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "exportBukidToCSV",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export bukid to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export bukid to CSV");
    }
  }

  // 🔍 SEARCH METHODS

  async searchByKeyword(keyword: string, limit: number = 20): Promise<BukidResponse<SearchResultData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.bukid) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.bukid({
        method: "searchBukid",
        params: { 
          query: keyword,
          filters: { limit }
        },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search bukid by keyword");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search bukid by keyword");
    }
  }

  // 🛠️ UTILITY METHODS

  async checkIfExists(name: string): Promise<boolean> {
    try {
      const response = await this.getByName(name);
      return response.data.bukids.length > 0;
    } catch (error) {
      console.error("Error checking if bukid exists:", error);
      return false;
    }
  }

  async getTotalCount(): Promise<number> {
    try {
      const response = await this.getStats();
      return response.data.summary.totalBukid;
    } catch (error) {
      console.error("Error getting total count:", error);
      return 0;
    }
  }

  async getActiveCount(): Promise<number> {
    try {
      const response = await this.getStats();
      return response.data.summary.activeBukid;
    } catch (error) {
      console.error("Error getting active count:", error);
      return 0;
    }
  }

  async getInactiveCount(): Promise<number> {
    try {
      const response = await this.getStats();
      return response.data.summary.inactiveBukid;
    } catch (error) {
      console.error("Error getting inactive count:", error);
      return 0;
    }
  }

  async getRecentBukid(limit: number = 10): Promise<BukidData[]> {
    try {
      const response = await this.getAll({ 
        limit, 
        sortBy: 'createdAt', 
        sortOrder: 'DESC' 
      });
      return response.data.bukids;
    } catch (error) {
      console.error("Error getting recent bukid:", error);
      return [];
    }
  }

  async validateBukidData(data: Partial<BukidData>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Bukid name is required');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Bukid name must be less than 100 characters');
    }

    if (data.location && data.location.length > 255) {
      errors.push('Location must be less than 255 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async createWithValidation(bukidData: Omit<BukidData, 'id'>): Promise<BukidResponse<{ bukid: BukidData }>> {
    const validation = await this.validateBukidData(bukidData);
    
    if (!validation.isValid) {
      return {
        status: false,
        message: validation.errors.join(', '),
        data: { bukid: {} as BukidData }
      };
    }

    return await this.create(bukidData);
  }

  async updateWithValidation(id: number, bukidData: Partial<BukidData>): Promise<BukidResponse<{ bukid: BukidData }>> {
    const validation = await this.validateBukidData(bukidData);
    
    if (!validation.isValid) {
      return {
        status: false,
        message: validation.errors.join(', '),
        data: { bukid: {} as BukidData }
      };
    }

    return await this.update(id, bukidData);
  }

  async getPaginatedList(page: number = 1, limit: number = 20, filters: Partial<BukidFilters> = {}): Promise<BukidPaginationResponse> {
    try {
      const response = await this.getAll({
        page,
        limit,
        ...filters
      });
      
      return response.data;
    } catch (error) {
      console.error("Error getting paginated list:", error);
      return {
        bukids: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  async getBukidNames(): Promise<{ id: number; name: string }[]> {
    try {
      const response = await this.getAll({ limit: 1000 });
      return response.data.bukids.map(b => ({
        id: b.id!,
        name: b.name
      }));
    } catch (error) {
      console.error("Error getting bukid names:", error);
      return [];
    }
  }

  async getBukidOptions(): Promise<{ value: number; label: string; location?: string }[]> {
    try {
      const response = await this.getAll({ limit: 1000 });
      return response.data.bukids.map(b => ({
        value: b.id!,
        label: b.name,
        location: b.location || undefined
      }));
    } catch (error) {
      console.error("Error getting bukid options:", error);
      return [];
    }
  }

  async getBukidByIdWithFallback(id?: number): Promise<BukidData | null> {
    if (!id) return null;
    
    try {
      const response = await this.getById(id);
      return response.data.bukid;
    } catch (error) {
      console.error(`Error getting bukid ${id}:`, error);
      return null;
    }
  }

  async batchUpdateStatus(ids: number[], status: string): Promise<BulkOperationResult> {
    try {
      const updates = ids.map(id => ({ id, status }));
      const response = await this.bulkUpdate(updates);
      return response.data.results;
    } catch (error) {
      console.error("Error batch updating status:", error);
      return {
        successful: [],
        failed: ids.map(id => ({ id, error: error.message })),
        total: ids.length
      };
    }
  }

  // 🔄 CACHE MANAGEMENT

  private bukidCache = new Map<number, BukidData>();
  private cacheTimestamp = new Map<number, number>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getWithCache(id: number): Promise<BukidData | null> {
    const now = Date.now();
    const cached = this.bukidCache.get(id);
    const timestamp = this.cacheTimestamp.get(id);

    if (cached && timestamp && (now - timestamp) < this.CACHE_TTL) {
      return cached;
    }

    try {
      const response = await this.getById(id);
      const bukid = response.data.bukid;
      
      this.bukidCache.set(id, bukid);
      this.cacheTimestamp.set(id, now);
      
      return bukid;
    } catch (error) {
      console.error("Error getting bukid with cache:", error);
      return null;
    }
  }

  invalidateCache(id?: number): void {
    if (id) {
      this.bukidCache.delete(id);
      this.cacheTimestamp.delete(id);
    } else {
      this.bukidCache.clear();
      this.cacheTimestamp.clear();
    }
  }

  // 📊 ANALYTICS METHODS

  async getBukidAnalytics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byKabisilya: Record<number, number>;
    byLocation: Record<string, number>;
    recentGrowth: { date: string; count: number }[];
  }> {
    try {
      // Get all bukid for analytics
      const allResponse = await this.getAll({ limit: 1000 });
      const statsResponse = await this.getStats();
      
      const bukids = allResponse.data.bukids;
      
      // Group by kabisilya
      const byKabisilya: Record<number, number> = {};
      bukids.forEach(b => {
        const kabId = b.kabisilyaId;
        if (kabId) {
          byKabisilya[kabId] = (byKabisilya[kabId] || 0) + 1;
        }
      });
      
      // Group by location
      const byLocation: Record<string, number> = {};
      bukids.forEach(b => {
        const loc = b.location || 'Unknown';
        byLocation[loc] = (byLocation[loc] || 0) + 1;
      });
      
      // Calculate recent growth (last 30 days)
      const recentGrowth = this.calculateRecentGrowth(bukids);
      
      return {
        total: statsResponse.data.summary.totalBukid,
        active: statsResponse.data.summary.activeBukid,
        inactive: statsResponse.data.summary.inactiveBukid,
        byKabisilya,
        byLocation,
        recentGrowth
      };
    } catch (error) {
      console.error("Error getting bukid analytics:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byKabisilya: {},
        byLocation: {},
        recentGrowth: []
      };
    }
  }

  private calculateRecentGrowth(bukids: BukidData[]): { date: string; count: number }[] {
    const growth: { date: string; count: number }[] = [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    last30Days.forEach(date => {
      const count = bukids.filter(b => {
        const createdDate = b.createdAt?.split('T')[0];
        return createdDate && createdDate <= date;
      }).length;
      
      growth.push({ date, count });
    });
    
    return growth;
  }

  // 🎯 EVENT LISTENERS (if supported by IPC)

  onBukidCreated(callback: (bukid: BukidData) => void) {
    if (window.backendAPI && window.backendAPI.onBukidCreated) {
      window.backendAPI.onBukidCreated(callback);
    }
  }

  onBukidUpdated(callback: (bukid: BukidData) => void) {
    if (window.backendAPI && window.backendAPI.onBukidUpdated) {
      window.backendAPI.onBukidUpdated(callback);
    }
  }

  onBukidDeleted(callback: (id: number) => void) {
    if (window.backendAPI && window.backendAPI.onBukidDeleted) {
      window.backendAPI.onBukidDeleted(callback);
    }
  }

  // 📱 REACT HOOKS READY

  async useBukid(id: number): Promise<{
    data: BukidData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  }> {
    let data: BukidData | null = null;
    let loading = true;
    let error: string | null = null;

    const refetch = async () => {
      loading = true;
      try {
        const response = await this.getById(id);
        data = response.data.bukid;
        error = null;
      } catch (err: any) {
        error = err.message;
        data = null;
      } finally {
        loading = false;
      }
    };

    await refetch();

    return { data, loading, error, refetch };
  }

  async useBukidList(filters: BukidFilters = {}): Promise<{
    data: BukidData[];
    pagination: BukidPaginationResponse['pagination'];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  }> {
    let data: BukidData[] = [];
    let pagination: BukidPaginationResponse['pagination'] = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    };
    let loading = true;
    let error: string | null = null;

    const refetch = async () => {
      loading = true;
      try {
        const response = await this.getAll(filters);
        data = response.data.bukids;
        pagination = response.data.pagination;
        error = null;
      } catch (err: any) {
        error = err.message;
        data = [];
      } finally {
        loading = false;
      }
    };

    await refetch();

    return { data, pagination, loading, error, refetch };
  }
}

const bukidAPI = new BukidAPI();

export default bukidAPI;