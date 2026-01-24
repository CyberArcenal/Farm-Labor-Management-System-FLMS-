// components/KabisilyaDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users,
    TrendingUp,
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    Plus,
    Eye,
    ArrowUp,
    ArrowDown,
    Truck,
    Package,
    Home,
    BarChart3,
    FileText,
    Activity,
    Target,
    PieChart,
    Layers,
    UserCheck,
    Warehouse,
    ChevronRight,
    Percent,
    TrendingDown,
    X,
    MapPin,
    Sprout,
    CloudRain,
    Sun,
    Thermometer,
    Droplets,
    Wind,
    ThermometerSun
} from 'lucide-react';
import dashboardAPI, {
    type WorkersOverviewData,
    type FinancialOverviewData,
    type AssignmentOverviewData,
    type LiveDashboardData,
    type KabisilyaOverviewData
} from '../../apis/dashboard';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

const KabisilyaDashboardPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [workersData, setWorkersData] = useState<WorkersOverviewData | null>(null);
    const [financialData, setFinancialData] = useState<FinancialOverviewData | null>(null);
    const [assignmentsData, setAssignmentsData] = useState<AssignmentOverviewData | null>(null);
    const [liveData, setLiveData] = useState<LiveDashboardData | null>(null);
    const [kabisilyaData, setKabisilyaData] = useState<KabisilyaOverviewData | null>(null);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                workersRes,
                financialRes,
                assignmentsRes,
                liveRes,
                kabisilyaRes
            ] = await Promise.all([
                dashboardAPI.getWorkersOverview(),
                dashboardAPI.getFinancialOverview(),
                dashboardAPI.getAssignmentOverview(),
                dashboardAPI.getLiveDashboard(),
                dashboardAPI.getKabisilyaOverview()
            ]);

            if (workersRes.status) setWorkersData(workersRes.data);
            if (financialRes.status) setFinancialData(financialRes.data);
            if (assignmentsRes.status) setAssignmentsData(assignmentsRes.data);
            if (liveRes.status) setLiveData(liveRes.data);
            if (kabisilyaRes.status) setKabisilyaData(kabisilyaRes.data);

        } catch (err: any) {
            setError(err.message);
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);
            await fetchDashboardData();
        } catch (err: any) {
            setError(err.message);
            console.error('Failed to refresh dashboard data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Quick actions for the dashboard
    const quickActions = [
        { label: 'New Worker', path: '/workers/form', icon: Plus, color: 'green' },
        { label: 'Assign Work', path: '/assignments/form', icon: Package, color: 'blue' },
        { label: 'Record Payment', path: '/payments/form', icon: DollarSign, color: 'gold' },
        { label: 'View Reports', path: '/reports/workers', icon: TrendingUp, color: 'purple' }
    ];

    // Navigate functions
    const navigateToWorkers = () => navigate('/workers');
    const navigateToAssignments = () => navigate('/assignments');
    const navigateToPendingAssignments = () => navigate('/assignments/pending');
    const navigateToFinancialReports = () => navigate('/reports/financial');
    const navigateToKabisilyas = () => navigate('/kabisilyas');
    const navigateToDebts = () => navigate('/debts');
    const navigateToActiveAssignments = () => navigate('/assignments/active');
    const navigateToPaymentHistory = () => navigate('/payments');

    // Weather data (mock - would come from API in production)
    const weatherData = {
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        precipitation: 20,
        icon: 'partly-cloudy',
        forecast: [
            { day: 'Today', high: 29, low: 23, condition: 'partly-cloudy' },
            { day: 'Tomorrow', high: 30, low: 24, condition: 'sunny' },
            { day: 'Wed', high: 28, low: 23, condition: 'rain' }
        ]
    };

    // Season indicator
    const getCurrentSeason = () => {
        const month = new Date().getMonth();
        if (month >= 5 && month <= 10) return { name: 'Rainy Season', icon: CloudRain, color: 'var(--accent-sky)' };
        return { name: 'Dry Season', icon: Sun, color: 'var(--accent-gold)' };
    };

    const currentSeason = getCurrentSeason();

    if (loading) {
        return (
            <div className="compact-card rounded-lg transition-all duration-300 ease-in-out" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-center items-center h-48">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3 transition-colors duration-300" style={{ borderColor: 'var(--primary-color)' }}></div>
                        <p className="text-sm transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>Loading kabisilya dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="compact-card rounded-lg transition-all duration-300 ease-in-out" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="text-center p-6 transition-colors duration-300" style={{ color: 'var(--danger-color)' }}>
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 transition-colors duration-300" />
                    <p className="text-base font-semibold mb-1 transition-colors duration-300">Error Loading Dashboard</p>
                    <p className="text-sm mb-3 transition-colors duration-300">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="btn btn-primary btn-sm rounded-md flex items-center mx-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
                    >
                        <RefreshCw className="icon-sm mr-1" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 transition-all duration-300 ease-in-out">
            {/* Compact Page Header */}
            <div className="compact-card rounded-lg transition-all duration-300 ease-in-out" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center p-4">
                    <div className="transition-colors duration-300">
                        <h2 className="text-lg font-semibold flex items-center gap-1.5 transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                            <div className="w-1.5 h-5 rounded-full transition-colors duration-300" style={{ backgroundColor: 'var(--accent-green)' }}></div>
                            Kabisilya Management Dashboard
                        </h2>
                        <p className="text-xs transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                            Farm operations overview
                            {liveData && (
                                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--card-secondary-bg)', color: 'var(--primary-color)' }}>
                                    <Clock className="inline-block w-2.5 h-2.5 mr-0.5" />
                                    {formatDate(liveData.timestamp, 'HH:mm')}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 transition-colors duration-300">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="btn btn-secondary btn-sm rounded-md flex items-center transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md disabled:opacity-50"
                        >
                            <RefreshCw className={`icon-sm mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <div className="text-xs px-2 py-0.5 rounded-full transition-colors duration-300" style={{
                            backgroundColor: 'var(--card-secondary-bg)',
                            color: currentSeason.color
                        }}>
                            {React.createElement(currentSeason.icon, { className: "inline-block w-2.5 h-2.5 mr-0.5" })}
                            {currentSeason.name}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weather & Season Widget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 transition-all duration-300 ease-in-out">
                {/* Weather Widget */}
                <div className="compact-card rounded-lg transition-all duration-300 ease-in-out hover:shadow-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="p-4 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--sidebar-text)' }}>
                                <ThermometerSun className="icon-sm" />
                                Weather Conditions
                            </h3>
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-secondary)'
                            }}>
                                Now
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <div className="text-3xl font-bold" style={{ color: 'var(--sidebar-text)' }}>
                                    {weatherData.temperature}°C
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {weatherData.condition}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <Droplets className="w-3 h-3" style={{ color: 'var(--accent-sky)' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{weatherData.humidity}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wind className="w-3 h-3" style={{ color: 'var(--accent-sky)' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{weatherData.windSpeed} km/h</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CloudRain className="w-3 h-3" style={{ color: 'var(--accent-sky)' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{weatherData.precipitation}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Season Forecast */}
                <div className="compact-card rounded-lg transition-all duration-300 ease-in-out hover:shadow-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="p-4 transition-colors duration-300">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: 'var(--sidebar-text)' }}>
                            <Calendar className="icon-sm" />
                            3-Day Forecast
                        </h3>
                        <div className="space-y-2">
                            {weatherData.forecast.map((day, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                    <span style={{ color: 'var(--sidebar-text)' }}>{day.day}</span>
                                    <div className="flex items-center gap-2">
                                        {day.condition === 'sunny' && <Sun className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} />}
                                        {day.condition === 'rain' && <CloudRain className="w-3 h-3" style={{ color: 'var(--accent-sky)' }} />}
                                        {day.condition === 'partly-cloudy' && <CloudRain className="w-3 h-3" style={{ color: 'var(--accent-sky)' }} />}
                                        <span style={{ color: 'var(--text-secondary)' }}>{day.high}° / {day.low}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Farm Status */}
                <div className="compact-card rounded-lg transition-all duration-300 ease-in-out hover:shadow-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="p-4 transition-colors duration-300">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: 'var(--sidebar-text)' }}>
                            <Sprout className="icon-sm" />
                            Farm Status
                        </h3>
                        <div className="space-y-2">
                            {assignmentsData && (
                                <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: 'var(--text-secondary)' }}>Active Pitaks</span>
                                    <span className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                                        {assignmentsData.utilization.pitaks.active}/{assignmentsData.utilization.pitaks.total}
                                    </span>
                                </div>
                            )}
                            {assignmentsData && (
                                <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: 'var(--text-secondary)' }}>Worker Utilization</span>
                                    <span className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                                        {(assignmentsData.utilization.workers.utilizationRate * 100).toFixed(1)}%
                                    </span>
                                </div>
                            )}
                            {kabisilyaData && (
                                <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: 'var(--text-secondary)' }}>Active Kabisilyas</span>
                                    <span className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                                        {kabisilyaData.overallMetrics.totalKabisilyas}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-300 ease-in-out">
                {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    const colorClasses = {
                        green: { background: 'var(--accent-green)', hover: 'var(--accent-green-hover)' },
                        blue: { background: 'var(--accent-sky)', hover: 'var(--accent-sky-hover)' },
                        gold: { background: 'var(--accent-gold)', hover: 'var(--accent-gold-hover)' },
                        purple: { background: 'var(--accent-purple)', hover: 'var(--accent-purple-hover)' }
                    };

                    const colors = colorClasses[action.color as keyof typeof colorClasses];

                    return (
                        <Link
                            key={index}
                            to={action.path}
                            className="compact-card rounded-lg p-4 flex flex-col items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md group"
                            style={{ background: colors.background, border: '1px solid transparent' }}
                        >
                            <div className="relative transition-all duration-300 ease-in-out group-hover:scale-105">
                                <Icon className="icon-lg mb-2 transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }} />
                            </div>
                            <span className="text-xs font-medium text-center transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                                {action.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Compact Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-300 ease-in-out">
                {/* Total Workers Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3 transition-colors duration-300">
                        <div className="p-2 rounded-lg transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-sm" style={{ background: 'var(--accent-green-dark)' }}>
                            <Users className="icon-lg transition-colors duration-300" style={{ color: 'var(--accent-green)' }} />
                        </div>
                        {workersData && (
                            <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full transition-all duration-300 ease-in-out ${workersData.summary.activePercentage >= 70 ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--accent-yellow-light)] text-[var(--accent-yellow)]'}`}>
                                <UserCheck className="icon-xs mr-0.5" />
                                {workersData.summary.activePercentage}% active
                            </div>
                        )}
                    </div>
                    <h3
                        className="text-xl font-bold mb-0.5 transition-colors duration-300 group-hover:text-[var(--accent-green)] cursor-pointer hover:underline"
                        style={{ color: 'var(--sidebar-text)' }}
                        onClick={navigateToWorkers}
                    >
                        {workersData?.summary.total || 0}
                    </h3>
                    <p className="text-xs transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>Total Workers</p>
                    <div className="mt-3 pt-3 transition-colors duration-300" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div onClick={navigateToWorkers} className="text-xs font-medium hover:underline flex items-center transition-all duration-200 ease-in-out cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                            <Eye className="icon-xs mr-1" />
                            Manage Workers
                        </div>
                    </div>
                </div>

                {/* Active Assignments Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3 transition-colors duration-300">
                        <div className="p-2 rounded-lg transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-sm" style={{ background: 'var(--accent-sky-dark)' }}>
                            <Package className="icon-lg transition-colors duration-300" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        {assignmentsData && (
                            <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full transition-all duration-300 ease-in-out ${assignmentsData.summary.completionRate >= 80 ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--accent-yellow-light)] text-[var(--accent-yellow)]'}`}>
                                <CheckCircle className="icon-xs mr-0.5" />
                                {assignmentsData.summary.completionRate}%
                            </div>
                        )}
                    </div>
                    <h3
                        className="text-xl font-bold mb-0.5 transition-colors duration-300 group-hover:text-[var(--accent-sky)] cursor-pointer hover:underline"
                        style={{ color: 'var(--sidebar-text)' }}
                        onClick={navigateToAssignments}
                    >
                        {assignmentsData?.summary.activeAssignments || 0}
                    </h3>
                    <p className="text-xs transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>Active Assignments</p>
                    <div className="mt-3 pt-3 transition-colors duration-300" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div className="flex justify-between text-xs transition-colors duration-300">
                            <span
                                className="flex items-center cursor-pointer hover:underline"
                                style={{ color: 'var(--sidebar-text)' }}
                                onClick={navigateToPendingAssignments}
                            >
                                <Clock className="w-2.5 h-2.5 mr-0.5" style={{ color: 'var(--accent-yellow)' }} />
                                Pending: {assignmentsData?.summary?.totalAssignments - assignmentsData?.summary.completedAssignments || 0}
                            </span>
                            <div
                                className="font-medium hover:underline cursor-pointer transition-all duration-200 ease-in-out"
                                style={{ color: 'var(--primary-color)' }}
                                onClick={navigateToAssignments}
                            >
                                View All
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Debt Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3 transition-colors duration-300">
                        <div className="p-2 rounded-lg transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-sm" style={{ background: 'var(--accent-gold-dark)' }}>
                            <DollarSign className="icon-lg transition-colors duration-300" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        {financialData && (
                            <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full transition-all duration-300 ease-in-out ${financialData.debts.collectionRate >= 70 ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--accent-red-light)] text-[var(--accent-red)]'}`}>
                                <Percent className="icon-xs mr-0.5" />
                                {financialData.debts.collectionRate}% collected
                            </div>
                        )}
                    </div>
                    <h3
                        className="text-xl font-bold mb-0.5 transition-colors duration-300 group-hover:text-[var(--accent-gold)] cursor-pointer hover:underline"
                        style={{ color: 'var(--sidebar-text)' }}
                        onClick={navigateToDebts}
                    >
                        {formatCurrency(financialData?.debts.totalBalance || 0)}
                    </h3>
                    <p className="text-xs transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>Outstanding Debt</p>
                    <div className="mt-3 pt-3 transition-colors duration-300" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Total: {formatCurrency(financialData?.debts.totalAmount || 0)}
                        </div>
                        <div onClick={navigateToDebts} className="text-xs font-medium hover:underline flex items-center transition-all duration-200 ease-in-out cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                            <Eye className="icon-xs mr-1" />
                            Manage Debts
                        </div>
                    </div>
                </div>

                {/* Today's Payments Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3 transition-colors duration-300">
                        <div className="p-2 rounded-lg transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-sm" style={{ background: 'var(--accent-earth-dark)' }}>
                            <TrendingUp className="icon-lg transition-colors duration-300" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        {financialData && (
                            <div className="flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full transition-all duration-300 ease-in-out" style={{
                                backgroundColor: 'var(--accent-green-light)',
                                color: 'var(--accent-green)'
                            }}>
                                <ArrowUp className="icon-xs mr-0.5" />
                                {formatPercentage(financialData.payments.growthRate)}
                            </div>
                        )}
                    </div>
                    <h3
                        className="text-xl font-bold mb-0.5 transition-colors duration-300 group-hover:text-[var(--accent-earth)] cursor-pointer hover:underline"
                        style={{ color: 'var(--sidebar-text)' }}
                        onClick={navigateToPaymentHistory}
                    >
                        {formatCurrency(financialData?.payments.currentMonth.net || 0)}
                    </h3>
                    <p className="text-xs transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>This Month's Net Pay</p>
                    <div className="mt-3 pt-3 transition-colors duration-300" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                            {financialData?.payments.currentMonth.count || 0} payments
                        </div>
                        <div onClick={navigateToPaymentHistory} className="text-xs font-medium hover:underline flex items-center transition-all duration-200 ease-in-out cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                            <Eye className="icon-xs mr-1" />
                            Payment History
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Overview Section */}
            {liveData && (
                <div className="compact-card rounded-lg transition-all duration-300 ease-in-out hover:shadow-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="p-4 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-4 transition-colors duration-300">
                            <h3 className="text-base font-semibold flex items-center gap-1.5 transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                                <Activity className="icon-sm transition-colors duration-300" />
                                Today's Activity
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                                    {formatDate(new Date(), 'MMM dd, yyyy')}
                                </span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 transition-all duration-300 ease-in-out">
                            <div
                                className="text-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:shadow-sm cursor-pointer hover:bg-[var(--card-hover-bg)]"
                                style={{ background: 'var(--card-secondary-bg)' }}
                                onClick={navigateToAssignments}
                            >
                                <Package className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--accent-sky)' }} />
                                <div className="text-lg font-bold mb-0.5" style={{ color: 'var(--sidebar-text)' }}>
                                    {liveData.overview.assignments.today}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Today's Assignments</div>
                            </div>
                            <div
                                className="text-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:shadow-sm cursor-pointer hover:bg-[var(--card-hover-bg)]"
                                style={{ background: 'var(--card-secondary-bg)' }}
                                onClick={navigateToPaymentHistory}
                            >
                                <DollarSign className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--accent-green)' }} />
                                <div className="text-lg font-bold mb-0.5" style={{ color: 'var(--sidebar-text)' }}>
                                    {formatCurrency(liveData.overview.financial.todayPayments)}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Today's Payments</div>
                            </div>
                            <div
                                className="text-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:shadow-sm cursor-pointer hover:bg-[var(--card-hover-bg)]"
                                style={{ background: 'var(--card-secondary-bg)' }}
                                onClick={navigateToActiveAssignments}
                            >
                                <Users className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--accent-purple)' }} />
                                <div className="text-lg font-bold mb-0.5" style={{ color: 'var(--sidebar-text)' }}>
                                    {liveData.overview.workers.totalActive}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active Workers</div>
                            </div>
                            <div
                                className="text-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:shadow-sm cursor-pointer hover:bg-[var(--card-hover-bg)]"
                                style={{ background: 'var(--card-secondary-bg)' }}
                                onClick={() => navigate('/pitaks')}
                            >
                                <MapPin className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--accent-earth)' }} />
                                <div className="text-lg font-bold mb-0.5" style={{ color: 'var(--sidebar-text)' }}>
                                    {liveData.overview.resources.activePitaks}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active Pitaks</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Second Row - Financial & Worker Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 transition-all duration-300 ease-in-out">
                {/* Financial Overview Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-4 transition-colors duration-300">
                        <h3
                            className="font-semibold flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[var(--accent-green)] cursor-pointer hover:underline"
                            style={{ color: 'var(--sidebar-text)' }}
                            onClick={navigateToFinancialReports}
                        >
                            <BarChart3 className="icon-sm transition-colors duration-300" />
                            Financial Overview
                        </h3>
                    </div>
                    <div className="space-y-4 transition-colors duration-300">
                        {financialData && (
                            <>
                                {/* Key Financial Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Total Debt', value: formatCurrency(financialData.debts.totalAmount), icon: DollarSign, color: 'var(--accent-gold)', onClick: navigateToDebts },
                                        { label: 'Collection Rate', value: `${financialData.debts.collectionRate}%`, icon: Percent, color: financialData.debts.collectionRate >= 70 ? 'var(--accent-green)' : 'var(--accent-red)', onClick: navigateToFinancialReports },
                                        { label: 'Avg. Interest', value: `${financialData.debts.averageInterestRate}%`, icon: TrendingUp, color: 'var(--accent-sky)', onClick: navigateToFinancialReports },
                                        { label: 'Upcoming Due', value: financialData.upcomingDueDates.length, icon: Calendar, color: 'var(--accent-purple)', onClick: navigateToDebts }
                                    ].map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-2 rounded-md transition-all duration-200 ease-in-out hover:bg-[var(--card-hover-bg)] cursor-pointer"
                                            onClick={item.onClick}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {item.icon && React.createElement(item.icon, { className: "icon-xs", style: { color: item.color } })}
                                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                            </div>
                                            <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Debt Status Breakdown */}
                                <div className="space-y-1.5">
                                    <div className="text-xs font-medium transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                                        Debt Status
                                    </div>
                                    <div className="space-y-1.5">
                                        {financialData.debtStatusBreakdown.map((status, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{
                                                        backgroundColor: status.status === 'active' ? 'var(--accent-green)' :
                                                            status.status === 'overdue' ? 'var(--accent-red)' :
                                                                'var(--accent-gold)'
                                                    }}></div>
                                                    <span className="text-xs capitalize" style={{ color: 'var(--sidebar-text)' }}>{status.status}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>{formatCurrency(status.totalBalance)}</span>
                                                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                                                        background: 'var(--card-bg)',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        {status.count}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Worker Performance Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-4 transition-colors duration-300">
                        <h3
                            className="font-semibold flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[var(--accent-sky)] cursor-pointer hover:underline"
                            style={{ color: 'var(--sidebar-text)' }}
                            onClick={navigateToWorkers}
                        >
                            <UserCheck className="icon-sm transition-colors duration-300" />
                            Worker Performance
                        </h3>
                    </div>
                    <div className="space-y-4 transition-colors duration-300">
                        {workersData && assignmentsData && (
                            <>
                                {/* Performance Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Active Workers', value: workersData.summary.active, icon: UserCheck, color: 'var(--accent-green)', onClick: navigateToWorkers },
                                        { label: 'Avg. Debt', value: formatCurrency(workersData.financial.averageDebt), icon: DollarSign, color: 'var(--accent-gold)', onClick: navigateToDebts },
                                        { label: 'Completion Rate', value: `${assignmentsData.summary.completionRate}%`, icon: CheckCircle, color: assignmentsData.summary.completionRate >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', onClick: navigateToAssignments },
                                        { label: 'Avg. Assignments', value: assignmentsData.luwangMetrics.averagePerWorker.toFixed(1), icon: Package, color: 'var(--accent-sky)', onClick: navigateToAssignments }
                                    ].map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-2 rounded-md transition-all duration-200 ease-in-out hover:bg-[var(--card-hover-bg)] cursor-pointer"
                                            onClick={item.onClick}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {item.icon && React.createElement(item.icon, { className: "icon-xs", style: { color: item.color } })}
                                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                            </div>
                                            <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Top Debtors */}
                                <div className="space-y-1.5">
                                    <div className="text-xs font-medium transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                                        Top Debtors
                                    </div>
                                    <div className="space-y-1.5">
                                        {workersData.financial.topDebtors.slice(0, 3).map((debtor, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 rounded-md transition-all duration-200 ease-in-out hover:bg-[var(--card-hover-bg)] cursor-pointer"
                                                onClick={() => navigate(`/workers/view/${debtor.id}`)}
                                            >
                                                <div>
                                                    <div className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>{debtor.name}</div>
                                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: {formatCurrency(debtor.currentBalance)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-medium" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(debtor.totalDebt)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activities & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 transition-all duration-300 ease-in-out">
                {/* Recent Activities Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-4 transition-colors duration-300">
                        <h3
                            className="font-semibold flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[var(--accent-purple)] cursor-pointer hover:underline"
                            style={{ color: 'var(--sidebar-text)' }}
                            onClick={() => navigate('/audit-logs')}
                        >
                            <Activity className="icon-sm transition-colors duration-300" />
                            Recent Activities
                        </h3>
                        <div onClick={() => navigate('/audit-logs')} className="text-xs hover:underline flex items-center transition-all duration-200 ease-in-out cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                            View all
                            <ChevronRight className="w-3 h-3 ml-0.5" />
                        </div>
                    </div>
                    <div className="space-y-3 transition-colors duration-300">
                        {liveData?.recentActivities.slice(0, 5).map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-2 rounded-md transition-all duration-300 ease-in-out hover:bg-[var(--card-hover-bg)] group/item cursor-pointer"
                                onClick={() => {
                                    if (activity.type === 'assignment') navigate(`/assignments/view/${activity.id}`);
                                    if (activity.type === 'payment') navigate(`/payments/view/${activity.id}`);
                                }}
                            >
                                <div className="relative mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 ease-in-out" style={{
                                        background: activity.type === 'assignment' ? 'var(--accent-sky)' :
                                            activity.type === 'payment' ? 'var(--accent-green)' :
                                                'var(--accent-gold)'
                                    }}></div>
                                    {index < Math.min(liveData.recentActivities.length - 1, 4) && (
                                        <div className="absolute top-1.5 left-0.25 w-0.5 h-5" style={{ background: 'var(--border-color)' }}></div>
                                    )}
                                </div>
                                <div className="flex-1 transition-colors duration-300">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                                            {activity.workerName} - {activity.action}
                                        </p>
                                        <span className="text-xs px-1.5 py-0.5 rounded-full capitalize" style={{
                                            background: activity.status === 'completed' ? 'var(--accent-green-light)' :
                                                activity.status === 'pending' ? 'var(--accent-yellow-light)' :
                                                    'var(--accent-red-light)',
                                            color: activity.status === 'completed' ? 'var(--accent-green)' :
                                                activity.status === 'pending' ? 'var(--accent-yellow)' :
                                                    'var(--accent-red)'
                                        }}>
                                            {activity.status}
                                        </span>
                                    </div>
                                    <p className="text-xs transition-colors duration-300" style={{ color: 'var(--sidebar-text)' }}>
                                        {activity.pitakLocation && `Location: ${activity.pitakLocation}`}
                                        {activity.luwangCount && ` • Luwang: ${activity.luwangCount}`}
                                        {activity.netPay && ` • Amount: ${formatCurrency(activity.netPay)}`}
                                    </p>
                                    <p className="text-xs mt-0.5 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                                        <Clock className="inline-block w-2.5 h-2.5 mr-0.5" />
                                        {formatDate(activity.timestamp, 'HH:mm')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerts & Notifications Card */}
                <div className="compact-card rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md group" style={{ background: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-4 transition-colors duration-300">
                        <h3 className="font-semibold flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[var(--accent-red)]" style={{ color: 'var(--sidebar-text)' }}>
                            <AlertTriangle className="icon-sm transition-colors duration-300" />
                            Alerts & Notifications
                            {liveData?.alerts && liveData.alerts.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full transition-colors duration-300" style={{
                                    background: 'var(--accent-red-light)',
                                    color: 'var(--accent-red)'
                                }}>
                                    {liveData.alerts.length} new
                                </span>
                            )}
                        </h3>
                    </div>
                    <div className="space-y-3 transition-colors duration-300">
                        {liveData?.alerts && liveData.alerts.length > 0 ? (
                            liveData.alerts.slice(0, 4).map((alert, index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-md transition-all duration-200 ease-in-out hover:bg-[var(--card-hover-bg)] cursor-pointer"
                                    onClick={() => {
                                        // Handle alert click based on type
                                        if (alert.type === 'debt') navigate('/debts');
                                        if (alert.type === 'assignment') navigate('/assignments');
                                    }}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`p-1 rounded-full ${alert.priority === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                            {alert.priority === 'high' ? (
                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--sidebar-text)' }}>
                                                {alert.title}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {alert.message}
                                            </div>
                                            {alert.details && (
                                                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                    {alert.details.map((detail, idx) => (
                                                        <span key={idx} className="inline-block mr-2">
                                                            {detail}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent-green)' }} />
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No alerts at this time</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>All systems are running smoothly</p>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="mt-4 pt-4 transition-colors duration-300" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <div className="grid grid-cols-3 gap-2 text-xs text-center">
                                <div>
                                    <div className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                                        {liveData?.quickStats.averageAssignmentTime?.toFixed(1) || '0.0'}h
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>Avg. Time</div>
                                </div>
                                <div>
                                    <div className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                                        {formatCurrency(liveData?.quickStats.averagePaymentAmount || 0)}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>Avg. Payment</div>
                                </div>
                                <div>
                                    <div className="font-medium" style={{ color: 'var(--sidebar-text)' }}>
                                        {(liveData?.quickStats.debtCollectionRate || 0).toFixed(1)}%
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>Collection</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KabisilyaDashboardPage;