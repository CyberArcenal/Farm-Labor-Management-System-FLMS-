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
import type { WorkerAttendanceData, WorkerData } from '../../apis/worker';
import workerAPI from '../../apis/worker';
import { showError, showSuccess } from '../../utils/notification';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

const WorkerAttendancePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [attendanceData, setAttendanceData] = useState<WorkerAttendanceData | null>(null);
    const [workerInfo, setWorkerInfo] = useState<WorkerData | null>(null);

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

    // Fetch attendance data
    const fetchAttendance = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await workerAPI.getWorkerAttendance(
                parseInt(id),
                currentMonth,
                currentYear
            );

            if (response.status) {
                setAttendanceData(response.data);
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
    }, []); // Empty dependency array to run only once on mount

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

    // Generate calendar days
    const generateCalendarDays = () => {
        if (!attendanceData) return [];

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
            const dayData = attendanceData.attendance.find(a => a.date === dateStr);
            days.push({
                day: i,
                date: dateStr,
                data: dayData
            });
        }

        return days;
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
            // Implement export logic here
            showSuccess('Export functionality coming soon!');
        } catch (err: any) {
            showError(err.message || 'Failed to export attendance');
        }
    };

    // Print attendance
    const handlePrintAttendance = () => {
        window.print();
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
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

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
                        Export
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

                                {workerInfo.kabisilya && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        <div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kabisilya</div>
                                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {workerInfo.kabisilya.name}
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
                                Period: {formatDate(attendanceData.period.startDate, 'MMM dd')} - {formatDate(attendanceData.period.endDate, 'MMM dd, yyyy')}
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
                            {attendanceData.summary.daysWorked}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            / {attendanceData.summary.workingDays} days
                        </span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {attendanceData.summary.weekendDaysWorked} weekend days
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
                        {formatNumber(attendanceData.summary.totalLuwang)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Avg: {formatNumber(attendanceData.summary.averageLuwangPerDay)} per day
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
                        {(attendanceData.summary.attendanceRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {attendanceData.summary.daysOff} days off
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
                            Weekly Average
                        </span>
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {attendanceData.weeks.length > 0
                            ? formatNumber(
                                attendanceData.weeks.reduce((sum, week) => sum + week.summary.totalLuwang, 0) /
                                attendanceData.weeks.length
                            )
                            : '0'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        LuWang per week
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
                                                    })}
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
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.attendance
                                    .filter(day => day.hasWork)
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
                                                        {formatDate(day.date, 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <span style={{ color: 'var(--text-primary)' }}>{day.dayOfWeek}</span>
                                                    {day.isWeekend && (
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
                                                    {day.hasWork ? (
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
                                                        {formatNumber(day.totalLuwang)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {day.assignments?.length || 0}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {day.assignments && day.assignments.length > 0 ? (
                                                    <button
                                                        onClick={() => {
                                                            // Navigate to assignments for this day
                                                            navigate(`/assignment?date=${day.date}&workerId=${id}`);
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
                                {attendanceData.attendance
                                    .filter(day => !day.hasWork)
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
                                                        {formatDate(day.date, 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span style={{ color: 'var(--text-secondary)' }}>{day.dayOfWeek}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Home className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {day.isWeekend ? 'Weekend' : 'Day Off'}
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
                    {/* Weekly Breakdown */}
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <BarChart3 className="w-5 h-5" />
                            Weekly Breakdown
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {attendanceData.weeks.map((week, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg"
                                    style={{
                                        background: 'var(--card-secondary-bg)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            Week {week.week}
                                        </h4>
                                        <span className="text-xs px-2 py-1 rounded-full"
                                            style={{
                                                background: 'var(--accent-sky-light)',
                                                color: 'var(--accent-sky)'
                                            }}
                                        >
                                            {week.summary.daysWorked}/{week.summary.daysInWeek} days
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total LuWang:</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {formatNumber(week.summary.totalLuwang)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average per Day:</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {formatNumber(week.summary.averageLuwang)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Work Rate:</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {((week.summary.daysWorked / week.summary.daysInWeek) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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
                                                {(attendanceData.summary.attendanceRate * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${attendanceData.summary.attendanceRate * 100}%`,
                                                    background: attendanceData.summary.attendanceRate > 0.8
                                                        ? 'var(--accent-green)'
                                                        : attendanceData.summary.attendanceRate > 0.6
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
                                                {attendanceData.summary.workingDays}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Working Days</div>
                                        </div>
                                        <div className="p-3 rounded-lg text-center"
                                            style={{
                                                background: 'var(--card-secondary-bg)',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {attendanceData.summary.daysOff}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Days Off</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                                    Productivity Metrics
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average LuWang per Day</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {formatNumber(attendanceData.summary.averageLuwangPerDay)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (attendanceData.summary.averageLuwangPerDay / 100) * 100)}%`,
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
                                                {attendanceData.summary.weekendDaysWorked}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Weekend Days Worked</div>
                                        </div>
                                        <div className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                            {attendanceData.summary.weekendDaysWorked > 0
                                                ? 'Extra commitment shown!'
                                                : 'Regular schedule maintained'}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            navigate(`/worker/attendance/${id}?month=${prevMonth}&year=${prevYear}`);
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
                            navigate(`/worker/attendance/${id}?month=${nextMonth}&year=${nextYear}`);
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