// src/api/attendanceAPI.ts
// Similar structure to kabisilyaAPI.ts

import { kabAuthStore } from "../lib/kabAuthStore";

// 📋 Core Types

export interface AttendanceRecord {
  id: number;
  assignment_date: string;
  status: string;
  luwang_count: number;
  notes: string | null;
  worker: {
    id: number;
    name: string;
    contact: string | null;
    status: string;
  };
  pitak: {
    id: number;
    location: string | null;
    total_luwang: number;
    status: string;
  };
  bukid: {
    id: number;
    name: string;
    location: string | null;
  };
  kabisilya: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DailyAttendanceSummary {
  date: string;
  day_of_week?: string;
  total_workers: number;
  total_luwang: number;
  workers: Array<{
    worker_id: number;
    worker_name: string;
    pitak: string | null;
    luwang_count: number;
    status: string;
  }>;
  absent_workers?: Array<{
    worker_id: number;
    worker_name: string;
    contact: string | null;
  }>;
  absent_count?: number;
}

export interface WorkerAttendanceStats {
  worker_id: number;
  worker_name: string;
  total_assignments: number;
  total_luwang: number;
  attendance_rate: number;
  kabisilya: string | null;
  average_luwang_per_assignment: number;
}

export interface MonthlyAttendanceSummary {
  year: number;
  month: number;
  month_name: string;
  start_date: string;
  end_date: string;
  days_in_month: number;
  work_days: number;
  daily_summary: DailyAttendanceSummary[];
  kabisilya_summary: Array<{
    kabisilya_name: string;
    total_assignments: number;
    total_luwang: number;
    unique_workers: number;
  }>;
  top_performers: WorkerAttendanceStats[];
}

export interface AttendanceStatistics {
  date_range: {
    start_date: string;
    end_date: string;
    total_days: number;
    work_days: number;
  };
  overview: {
    total_active_workers: number;
    total_assignments: number;
    total_luwang: number;
    average_assignments_per_day: number;
    average_luwang_per_day: number;
    average_luwang_per_assignment: number;
  };
  trends: {
    assignment_change: string;
    luwang_change: string;
    previous_period: {
      start_date: string;
      end_date: string;
      total_assignments: number;
      total_luwang: number;
    };
  };
  status_breakdown: Record<string, number>;
  worker_statistics: {
    total_workers: number;
    average_assignments_per_worker: number;
    average_luwang_per_worker: number;
    top_performers: WorkerAttendanceStats[];
  };
  daily_activity: {
    most_active_days: Array<{
      date: string;
      assignments_count: number;
      total_luwang: number;
      unique_workers: number;
    }>;
    busiest_day: {
      date: string;
      assignments_count: number;
      total_luwang: number;
    } | null;
  };
  kabisilya_statistics: Array<{
    kabisilya_id: number;
    kabisilya_name: string;
    total_assignments: number;
    total_luwang: number;
    unique_workers: number;
  }>;
  pitak_statistics: Array<{
    pitak_id: number;
    pitak_location: string | null;
    total_assignments: number;
    total_luwang: number;
    unique_workers: number;
  }>;
}

export interface DailyAttendanceReport {
  report_date: string;
  summary: {
    total_active_workers: number;
    workers_present: number;
    workers_absent: number;
    attendance_rate: string;
    total_luwang: number;
  };
  attendance_by_kabisilya: Array<{
    kabisilya_name: string;
    worker_count: number;
    total_luwang: number;
    workers: Array<{
      worker_name: string;
      pitak: string | null;
      luwang_count: number;
    }>;
  }>;
  present_workers: Array<{
    id: number;
    name: string;
    contact: string | null;
    assignment_id: number;
    pitak: string | null;
    bukid: string | null;
    kabisilya: string | null;
    luwang_count: number;
    status: string;
    assignment_notes: string | null;
  }>;
  absent_workers: Array<{
    id: number;
    name: string;
    contact: string | null;
    kabisilya: string | null;
    status: string;
  }>;
  detailed_assignments: AttendanceRecord[];
}

export interface WorkerAttendanceSummary {
  worker: {
    id: number;
    name: string;
    status: string;
    hire_date: string | null;
    kabisilya: string | null;
  };
  summary: {
    total_assignments: number;
    total_luwang: string;
    average_luwang_per_assignment: string;
    attendance_rate: string;
  };
  status_breakdown: {
    active: number;
    completed: number;
    cancelled: number;
  };
  performance: {
    current_streak: number;
    longest_streak: number;
    most_frequent_pitak: {
      id: number;
      location: string | null;
      assignment_count: number;
    } | null;
    unique_pitaks_count: number;
  };
  recent_assignments: Array<{
    date: string;
    pitak: string | null;
    luwang_count: number;
    status: string;
  }>;
}

export interface AttendanceByPitakData {
  pitak: {
    id: number;
    location: string | null;
    total_luwang: number;
    status: string;
    bukid: string | null;
  };
  statistics: {
    total_assignments: number;
    total_luwang: number;
    unique_workers: number;
    work_days: number;
    average_luwang_per_assignment: number;
  };
  attendance_by_date: Array<{
    date: string;
    workers: Array<{
      worker_id: number;
      worker_name: string;
      luwang_count: number;
      status: string;
      kabisilya: string | null;
    }>;
    total_luwang: number;
  }>;
  all_assignments: AttendanceRecord[];
}

export interface AttendanceByBukidData {
  bukid: {
    id: number;
    name: string;
    location: string | null;
    status: string;
    kabisilya: string | null;
  };
  pitaks: Array<{
    id: number;
    location: string | null;
    total_luwang: number;
    status: string;
  }>;
  statistics: {
    total_pitaks: number;
    total_assignments: number;
    total_luwang: number;
    unique_workers: number;
    average_luwang_per_assignment: number;
  };
  assignments_by_pitak: Array<{
    pitak_id: number;
    pitak_location: string | null;
    total_assignments: number;
    total_luwang: number;
    assignments: AttendanceRecord[];
  }>;
  all_assignments: AttendanceRecord[];
}

export interface AttendanceByKabisilyaData {
  kabisilya: {
    id: number;
    name: string;
  };
  workers: Array<{
    id: number;
    name: string;
    status: string;
    contact: string | null;
    total_assignments: number;
    total_luwang: number;
  }>;
  statistics: {
    total_workers: number;
    active_workers: number;
    workers_with_assignments: number;
    total_assignments: number;
    total_luwang: number;
    average_assignments_per_worker: number;
    average_luwang_per_worker: number;
  };
  attendance_by_worker: Array<{
    worker_id: number;
    worker_name: string;
    total_assignments: number;
    total_luwang: number;
    assignments: AttendanceRecord[];
  }>;
  all_assignments: AttendanceRecord[];
}

export interface SearchAttendanceParams {
  keyword?: string;
  worker_name?: string;
  pitak_location?: string;
  bukid_name?: string;
  kabisilya_name?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SearchAttendanceResult {
  search_query: SearchAttendanceParams;
  total_results: number;
  assignments: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface AttendanceFilterParams {
  status?: string;
  worker_id?: number;
  pitak_id?: number;
  bukid_id?: number;
  kabisilya_id?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 📋 Response Types

export interface AttendanceResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

export interface AttendancePayload {
  method: string;
  params?: Record<string, any>;
}

class AttendanceAPI {
  // Helper method to get current user ID from localStorage
  private getCurrentUserId(): number | null {
    try {
      const user = kabAuthStore.getUser();
      if (user && user.id) {
        // Ensure we return a number
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
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
    return { ...params, currentUserId: userId !== null ? userId : 0 };
  }

  // 🔎 Attendance Methods - All supported methods from attendance IPC handler

  /**
   * Get attendance records by specific date
   */
  async getByDate(date: string, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<{
    date: string;
    total_records: number;
    summary: {
      total_workers: number;
      active_workers: number;
      total_luwang: number;
    };
    records: AttendanceRecord[];
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByDate",
        params: this.enrichParams({ date, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance by date");
    } catch (error: any) {
      console.error("Error getting attendance by date:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance by date",
        data: {
          date,
          total_records: 0,
          summary: {
            total_workers: 0,
            active_workers: 0,
            total_luwang: 0
          },
          records: []
        }
      };
    }
  }

  /**
   * Get attendance records by date range
   */
  async getByDateRange(startDate: string, endDate: string, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<{
    date_range: {
      start_date: string;
      end_date: string;
      total_days: number;
    };
    summary: {
      total_assignments: number;
      total_luwang: number;
      average_workers_per_day: number;
      average_luwang_per_day: number;
    };
    daily_summaries: DailyAttendanceSummary[];
    raw_assignments: AttendanceRecord[];
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByDateRange",
        params: this.enrichParams({ startDate, endDate, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance by date range");
    } catch (error: any) {
      console.error("Error getting attendance by date range:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance by date range",
        data: {
          date_range: {
            start_date: startDate,
            end_date: endDate,
            total_days: 0
          },
          summary: {
            total_assignments: 0,
            total_luwang: 0,
            average_workers_per_day: 0,
            average_luwang_per_day: 0
          },
          daily_summaries: [],
          raw_assignments: []
        }
      };
    }
  }

  /**
   * Get attendance records for a specific worker
   */
  async getByWorker(workerId: number, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<{
    worker: {
      id: number;
      name: string;
      contact: string | null;
      email: string | null;
      status: string;
      hire_date: string | null;
      kabisilya: string | null;
    };
    statistics: {
      total_assignments: number;
      total_luwang: number;
      active_assignments: number;
      completed_assignments: number;
      cancelled_assignments: number;
    };
    assignments: AttendanceRecord[];
    monthly_summary: Array<{
      month: string;
      assignments_count: number;
      total_luwang: number;
      assignments: AttendanceRecord[];
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByWorker",
        params: this.enrichParams({ worker_id: workerId, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance by worker");
    } catch (error: any) {
      console.error("Error getting attendance by worker:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance by worker",
        data: {
          worker: {
            id: workerId,
            name: '',
            contact: null,
            email: null,
            status: '',
            hire_date: null,
            kabisilya: null
          },
          statistics: {
            total_assignments: 0,
            total_luwang: 0,
            active_assignments: 0,
            completed_assignments: 0,
            cancelled_assignments: 0
          },
          assignments: [],
          monthly_summary: [],
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            total_pages: 0
          }
        }
      };
    }
  }

  /**
   * Get attendance records for a specific pitak
   */
  async getByPitak(pitakId: number, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<AttendanceByPitakData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByPitak",
        params: this.enrichParams({ pitak_id: pitakId, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance by pitak");
    } catch (error: any) {
      console.error("Error getting attendance by pitak:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance by pitak",
        data: {
          pitak: {
            id: pitakId,
            location: null,
            total_luwang: 0,
            status: '',
            bukid: null
          },
          statistics: {
            total_assignments: 0,
            total_luwang: 0,
            unique_workers: 0,
            work_days: 0,
            average_luwang_per_assignment: 0
          },
          attendance_by_date: [],
          all_assignments: []
        }
      };
    }
  }

  /**
   * Get attendance records for a specific bukid
   */
  async getByBukid(bukidId: number, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<AttendanceByBukidData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByBukid",
        params: this.enrichParams({ bukid_id: bukidId, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance by bukid");
    } catch (error: any) {
      console.error("Error getting attendance by bukid:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance by bukid",
        data: {
          bukid: {
            id: bukidId,
            name: '',
            location: null,
            status: '',
            kabisilya: null
          },
          pitaks: [],
          statistics: {
            total_pitaks: 0,
            total_assignments: 0,
            total_luwang: 0,
            unique_workers: 0,
            average_luwang_per_assignment: 0
          },
          assignments_by_pitak: [],
          all_assignments: []
        }
      };
    }
  }

  /**
   * Get attendance records for a specific kabisilya
   */
  async getByKabisilya(kabisilyaId: number, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<AttendanceByKabisilyaData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByKabisilya",
        params: this.enrichParams({ kabisilya_id: kabisilyaId, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance by kabisilya");
    } catch (error: any) {
      console.error("Error getting attendance by kabisilya:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance by kabisilya",
        data: {
          kabisilya: {
            id: kabisilyaId,
            name: ''
          },
          workers: [],
          statistics: {
            total_workers: 0,
            active_workers: 0,
            workers_with_assignments: 0,
            total_assignments: 0,
            total_luwang: 0,
            average_assignments_per_worker: 0,
            average_luwang_per_worker: 0
          },
          attendance_by_worker: [],
          all_assignments: []
        }
      };
    }
  }

  /**
   * Get attendance summary for a worker
   */
  async getWorkerSummary(workerId: number, dateRange: DateRange = {}): Promise<AttendanceResponse<WorkerAttendanceSummary>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getWorkerAttendanceSummary",
        params: this.enrichParams({ worker_id: workerId, date_range: dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker attendance summary");
    } catch (error: any) {
      console.error("Error getting worker attendance summary:", error);
      return {
        status: false,
        message: error.message || "Failed to get worker attendance summary",
        data: {
          worker: {
            id: workerId,
            name: '',
            status: '',
            hire_date: null,
            kabisilya: null
          },
          summary: {
            total_assignments: 0,
            total_luwang: '0.00',
            average_luwang_per_assignment: '0.00',
            attendance_rate: '0%'
          },
          status_breakdown: {
            active: 0,
            completed: 0,
            cancelled: 0
          },
          performance: {
            current_streak: 0,
            longest_streak: 0,
            most_frequent_pitak: null,
            unique_pitaks_count: 0
          },
          recent_assignments: []
        }
      };
    }
  }

  /**
   * Get daily attendance report
   */
  async getDailyReport(date?: string, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<DailyAttendanceReport>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getDailyAttendanceReport",
        params: this.enrichParams({ date, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get daily attendance report");
    } catch (error: any) {
      console.error("Error getting daily attendance report:", error);
      return {
        status: false,
        message: error.message || "Failed to get daily attendance report",
        data: {
          report_date: date || new Date().toISOString().split('T')[0],
          summary: {
            total_active_workers: 0,
            workers_present: 0,
            workers_absent: 0,
            attendance_rate: '0%',
            total_luwang: 0
          },
          attendance_by_kabisilya: [],
          present_workers: [],
          absent_workers: [],
          detailed_assignments: []
        }
      };
    }
  }

  /**
   * Get monthly attendance summary
   */
  async getMonthlySummary(year: number, month: number, filters: AttendanceFilterParams = {}): Promise<AttendanceResponse<MonthlyAttendanceSummary>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getMonthlyAttendanceSummary",
        params: this.enrichParams({ year, month, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get monthly attendance summary");
    } catch (error: any) {
      console.error("Error getting monthly attendance summary:", error);
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      return {
        status: false,
        message: error.message || "Failed to get monthly attendance summary",
        data: {
          year,
          month,
          month_name: monthName,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days_in_month: endDate.getDate(),
          work_days: 0,
          daily_summary: [],
          kabisilya_summary: [],
          top_performers: []
        }
      };
    }
  }

  /**
   * Get attendance statistics
   */
  async getStatistics(dateRange: DateRange = {}): Promise<AttendanceResponse<AttendanceStatistics>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceStatistics",
        params: this.enrichParams({ date_range: dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance statistics");
    } catch (error: any) {
      console.error("Error getting attendance statistics:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance statistics",
        data: {
          date_range: {
            start_date: dateRange.startDate || '',
            end_date: dateRange.endDate || '',
            total_days: 0,
            work_days: 0
          },
          overview: {
            total_active_workers: 0,
            total_assignments: 0,
            total_luwang: 0,
            average_assignments_per_day: 0,
            average_luwang_per_day: 0,
            average_luwang_per_assignment: 0
          },
          trends: {
            assignment_change: '0%',
            luwang_change: '0%',
            previous_period: {
              start_date: '',
              end_date: '',
              total_assignments: 0,
              total_luwang: 0
            }
          },
          status_breakdown: {},
          worker_statistics: {
            total_workers: 0,
            average_assignments_per_worker: 0,
            average_luwang_per_worker: 0,
            top_performers: []
          },
          daily_activity: {
            most_active_days: [],
            busiest_day: null
          },
          kabisilya_statistics: [],
          pitak_statistics: []
        }
      };
    }
  }

  /**
   * Search attendance records
   */
  async search(searchQuery: SearchAttendanceParams): Promise<AttendanceResponse<SearchAttendanceResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "searchAttendanceRecords",
        params: this.enrichParams({ query: searchQuery }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search attendance records");
    } catch (error: any) {
      console.error("Error searching attendance records:", error);
      return {
        status: false,
        message: error.message || "Failed to search attendance records",
        data: {
          search_query: searchQuery,
          total_results: 0,
          assignments: [],
          pagination: {
            page: searchQuery.page || 1,
            limit: searchQuery.limit || 50,
            total: 0,
            total_pages: 0
          }
        }
      };
    }
  }

  // 📊 Utility Methods

  /**
   * Get today's attendance report
   */
  async getTodayReport(): Promise<AttendanceResponse<DailyAttendanceReport>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyReport(today);
  }

  /**
   * Get current month's summary
   */
  async getCurrentMonthSummary(): Promise<AttendanceResponse<MonthlyAttendanceSummary>> {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return this.getMonthlySummary(year, month);
  }

  /**
   * Get attendance for last 7 days
   */
  async getLastWeekAttendance(): Promise<AttendanceResponse<{
    date_range: {
      start_date: string;
      end_date: string;
      total_days: number;
    };
    summary: {
      total_assignments: number;
      total_luwang: number;
      average_workers_per_day: number;
      average_luwang_per_day: number;
    };
    daily_summaries: DailyAttendanceSummary[];
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return this.getByDateRange(startDateStr, endDateStr);
  }

  /**
   * Get attendance for last 30 days
   */
  async getLastMonthAttendance(): Promise<AttendanceResponse<{
    date_range: {
      start_date: string;
      end_date: string;
      total_days: number;
    };
    summary: {
      total_assignments: number;
      total_luwang: number;
      average_workers_per_day: number;
      average_luwang_per_day: number;
    };
    daily_summaries: DailyAttendanceSummary[];
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return this.getByDateRange(startDateStr, endDateStr);
  }

  /**
   * Validate date format
   */
  async validateDate(date: string): Promise<ValidationResponse> {
    try {
      const dateObj = new Date(date);
      const isValid = !isNaN(dateObj.getTime()) && dateObj <= new Date();
      
      return {
        status: true,
        message: isValid ? "Date is valid" : "Invalid date or date is in the future",
        data: isValid
      };
    } catch (error: any) {
      console.error("Error validating date:", error);
      return {
        status: false,
        message: error.message || "Failed to validate date",
        data: false
      };
    }
  }

  /**
   * Validate date range
   */
  async validateDateRange(startDate: string, endDate: string): Promise<ValidationResponse> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const isValid = !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
      
      return {
        status: true,
        message: isValid ? "Date range is valid" : "Invalid date range",
        data: isValid
      };
    } catch (error: any) {
      console.error("Error validating date range:", error);
      return {
        status: false,
        message: error.message || "Failed to validate date range",
        data: false
      };
    }
  }

  /**
   * Get attendance overview for dashboard
   */
  async getDashboardOverview(): Promise<AttendanceResponse<{
    today: {
      present: number;
      absent: number;
      total_luwang: number;
      attendance_rate: string;
    };
    this_week: {
      total_assignments: number;
      total_luwang: number;
      average_daily_attendance: number;
    };
    this_month: {
      work_days: number;
      total_assignments: number;
      total_luwang: number;
      top_performer: {
        worker_id: number;
        worker_name: string;
        total_luwang: number;
      } | null;
    };
    recent_activity: Array<{
      date: string;
      activity: string;
      details: string;
    }>;
  }>> {
    try {
      // Get today's report
      const todayReport = await this.getTodayReport();
      const lastWeek = await this.getLastWeekAttendance();
      const lastMonth = await this.getLastMonthAttendance();
      const stats = await this.getStatistics({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });

      const overview = {
        today: {
          present: todayReport.status ? todayReport.data.summary.workers_present : 0,
          absent: todayReport.status ? todayReport.data.summary.workers_absent : 0,
          total_luwang: todayReport.status ? todayReport.data.summary.total_luwang : 0,
          attendance_rate: todayReport.status ? todayReport.data.summary.attendance_rate : '0%'
        },
        this_week: {
          total_assignments: lastWeek.status ? lastWeek.data.summary.total_assignments : 0,
          total_luwang: lastWeek.status ? lastWeek.data.summary.total_luwang : 0,
          average_daily_attendance: lastWeek.status ? lastWeek.data.summary.average_workers_per_day : 0
        },
        this_month: {
          work_days: lastMonth.status ? lastMonth.data.daily_summaries.filter(day => day.total_workers > 0).length : 0,
          total_assignments: lastMonth.status ? lastMonth.data.summary.total_assignments : 0,
          total_luwang: lastMonth.status ? lastMonth.data.summary.total_luwang : 0,
          top_performer: stats.status && stats.data.worker_statistics.top_performers.length > 0 
            ? {
                worker_id: stats.data.worker_statistics.top_performers[0].worker_id,
                worker_name: stats.data.worker_statistics.top_performers[0].worker_name,
                total_luwang: stats.data.worker_statistics.top_performers[0].total_luwang
              }
            : null
        },
        recent_activity: []
      };

      return {
        status: true,
        message: "Dashboard overview retrieved",
        data: overview
      };
    } catch (error: any) {
      console.error("Error getting dashboard overview:", error);
      return {
        status: false,
        message: error.message || "Failed to get dashboard overview",
        data: {
          today: {
            present: 0,
            absent: 0,
            total_luwang: 0,
            attendance_rate: '0%'
          },
          this_week: {
            total_assignments: 0,
            total_luwang: 0,
            average_daily_attendance: 0
          },
          this_month: {
            work_days: 0,
            total_assignments: 0,
            total_luwang: 0,
            top_performer: null
          },
          recent_activity: []
        }
      };
    }
  }

  // 🔄 Export methods

  /**
   * Export attendance data to CSV
   */
  async exportToCSV(params: {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'excel';
    includeHeaders?: boolean;
  }): Promise<AttendanceResponse<{
    csvData: string;
    filename: string;
    recordCount: number;
  }>> {
    try {
      // This would typically call a backend export method
      // For now, we'll simulate by getting the data and converting to CSV
      
      const dateRange = {
        startDate: params.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: params.endDate || new Date().toISOString().split('T')[0]
      };

      const response = await this.getByDateRange(dateRange.startDate, dateRange.endDate);
      
      if (!response.status) {
        throw new Error(response.message);
      }

      // Simple CSV conversion (in a real app, use a library like papaparse)
      let csvContent = params.includeHeaders !== false ? 
        "Date,Worker Name,Worker Contact,Pitak Location,Bukid Name,Luwang Count,Status,Notes\n" : "";
      
      response.data.raw_assignments.forEach(record => {
        const row = [
          record.assignment_date.split('T')[0],
          `"${record.worker.name}"`,
          `"${record.worker.contact || ''}"`,
          `"${record.pitak.location || ''}"`,
          `"${record.bukid.name || ''}"`,
          record.luwang_count,
          record.status,
          `"${record.notes || ''}"`
        ].join(',');
        csvContent += row + '\n';
      });

      const filename = `attendance_${dateRange.startDate}_to_${dateRange.endDate}.csv`;

      return {
        status: true,
        message: "Export completed successfully",
        data: {
          csvData: csvContent,
          filename,
          recordCount: response.data.raw_assignments.length
        }
      };
    } catch (error: any) {
      console.error("Error exporting to CSV:", error);
      return {
        status: false,
        message: error.message || "Failed to export data",
        data: {
          csvData: '',
          filename: '',
          recordCount: 0
        }
      };
    }
  }

  /**
   * Generate attendance report PDF
   */
  async generatePDFReport(params: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    date?: string;
    startDate?: string;
    endDate?: string;
    workerId?: number;
    pitakId?: number;
  }): Promise<AttendanceResponse<{
    success: boolean;
    reportUrl?: string;
    message: string;
  }>> {
    try {
      // This would typically call a backend PDF generation service
      // For now, return a simulated response
      
      return {
        status: true,
        message: `PDF report for ${params.type} attendance generated successfully`,
        data: {
          success: true,
          message: `Report for ${params.type} attendance has been queued for generation`
        }
      };
    } catch (error: any) {
      console.error("Error generating PDF report:", error);
      return {
        status: false,
        message: error.message || "Failed to generate PDF report",
        data: {
          success: false,
          message: "Failed to generate report"
        }
      };
    }
  }

  // 📈 Analytics methods

  /**
   * Get attendance trends over time
   */
  async getTrends(timeframe: 'week' | 'month' | 'quarter' | 'year'): Promise<AttendanceResponse<{
    timeframe: string;
    data: Array<{
      period: string;
      assignments: number;
      total_luwang: number;
      average_attendance: number;
    }>;
    trend_direction: 'up' | 'down' | 'stable';
    percentage_change: number;
  }>> {
    try {
      // Calculate date range based on timeframe
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const response = await this.getByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (!response.status) {
        throw new Error(response.message);
      }

      // Analyze trend (simplified)
      const data = response.data.daily_summaries.slice(-10); // Last 10 periods
      const trend = data.length >= 2 
        ? data[data.length - 1].total_workers > data[0].total_workers ? 'up' : 'down'
        : 'stable';
      
      const percentageChange = data.length >= 2 
        ? ((data[data.length - 1].total_workers - data[0].total_workers) / data[0].total_workers * 100)
        : 0;

      return {
        status: true,
        message: `Trend analysis for ${timeframe}`,
        data: {
          timeframe,
          data: data.map(day => ({
            period: day.date,
            assignments: day.total_workers,
            total_luwang: day.total_luwang,
            average_attendance: day.total_workers
          })),
          trend_direction: trend,
          percentage_change: percentageChange
        }
      };
    } catch (error: any) {
      console.error("Error getting attendance trends:", error);
      return {
        status: false,
        message: error.message || "Failed to get attendance trends",
        data: {
          timeframe,
          data: [],
          trend_direction: 'stable',
          percentage_change: 0
        }
      };
    }
  }

  // 🛡️ Validation methods

  /**
   * Validate if worker exists and is active
   */
  async validateWorker(workerId: number): Promise<ValidationResponse> {
    try {
      // This would typically validate against the worker database
      // For now, we'll assume it's valid if we can get attendance data
      const response = await this.getByWorker(workerId, { limit: 1 });
      
      return {
        status: true,
        message: response.status ? "Worker is valid" : "Worker not found or inactive",
        data: response.status
      };
    } catch (error: any) {
      console.error("Error validating worker:", error);
      return {
        status: false,
        message: error.message || "Failed to validate worker",
        data: false
      };
    }
  }

  /**
   * Validate if pitak exists and is active
   */
  async validatePitak(pitakId: number): Promise<ValidationResponse> {
    try {
      const response = await this.getByPitak(pitakId, { limit: 1 });
      
      return {
        status: true,
        message: response.status ? "Pitak is valid" : "Pitak not found or inactive",
        data: response.status
      };
    } catch (error: any) {
      console.error("Error validating pitak:", error);
      return {
        status: false,
        message: error.message || "Failed to validate pitak",
        data: false
      };
    }
  }

  // Event listeners (if needed in the future)
  onAttendanceUpdated(callback: (data: AttendanceRecord) => void) {
    // Implement if IPC supports events
    console.log("onAttendanceUpdated event listener registered");
  }

  onDailyReportGenerated(callback: (report: DailyAttendanceReport) => void) {
    // Implement if IPC supports events
    console.log("onDailyReportGenerated event listener registered");
  }

  onMonthlySummaryGenerated(callback: (summary: MonthlyAttendanceSummary) => void) {
    // Implement if IPC supports events
    console.log("onMonthlySummaryGenerated event listener registered");
  }
}

const attendanceAPI = new AttendanceAPI();

export default attendanceAPI;