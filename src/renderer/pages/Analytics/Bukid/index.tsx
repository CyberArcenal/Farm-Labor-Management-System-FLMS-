// pages/analytics/BukidReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Users,
    DollarSign,
    MapPin,
    Filter,
    Download,
    Calendar,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    RefreshCw,
    Eye,
    Layers,
    Activity,
    GitCompareArrows,
    GitCompare
} from 'lucide-react';
import dashboardAPI, {
    type BukidOverviewData,
    type BukidProductionTrendData,
    type BukidFinancialSummaryData,
    type CompareBukidsData,
    type BukidWorkerDistributionData
} from '../../../apis/dashboard';
import { formatCurrency, formatNumber, formatDate, formatPercentage } from '../../../utils/formatters';

const BukidReportsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('month');
    const [selectedBukid, setSelectedBukid] = useState<string | null>(null);
    
    // Data states
    const [overviewData, setOverviewData] = useState<BukidOverviewData | null>(null);
    const [productionTrendData, setProductionTrendData] = useState<BukidProductionTrendData | null>(null);
    const [financialData, setFinancialData] = useState<BukidFinancialSummaryData | null>(null);
    const [comparisonData, setComparisonData] = useState<CompareBukidsData | null>(null);
    const [workerDistributionData, setWorkerDistributionData] = useState<BukidWorkerDistributionData | null>(null);

    const navigate = useNavigate();

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [overviewRes, trendRes, financialRes, comparisonRes, workerRes] = await Promise.all([
                dashboardAPI.getBukidOverview({ timeRange }),
                dashboardAPI.getBukidProductionTrend({ timeRange, interval: timeRange === 'month' ? 'week' : 'day' }),
                dashboardAPI.getBukidFinancialSummary({ timeRange }),
                dashboardAPI.compareBukids({ timeRange }),
                dashboardAPI.getBukidWorkerDistribution({ timeRange })
            ]);

            if (overviewRes.status) setOverviewData(overviewRes.data);
            if (trendRes.status) setProductionTrendData(trendRes.data);
            if (financialRes.status) setFinancialData(financialRes.data);
            if (comparisonRes.status) setComparisonData(comparisonRes.data);
            if (workerRes.status) setWorkerDistributionData(workerRes.data);

        } catch (err: any) {
            setError(err.message);
            console.error('Failed to fetch bukid reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [timeRange]);

    const handleRefresh = async () => {
        await fetchAllData();
    };

    const handleExportData = () => {
        // Export functionality would go here
        console.log('Exporting bukid reports data');
    };

    const handleViewBukidDetails = (bukidId: string) => {
        navigate(`/farms/bukid/view/${bukidId}`);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'production', label: 'Production', icon: TrendingUp },
        { id: 'financial', label: 'Financial', icon: DollarSign },
        { id: 'workers', label: 'Workers', icon: Users },
        { id: 'comparison', label: 'Comparison', icon: GitCompareArrows }
    ];

    const timeRanges = [
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-3" style={{ borderColor: 'var(--primary-color)' }}></div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading bukid reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'var(--danger-light)', color: 'var(--danger-color)' }}>
                    <Activity className="w-6 h-6" />
                </div>
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>Error Loading Reports</p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <button
                    onClick={fetchAllData}
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

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <BarChart3 className="w-6 h-6" />
                        Bukid Analytics & Reports
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Comprehensive analysis of all bukid performance metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm transition-colors duration-300"
                        style={{
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        {timeRanges.map((range) => (
                            <option key={range.value} value={range.value}>
                                {range.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleRefresh}
                        className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                        style={{
                            background: 'var(--card-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                        title="Refresh data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleExportData}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--accent-green)',
                            color: 'white'
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors duration-200 ${isActive ? '' : 'hover:opacity-80'}`}
                            style={{
                                borderBottom: `2px solid ${isActive ? 'var(--primary-color)' : 'transparent'}`,
                                color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)'
                            }}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                            <Layers className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Bukids</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {overviewData?.summary.totalBukids || 0}
                            </h3>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs px-2 py-1 rounded-full"
                            style={{
                                background: 'var(--accent-green-light)',
                                color: 'var(--accent-green)'
                            }}
                        >
                            {overviewData?.summary.activeBukids || 0} active
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {overviewData?.summary.inactiveBukids || 0} inactive
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <MapPin className="w-5 h-5" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Pitaks</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {overviewData?.distribution.reduce((sum, item) => sum + item.pitakCount, 0) || 0}
                            </h3>
                        </div>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Across {overviewData?.distribution.length || 0} bukids
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
                            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Luwang</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {formatNumber(overviewData?.production.reduce((sum, item) => sum + item.totalLuwang, 0) || 0)}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center text-xs"
                        style={{ color: productionTrendData?.summary.totalLuwang! > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                    >
                        {productionTrendData?.summary.totalLuwang! > 0 ? (
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                            <ArrowDownRight className="w-3 h-3 mr-1" />
                        )}
                        {formatNumber(productionTrendData?.summary.totalLuwang || 0)} this period
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-purple-light)' }}>
                            <DollarSign className="w-5 h-5" style={{ color: 'var(--accent-purple)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Payments</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {formatCurrency(financialData?.summary.totalNetPay || 0)}
                            </h3>
                        </div>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {financialData?.summary.totalPayments || 0} transactions
                    </div>
                </div>
            </div>

            {/* Main Content based on Active Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Production Distribution */}
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <PieChart className="w-5 h-5" />
                            Luwang Distribution by Bukid
                        </h3>
                        <div className="space-y-3">
                            {overviewData?.production
                                .sort((a, b) => b.totalLuwang - a.totalLuwang)
                                .map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleViewBukidDetails(item.bukidId)}
                                        style={{ background: 'var(--card-secondary-bg)' }}
                                    >
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-3"
                                                style={{ background: `hsl(${index * 60}, 70%, 50%)` }}
                                            ></div>
                                            <div>
                                                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {item.bukidName}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {formatNumber(item.totalLuwang)} luwang
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Performance Ranking */}
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp className="w-5 h-5" />
                            Top Performing Bukids
                        </h3>
                        <div className="space-y-3">
                            {comparisonData?.bukids
                                .sort((a, b) => b.metrics.efficiency - a.metrics.efficiency)
                                .slice(0, 5)
                                .map((bukid, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg"
                                        style={{ background: 'var(--card-secondary-bg)' }}
                                    >
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold"
                                                style={{
                                                    background: index === 0 ? 'var(--accent-gold-light)' :
                                                        index === 1 ? 'var(--accent-silver-light)' :
                                                            index === 2 ? 'var(--accent-bronze-light)' : 'var(--card-bg)',
                                                    color: index === 0 ? 'var(--accent-gold)' :
                                                        index === 1 ? 'var(--accent-silver)' :
                                                            index === 2 ? 'var(--accent-bronze)' : 'var(--text-secondary)'
                                                }}
                                            >
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {bukid.name}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {bukid.kabisilya} • {bukid.metrics.pitaks} pitaks
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm" style={{ color: 'var(--accent-green)' }}>
                                                {formatPercentage(bukid.metrics.efficiency)}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                Efficiency
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'production' && productionTrendData && (
                <div className="p-5 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp className="w-5 h-5" />
                            Production Trend ({productionTrendData.interval})
                        </h3>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Total: {formatNumber(productionTrendData.summary.totalLuwang)} luwang
                        </div>
                    </div>
                    <div className="space-y-4">
                        {productionTrendData.trend.map((period, index) => (
                            <div key={index} className="p-4 rounded-lg"
                                style={{ background: 'var(--card-secondary-bg)' }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {period.period}
                                    </div>
                                    <div className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
                                        {formatNumber(period.totalLuwang)} luwang
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <span>{period.assignmentCount} assignments</span>
                                    <span>Avg: {formatNumber(period.averageLuwang)}/assignment</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${(period.totalLuwang / Math.max(...productionTrendData.trend.map(p => p.totalLuwang))) * 100}%`,
                                            background: 'linear-gradient(90deg, var(--accent-gold-light), var(--accent-gold))'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'financial' && financialData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <DollarSign className="w-5 h-5" />
                            Financial Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-lg text-center"
                                style={{ background: 'var(--card-secondary-bg)' }}
                            >
                                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {formatCurrency(financialData.summary.totalGrossPay)}
                                </div>
                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gross Pay</div>
                            </div>
                            <div className="p-4 rounded-lg text-center"
                                style={{ background: 'var(--card-secondary-bg)' }}
                            >
                                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {formatCurrency(financialData.summary.totalNetPay)}
                                </div>
                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Net Pay</div>
                            </div>
                            <div className="p-4 rounded-lg text-center"
                                style={{ background: 'var(--card-secondary-bg)' }}
                            >
                                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-red)' }}>
                                    {formatCurrency(financialData.summary.totalDeductions)}
                                </div>
                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Deductions</div>
                            </div>
                            <div className="p-4 rounded-lg text-center"
                                style={{ background: 'var(--card-secondary-bg)' }}
                            >
                                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-green)' }}>
                                    {formatCurrency(financialData.summary.averagePayPerLuwang)}
                                </div>
                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg/Luwang</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Recent Payments</h4>
                            <div className="space-y-2">
                                {financialData.payments.slice(0, 5).map((payment, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 rounded-lg"
                                        style={{ background: 'var(--card-secondary-bg)' }}
                                    >
                                        <div>
                                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {payment.workerName}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {payment.pitakLocation}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {formatCurrency(payment.netPay)}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {formatDate(payment.paymentDate)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Calendar className="w-5 h-5" />
                            Payment Timeline
                        </h3>
                        <div className="space-y-3">
                            {financialData.timeline.map((month, index) => (
                                <div key={index} className="p-4 rounded-lg"
                                    style={{ background: 'var(--card-secondary-bg)' }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {month.month}
                                        </div>
                                        <div className="font-semibold" style={{ color: 'var(--accent-green)' }}>
                                            {formatCurrency(month.netPay)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        <span>{month.count} payments</span>
                                        <span>{formatCurrency(month.grossPay)} gross</span>
                                    </div>
                                    <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <div className="flex-1">
                                            Deductions: {formatCurrency(month.deductions)}
                                        </div>
                                        <div>
                                            Rate: {formatPercentage(month.deductions / month.grossPay)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'workers' && workerDistributionData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Users className="w-5 h-5" />
                            Workers per Pitak
                        </h3>
                        <div className="space-y-3">
                            {workerDistributionData.workersPerPitak
                                .sort((a, b) => b.workerCount - a.workerCount)
                                .slice(0, 8)
                                .map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg"
                                        style={{ background: 'var(--card-secondary-bg)' }}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {item.pitakLocation}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {item.workerNames.slice(0, 2).join(', ')}
                                                {item.workerNames.length > 2 && ` +${item.workerNames.length - 2} more`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg" style={{ color: 'var(--accent-sky)' }}>
                                                {item.workerCount}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                workers
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="p-5 rounded-xl"
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <MapPin className="w-5 h-5" />
                            Worker Distribution Summary
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg text-center"
                                    style={{ background: 'var(--card-secondary-bg)' }}
                                >
                                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {workerDistributionData.summary.totalWorkers}
                                    </div>
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Workers</div>
                                </div>
                                <div className="p-4 rounded-lg text-center"
                                    style={{ background: 'var(--card-secondary-bg)' }}
                                >
                                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {workerDistributionData.summary.totalPitaks}
                                    </div>
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Pitaks</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span style={{ color: 'var(--text-secondary)' }}>Avg. Workers per Pitak</span>
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {workerDistributionData.summary.avgWorkersPerPitak.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(workerDistributionData.summary.avgWorkersPerPitak / 10) * 100}%`,
                                                background: 'linear-gradient(90deg, var(--accent-sky-light), var(--accent-sky))'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span style={{ color: 'var(--text-secondary)' }}>Avg. Pitaks per Worker</span>
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {workerDistributionData.summary.avgPitaksPerWorker.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(workerDistributionData.summary.avgPitaksPerWorker / 5) * 100}%`,
                                                background: 'linear-gradient(90deg, var(--accent-green-light), var(--accent-green))'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'comparison' && comparisonData && (
                <div className="p-5 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <GitCompare className="w-5 h-5" />
                            Bukid Comparison
                        </h3>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Average Efficiency: {formatPercentage(comparisonData.summary.averageEfficiency)}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Bukid</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Pitaks</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Luwang</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Efficiency</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Net Pay</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Rank</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.bukids.map((bukid, index) => (
                                    <tr key={index} className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleViewBukidDetails(bukid.bukidId)}
                                        style={{ borderBottom: '1px solid var(--border-color)' }}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {bukid.name}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {bukid.kabisilya}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {bukid.metrics.pitaks}
                                        </td>
                                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {formatNumber(bukid.metrics.totalLuwang)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <div className="w-16 h-2 rounded-full mr-2 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${bukid.metrics.efficiency}%`,
                                                            background: bukid.metrics.efficiency >= 80 ? 'var(--accent-green)' :
                                                                bukid.metrics.efficiency >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: bukid.metrics.efficiency >= 80 ? 'var(--accent-green)' :
                                                    bukid.metrics.efficiency >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                                                    {formatPercentage(bukid.metrics.efficiency)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {formatCurrency(bukid.metrics.totalNetPay)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                                                style={{
                                                    background: bukid.rankings.efficiency.rank === 1 ? 'var(--accent-gold-light)' :
                                                        bukid.rankings.efficiency.rank === 2 ? 'var(--accent-silver-light)' :
                                                            bukid.rankings.efficiency.rank === 3 ? 'var(--accent-bronze-light)' : 'var(--card-bg)',
                                                    color: bukid.rankings.efficiency.rank === 1 ? 'var(--accent-gold)' :
                                                        bukid.rankings.efficiency.rank === 2 ? 'var(--accent-silver)' :
                                                            bukid.rankings.efficiency.rank === 3 ? 'var(--accent-bronze)' : 'var(--text-secondary)'
                                                }}
                                            >
                                                #{bukid.rankings.efficiency.rank}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {comparisonData && (
                <div className="p-5 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Insights & Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg"
                            style={{
                                background: 'var(--accent-green-light)',
                                border: '1px solid var(--accent-green)20'
                            }}
                        >
                            <div className="font-medium text-sm mb-2" style={{ color: 'var(--accent-green-dark)' }}>
                                Top Performer
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {comparisonData.bukids[0]?.name} leads with {formatPercentage(comparisonData.bukids[0]?.metrics.efficiency || 0)} efficiency
                            </p>
                        </div>
                        <div className="p-4 rounded-lg"
                            style={{
                                background: 'var(--accent-sky-light)',
                                border: '1px solid var(--accent-sky)20'
                            }}
                        >
                            <div className="font-medium text-sm mb-2" style={{ color: 'var(--accent-sky-dark)' }}>
                                Average Performance
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Overall efficiency: {formatPercentage(comparisonData.summary.averageEfficiency)}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg"
                            style={{
                                background: 'var(--accent-yellow-light)',
                                border: '1px solid var(--accent-yellow)20'
                            }}
                        >
                            <div className="font-medium text-sm mb-2" style={{ color: 'var(--accent-yellow-dark)' }}>
                                Improvement Opportunity
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {comparisonData.bukids.length - 1} bukids below average efficiency
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BukidReportsPage;