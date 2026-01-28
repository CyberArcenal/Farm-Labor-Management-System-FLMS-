// components/Worker/WorkerAttendancePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    Calendar as CalendarIcon,
    BarChart3,
    TrendingUp,
    Download,
    Printer, Hash, Coffee,
    Home, DollarSign,
    Percent, RefreshCw,
    ArrowLeft
} from 'lucide-react';
import workerAPI from '../../apis/worker';
import attendanceAPI,{ 
    type WorkerAttendanceSummary,
    type AttendanceFilterParams,
    type DateRange,
    type AttendanceRecord
} from '../../apis/attendance';
import { showError, showSuccess } from '../../utils/notification';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

const WorkerAttendancePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [attendanceData, setAttendanceData] = useState<WorkerAttendanceSummary | null>(null);
    const [workerInfo, setWorkerInfo] = useState<any | null>(null);
    const [detailedAssignments, setDetailedAssignments] = useState<AttendanceRecord[]>([]);

    // Date controls
    const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const [viewType, setViewType] = useState<'calendar' | 'list' | 'summary'>('calendar');

    // Fetch worker info
    const fetchWorkerInfo = useCallback(async () => {
        if (!id) return;

        try {
            const response = await workerAPI.getWorkerById(parseInt(id));
            if (response.status) {
                setWorkerInfo(response.data.worker);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            console.error('Failed to fetch worker info:', err);
        }
    }, [id]);

    // Fetch attendance data using the new attendance API
    const fetchAttendance = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const workerId = parseInt(id);
            
            // Get worker summary for the current month
            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfMonth = new Date(currentYear, currentMonth, 0);
            
            const dateRange: DateRange = {
                startDate: startOfMonth.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0]
            };

            const response = await attendanceAPI.getWorkerSummary(workerId, dateRange);

            if (response.status) {
                setAttendanceData(response.data);
                
                // Also fetch detailed assignments for the month
                const filters: AttendanceFilterParams = {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    sortBy: 'assignment_date',
                    sortOrder: 'ASC'
                };
                
                const assignmentsResponse = await attendanceAPI.getByWorker(workerId, filters);
                if (assignmentsResponse.status) {
                    setDetailedAssignments(assignmentsResponse.data.assignments);
                }
            } else {
                throw new Error(response.message || 'Failed to fetch attendance data');
            }
        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, currentMonth, currentYear]);

    // Generate calendar days from attendance data
    const generateCalendarDays = () => {
        if (!attendanceData || !detailedAssignments) return [];

        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

        const days = [];

        // Empty days for start of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Actual days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            
            // Find assignments for this date
            const dayAssignments = detailedAssignments.filter(assignment => 
                assignment.assignment_date.startsWith(dateStr)
            );
            
            const hasWork = dayAssignments.length > 0;
            const totalLuwang = dayAssignments.reduce((sum, assignment) => sum + assignment.luwang_count, 0);
            const date = new Date(currentYear, currentMonth - 1, i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            days.push({
                day: i,
                date: dateStr,
                data: {
                    date: dateStr,
                    day: i,
                    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                    isWeekend,
                    assignments: dayAssignments,
                    hasWork,
                    totalLuwang
                }
            });
        }

        return days;
    };

    // Generate weekly breakdown
    const generateWeeklyBreakdown = () => {
        if (!detailedAssignments) return [];

        const weeks: Array<{
            week: number;
            days: any[];
            summary: {
                daysInWeek: number;
                daysWorked: number;
                totalLuwang: number;
                averageLuwang: number;
            };
        }> = [];

        const calendarDays = generateCalendarDays().filter(day => day !== null);
        let currentWeek = 1;
        let weekDays: any[] = [];

        calendarDays.forEach((day, index) => {
            if (day) {
                weekDays.push(day.data);
                
                // Start new week on Sunday or end of month
                const isSunday = day.data.dayOfWeek === 'Sun';
                const isLastDay = index === calendarDays.length - 1;
                
                if (isSunday || isLastDay) {
                    const daysWorked = weekDays.filter(d => d.hasWork).length;
                    const totalLuwang = weekDays.reduce((sum, d) => sum + d.totalLuwang, 0);
                    
                    weeks.push({
                        week: currentWeek,
                        days: [...weekDays],
                        summary: {
                            daysInWeek: weekDays.length,
                            daysWorked,
                            totalLuwang,
                            averageLuwang: daysWorked > 0 ? totalLuwang / daysWorked : 0
                        }
                    });
                    
                    currentWeek++;
                    weekDays = [];
                }
            }
        });

        return weeks;
    };

    // Calculate summary statistics
    const calculateSummary = () => {
        const calendarDays = generateCalendarDays().filter(day => day !== null) as any[];
        
        const workingDays = calendarDays.filter(day => !day.data.isWeekend).length;
        const daysWorked = calendarDays.filter(day => day.data.hasWork).length;
        const weekendDaysWorked = calendarDays.filter(day => day.data.isWeekend && day.data.hasWork).length;
        const totalLuwang = calendarDays.reduce((sum, day) => sum + day.data.totalLuwang, 0);
        
        return {
            totalDays: calendarDays.length,
            workingDays,
            daysWorked,
            daysOff: workingDays - daysWorked,
            weekendDaysWorked,
            totalLuwang,
            averageLuwangPerDay: daysWorked > 0 ? totalLuwang / daysWorked : 0,
            attendanceRate: workingDays > 0 ? daysWorked / workingDays : 0
        };
    };

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                await Promise.all([
                    fetchWorkerInfo(),
                    fetchAttendance()
                ]);
            } catch (err: any) {
                setError(err.message || 'Failed to load data');
                showError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Cleanup function
        return () => {
            // Cancel any pending operations if needed
        };
    }, []);

    // Refresh when month/year changes
    useEffect(() => {
        if (id) {
            fetchAttendance();
        }
    }, [currentMonth, currentYear, fetchAttendance]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAttendance();
    };

    // Date navigation
    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentMonth === 1) {
                setCurrentMonth(12);
                setCurrentYear(prev => prev - 1);
            } else {
                setCurrentMonth(prev => prev - 1);
            }
        } else {
            if (currentMonth === 12) {
                setCurrentMonth(1);
                setCurrentYear(prev => prev + 1);
            } else {
                setCurrentMonth(prev => prev + 1);
            }
        }
    };

    // Go to current month
    const goToCurrentMonth = () => {
        const now = new Date();
        setCurrentMonth(now.getMonth() + 1);
        setCurrentYear(now.getFullYear());
    };

    // Get day status style
    const getDayStatusStyle = (hasWork: boolean, isWeekend: boolean, totalLuwang: number) => {
        if (!hasWork) {
            return {
                background: 'var(--card-secondary-bg)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)'
            };
        }

        if (isWeekend) {
            return {
                background: 'var(--accent-purple-light)',
                color: 'var(--accent-purple)',
                border: '1px solid rgba(147, 51, 234, 0.3)'
            };
        }

        if (totalLuwang > 0) {
            return {
                background: 'var(--accent-green-light)',
                color: 'var(--accent-green)',
                border: '1px solid rgba(56, 161, 105, 0.3)'
            };
        }

        return {
            background: 'var(--accent-sky-light)',
            color: 'var(--accent-sky)',
            border: '1px solid rgba(49, 130, 206, 0.3)'
        };
    };

    // Get day icon
    const getDayIcon = (hasWork: boolean, isWeekend: boolean) => {
        if (!hasWork) return Home;
        if (isWeekend) return Coffee;
        return CheckCircle;
    };

    // Export attendance
    const handleExportAttendance = async () => {
        try {
            if (!id) return;
            
            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfMonth = new Date(currentYear, currentMonth, 0);
            
            const response = await attendanceAPI.exportToCSV({
                startDate: startOfMonth.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                format: 'csv',
                includeHeaders: true
            });

            if (response.status) {
                // Create and download CSV file
                const blob = new Blob([response.data.csvData], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = response.data.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showSuccess(`Exported ${response.data.recordCount} records successfully`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export attendance');
        }
    };

    // Print attendance
    const handlePrintAttendance = () => {
        window.print();
    };

    // Generate PDF report
    const handleGeneratePDF = async () => {
        try {
            if (!id) return;
            
            const response = await attendanceAPI.generatePDFReport({
                type: 'monthly',
                date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
                workerId: parseInt(id)
            });

            if (response.status) {
                showSuccess('PDF report generation has been queued');
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to generate PDF report');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-3 transition-colors duration-300"
                        style={{ borderColor: 'var(--primary-color)' }}
                    ></div>
                    <p className="text-sm transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                        Loading attendance data...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !attendanceData) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Attendance Data
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {error || 'No attendance data found'}
                </p>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center mx-auto"
                    style={{
                        background: 'var(--primary-color)',
                        color: 'var(--sidebar-text)'
                    }}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                </button>
            </div>
        );
    }

    const calendarDays = generateCalendarDays();
    const weeks = generateWeeklyBreakdown();
    const summary = calculateSummary();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <CalendarIcon className="w-6 h-6" />
                            Attendance Record
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {workerInfo?.name || 'Worker'} • {monthNames[currentMonth - 1]} {currentYear}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportAttendance}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>

                    <button
                        onClick={handleGeneratePDF}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                    </button>

                    <button
                        onClick={handlePrintAttendance}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </button>

                    <button
                        onClick={goToCurrentMonth}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Current Month
                    </button>
                </div>
            </div>

            {/* Worker Info Card */}
            {workerInfo && (
                <div className="p-5 rounded-xl mb-6"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                    <Users className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {workerInfo.name}
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        ID: {workerInfo.id} • {workerInfo.status.charAt(0).toUpperCase() + workerInfo.status.slice(1)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                    <div>
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Hire Date</div>
                                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {workerInfo.hireDate ? formatDate(workerInfo.hireDate, 'MMM dd, yyyy') : 'Not set'}
                                        </div>
                                    </div>
                                </div>

                                {attendanceData.worker.kabisilya && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        <div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kabisilya</div>
                                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {attendanceData.worker.kabisilya}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    <div>
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Current Balance</div>
                                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {formatCurrency(workerInfo.currentBalance)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => navigate(`/worker/view/${id}`)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                                style={{
                                    background: 'var(--card-secondary-bg)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                View Worker Profile
                            </button>
                            <button
                                onClick={() => navigate(`/worker/performance/${id}`)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                                style={{
                                    background: 'var(--card-secondary-bg)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                Performance Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Month Navigation & View Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{
                                background: 'var(--card-secondary-bg)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                        </button>

                        <div className="text-center">
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {monthNames[currentMonth - 1]} {currentYear}
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Period: {formatDate(startOfMonth.toISOString().split('T')[0], 'MMM dd')} - {formatDate(endOfMonth.toISOString().split('T')[0], 'MMM dd, yyyy')}
                            </p>
                        </div>

                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{
                                background: 'var(--card-secondary-bg)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                        </button>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex gap-2">
                    {['calendar', 'list', 'summary'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setViewType(type as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewType === type ? '' : 'opacity-70 hover:opacity-100'
                                }`}
                            style={{
                                background: viewType === type ? 'var(--primary-color)' : 'var(--card-secondary-bg)',
                                color: viewType === type ? 'var(--sidebar-text)' : 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Days Worked
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {summary.daysWorked}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            / {summary.workingDays} days
                        </span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {summary.weekendDaysWorked} weekend days
                    </div>
                </div>

                <div className="p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Total LuWang
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(summary.totalLuwang)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Avg: {formatNumber(summary.averageLuwangPerDay)} per day
                    </div>
                </div>

                <div className="p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-5 h-5" style={{ color: 'var(--accent-sky)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Attendance Rate
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {(summary.attendanceRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {summary.daysOff} days off
                    </div>
                </div>

                <div className="p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-purple)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Average LuWang/Assignment
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {parseFloat(attendanceData.summary.average_luwang_per_assignment).toFixed(1)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {attendanceData.summary.total_assignments} total assignments
                    </div>
                </div>
            </div>

            {/* Main Content - Calendar View */}
            {viewType === 'calendar' && (
                <div className="p-5 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div
                                key={day}
                                className="text-center py-2 text-sm font-medium"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => (
                            <div key={index} className="min-h-24">
                                {day ? (
                                    <div
                                        className="h-full p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                                        style={getDayStatusStyle(
                                            day.data?.hasWork || false,
                                            day.data?.isWeekend || false,
                                            day.data?.totalLuwang || 0
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium">{day.day}</span>
                                            {day.data && (
                                                <div className="text-xs">
                                                    {getDayIcon(
                                                        day.data.hasWork,
                                                        day.data.isWeekend
                                                    )({
                                                        className: 'w-3 h-3',
                                                        style: { color: 'inherit' }
                                                    } as any)}
                                                </div>
                                            )}
                                        </div>

                                        {day.data && (
                                            <div className="mt-2">
                                                {day.data.hasWork ? (
                                                    <>
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <Hash className="w-3 h-3" />
                                                            <span className="text-xs font-medium">
                                                                {formatNumber(day.data.totalLuwang)}
                                                            </span>
                                                        </div>
                                                        {day.data.assignments && day.data.assignments.length > 0 && (
                                                            <div className="text-xs opacity-75">
                                                                {day.data.assignments.length} assignment(s)
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-xs opacity-75">
                                                        {day.data.isWeekend ? 'Weekend' : 'No work'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full p-2 rounded-lg opacity-30"
                                        style={{
                                            background: 'var(--card-secondary-bg)',
                                            border: '1px dashed var(--border-light)'
                                        }}
                                    ></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Legend
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ background: 'var(--accent-green-light)' }}></div>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Work Day with LuWang</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ background: 'var(--accent-sky-light)' }}></div>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Work Day</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ background: 'var(--accent-purple-light)' }}></div>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Weekend Work</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{
                                    background: 'var(--card-secondary-bg)',
                                    border: '1px dashed var(--border-light)'
                                }}></div>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>No Work / Day Off</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            {viewType === 'list' && (
                <div className="p-5 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'var(--table-header-bg)' }}>
                                    <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Date
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Day
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Status
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        LuWang
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Assignments
                                    </th>
                                    <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Pitak
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {calendarDays
                                    .filter(day => day && day.data.hasWork)
                                    .map((day, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {formatDate(day!.data.date, 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <span style={{ color: 'var(--text-primary)' }}>{day!.data.dayOfWeek}</span>
                                                    {day!.data.isWeekend && (
                                                        <span className="px-2 py-1 rounded-full text-xs"
                                                            style={{
                                                                background: 'var(--accent-purple-light)',
                                                                color: 'var(--accent-purple)'
                                                            }}
                                                        >
                                                            Weekend
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {day!.data.hasWork ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                            <span style={{ color: 'var(--text-primary)' }}>Worked</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                                            <span style={{ color: 'var(--text-secondary)' }}>No Work</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {formatNumber(day!.data.totalLuwang)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {day!.data.assignments?.length || 0}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {day!.data.assignments && day!.data.assignments.length > 0 ? (
                                                    <button
                                                        onClick={() => {
                                                            // Navigate to assignments for this day
                                                            navigate(`/assignment?date=${day!.data.date}&workerId=${id}`);
                                                        }}
                                                        className="text-xs px-2 py-1 rounded transition-colors"
                                                        style={{
                                                            background: 'var(--accent-sky-light)',
                                                            color: 'var(--accent-sky)',
                                                            border: '1px solid var(--border-color)'
                                                        }}
                                                    >
                                                        View Assignments
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-500">No assignments</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                {/* Days off */}
                                {calendarDays
                                    .filter(day => day && !day.data.hasWork)
                                    .map((day, index) => (
                                        <tr
                                            key={`off-${index}`}
                                            className="opacity-60"
                                            style={{ borderBottom: '1px solid var(--border-light)' }}
                                        >
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {formatDate(day!.data.date, 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span style={{ color: 'var(--text-secondary)' }}>{day!.data.dayOfWeek}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Home className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {day!.data.isWeekend ? 'Weekend' : 'Day Off'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>-</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-xs text-gray-500">-</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-xs text-gray-500">-</span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary View */}
            {viewType === 'summary' && (
                <div className="space-y-6">
                    {/* Performance Insights */}
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <TrendingUp className="w-5 h-5" />
                            Performance Insights
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                                    Attendance Statistics
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Overall Attendance Rate</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {(summary.attendanceRate * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${summary.attendanceRate * 100}%`,
                                                    background: summary.attendanceRate > 0.8
                                                        ? 'var(--accent-green)'
                                                        : summary.attendanceRate > 0.6
                                                            ? 'var(--accent-gold)'
                                                            : 'var(--accent-rust)'
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg text-center"
                                            style={{
                                                background: 'var(--card-secondary-bg)',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {attendanceData.status_breakdown.active}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active Assignments</div>
                                        </div>
                                        <div className="p-3 rounded-lg text-center"
                                            style={{
                                                background: 'var(--card-secondary-bg)',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {attendanceData.status_breakdown.completed}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Completed</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                                    Streaks & Performance
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Streak</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {attendanceData.performance.current_streak} days
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (attendanceData.performance.current_streak / attendanceData.performance.longest_streak) * 100)}%`,
                                                    background: 'var(--accent-gold)'
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg"
                                        style={{
                                            background: 'var(--card-secondary-bg)',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <div className="text-center mb-2">
                                            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {attendanceData.performance.longest_streak}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Longest Streak</div>
                                        </div>
                                        {attendanceData.performance.most_frequent_pitak && (
                                            <div className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                                Most frequent pitak: {attendanceData.performance.most_frequent_pitak.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Assignments */}
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Recent Assignments
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ background: 'var(--table-header-bg)' }}>
                                        <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Date</th>
                                        <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Pitak</th>
                                        <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>LuWang</th>
                                        <th className="p-3 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.recent_assignments.slice(0, 5).map((assignment: { date: string | Date | null | undefined; pitak: any; luwang_count: number | null | undefined; status: string; }, index: React.Key | null | undefined) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="p-3">
                                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {formatDate(assignment.date, 'MMM dd, yyyy')}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {assignment.pitak || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {formatNumber(assignment.luwang_count)}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${assignment.status === 'completed' ? 'status-badge-completed' : 
                                                    assignment.status === 'active' ? 'status-badge-active' : 
                                                    'status-badge-cancelled'}`}>
                                                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                    style={{
                        background: 'var(--card-secondary-bg)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Workers
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                            const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
                            setCurrentMonth(prevMonth);
                            setCurrentYear(prevYear);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        Previous Month
                    </button>
                    <button
                        onClick={() => {
                            const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
                            const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
                            setCurrentMonth(nextMonth);
                            setCurrentYear(nextYear);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        Next Month
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkerAttendancePage;